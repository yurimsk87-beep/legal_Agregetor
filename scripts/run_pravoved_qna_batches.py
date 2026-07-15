"""Batch orchestrator for Pravoved Q&A: collect URLs from sitemap once, then per
batch scrape -> prepare -> import (--append). State (offset/published) is saved
each batch so the run is resumable. Mirrors run_harant_qna_batches.py but uses
deterministic sitemap offsets instead of WordPress AJAX state.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARSER_DIR = ROOT / "pravoved_questions_parser"
sys.path.insert(0, str(PARSER_DIR))

from pravoved_questions_parser import (  # noqa: E402
    build_question_url,
    build_session,
    collect_question_ids,
    parse_question_detail,
    save_to_excel,
)

DEFAULT_OUTPUT_DIR = PARSER_DIR / "outputs" / "pravoved_qna_batches"
RULES_PATHS = (ROOT / "mvp" / "QNA_CONTENT_RULES.md", ROOT / "QNA_CONTENT_RULES.md")
NPM = "npm.cmd" if os.name == "nt" else "npm"


def parse_args():
    parser = argparse.ArgumentParser(description="Батчевый сбор и импорт Q&A с pravoved.ru.")
    parser.add_argument("--total", type=int, default=30000, help="Сколько новых вопросов опубликовать (net, после дедупа).")
    parser.add_argument("--batch-size", type=int, default=200, help="Сколько URL обрабатывать за батч.")
    parser.add_argument("--sitemap-index", default="https://pravoved.ru/sitemap.xml", help="Индекс sitemap.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Каталог батчевых файлов.")
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout.")
    parser.add_argument("--delay", type=float, default=0.35, help="Пауза между карточками (на воркер).")
    parser.add_argument("--workers", type=int, default=8, help="Сколько карточек тянуть параллельно.")
    parser.add_argument("--answers", choices=("first", "all"), default="all", help="Первый или все ответы юристов.")
    parser.add_argument("--newest-first", action="store_true", help="Сначала свежие вопросы (по id). Иначе — старые.")
    parser.add_argument("--start-offset", type=int, default=0, help="С какого индекса в списке URL начинать.")
    parser.add_argument("--max-empty-batches", type=int, default=40, help="Стоп после стольких батчей подряд без новых импортов.")
    parser.add_argument("--resume", action="store_true", help="Продолжить по state.json.")
    return parser.parse_args()


def log(message, log_path):
    line = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}"
    print(line, flush=True)
    with log_path.open("a", encoding="utf-8") as file:
        file.write(line + "\n")


def run_command(command, log_path):
    log("$ " + " ".join(str(part) for part in command), log_path)
    env = os.environ.copy()
    env.setdefault("PYTHONIOENCODING", "utf-8")
    env.setdefault("PYTHONUTF8", "1")
    result = subprocess.run(command, cwd=ROOT, text=True, encoding="utf-8", errors="replace", capture_output=True, env=env)
    if result.stdout:
        log(result.stdout.strip(), log_path)
    if result.stderr:
        log(result.stderr.strip(), log_path)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(str(p) for p in command)}")
    return result.stdout


def ensure_rules_file(log_path):
    for path in RULES_PATHS:
        if path.exists():
            log(f"Using Q&A rules: {path}", log_path)
            return
    raise RuntimeError("QNA_CONTENT_RULES.md not found in mvp/ or project root.")


def parse_imported_count(stdout):
    match = re.search(r"Imported questions:\s*(\d+)", stdout)
    return int(match.group(1)) if match else 0


def default_state():
    return {"published": 0, "offset": 0, "batch": 1, "emptyStreak": 0}


def load_state(state_path):
    if not state_path.exists():
        return default_state()
    return json.loads(state_path.read_text(encoding="utf-8"))


def save_state(state_path, state):
    state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    args = parse_args()
    if args.total < 1 or args.batch_size < 1:
        raise SystemExit("--total and --batch-size must be positive.")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    log_path = args.output_dir / "pravoved_qna_batch_run.log"
    state_path = args.output_dir / "state.json"
    ensure_rules_file(log_path)

    state = load_state(state_path) if args.resume else default_state()
    if not args.resume and args.start_offset:
        state["offset"] = args.start_offset

    session = build_session()
    log("Collecting question URLs from sitemap...", log_path)
    # Память: держим только id (URL восстанавливаем по батчу), иначе список из
    # >1.5 млн URL-строк падал с MemoryError при сборе sitemap.
    all_ids = collect_question_ids(
        session=session,
        index_url=args.sitemap_index,
        timeout=args.timeout,
        newest_first=args.newest_first,
    )
    log(f"Collected {len(all_ids)} question URLs. Starting at offset={state['offset']}, published={state['published']}.", log_path)

    # Per-thread session: requests.Session is not meant for concurrent reuse.
    thread_local = threading.local()

    def get_session():
        session_obj = getattr(thread_local, "session", None)
        if session_obj is None:
            session_obj = build_session()
            thread_local.session = session_obj
        return session_obj

    def fetch_record(url):
        try:
            record = parse_question_detail(get_session(), url, args.timeout, args.answers)
        except Exception:
            return None
        if args.delay:
            time.sleep(args.delay)
        return record if record.lawyer_answer else None

    while state["published"] < args.total and state["offset"] < len(all_ids):
        batch_number = state["batch"]
        batch_ids = all_ids[state["offset"] : state["offset"] + args.batch_size]
        state["offset"] += len(batch_ids)
        if len(batch_ids) == 0:  # numpy-массив: нельзя `if not arr`
            break
        batch_urls = [build_question_url(int(question_id_value)) for question_id_value in batch_ids]

        batch_dir = args.output_dir / f"batch_{batch_number:04d}"
        batch_dir.mkdir(parents=True, exist_ok=True)
        raw_xlsx = batch_dir / f"pravoved_batch_{batch_number:04d}_raw.xlsx"
        import_json = batch_dir / f"pravoved_batch_{batch_number:04d}_site_import.json"
        enriched_xlsx = batch_dir / f"pravoved_batch_{batch_number:04d}_enriched.xlsx"

        log(f"Batch {batch_number}: urls={len(batch_urls)}, offset_now={state['offset']}, published={state['published']}", log_path)

        records = []
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
            for record in executor.map(fetch_record, batch_urls):
                if record is not None:
                    records.append(record)

        imported = 0
        if records:
            try:
                save_to_excel(records, raw_xlsx, include_meta=True)
                run_command(
                    [sys.executable, str(ROOT / "scripts" / "prepare_harant_qna_import.py"),
                     "--input", str(raw_xlsx), "--output-json", str(import_json), "--output-xlsx", str(enriched_xlsx)],
                    log_path,
                )
                stdout = run_command(
                    [NPM, "run", "import:qna:pravoved", "--", "--input", str(import_json), "--append", "--require-public-answer"],
                    log_path,
                )
                imported = parse_imported_count(stdout)
                state["published"] += imported
            except Exception as error:
                log(f"Batch {batch_number}: SKIPPED after error: {type(error).__name__}: {error}", log_path)
        else:
            log(f"Batch {batch_number}: no answered records.", log_path)

        state["emptyStreak"] = 0 if imported > 0 else state["emptyStreak"] + 1
        log(f"Batch {batch_number}: answered={len(records)}, imported={imported}, total_published={state['published']}, emptyStreak={state['emptyStreak']}", log_path)
        state["batch"] += 1
        save_state(state_path, state)

        if state["emptyStreak"] >= args.max_empty_batches:
            log(f"Stopping: {state['emptyStreak']} batches without new imports (likely overlap/exhausted).", log_path)
            break

    save_state(state_path, state)
    log(f"Finished. Published this state: {state['published']}. Offset: {state['offset']}/{len(all_ids)}.", log_path)


if __name__ == "__main__":
    main()
