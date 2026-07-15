import argparse
import json
import os
import re
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


ROOT = Path(__file__).resolve().parents[1]
PARSER_DIR = ROOT / "harant_questions_parser"
sys.path.insert(0, str(PARSER_DIR))

from harant_questions_parser import (  # noqa: E402
    build_session,
    extract_load_more_payload,
    fetch_soup,
    find_question_urls,
    load_more_questions,
    parse_question_detail,
    save_to_excel,
)


DEFAULT_OUTPUT_DIR = PARSER_DIR / "outputs" / "harant_qna_10000_batches"
RULES_PATHS = (ROOT / "mvp" / "QNA_CONTENT_RULES.md", ROOT / "QNA_CONTENT_RULES.md")

# npm/npx ship as .cmd shims only on Windows; on Linux/macOS use the bare names.
NPM = "npm.cmd" if os.name == "nt" else "npm"
NPX = "npx.cmd" if os.name == "nt" else "npx"


BAD_TITLE_FRAGMENTS = (
    "мождноли",
    "веренцификац",
    "бнз оплаты",
    "лутше",
    "росч",
    "компенсацый",
    "что делать в этой ситуации",
    "что делать дальше",
    "как выйти из положения",
    "как с вами связаться",
    "написать в max",
    "судебная практика выигранных дел",
)

BAD_ANSWER_FRAGMENTS = (
    "pravoved.ru/lawyer",
    "напишите мне",
    "напишите в чат",
    "пишите в чат",
    "в личное сообщение",
    "личное сообщение",
    "личный чат",
    "whatsapp",
    "telegram",
    "поставьте оценку",
    "поставить оценку",
    "оцените ответ",
    "донат",
    "ссылка для перехода",
    "кнопку «обратиться к юристу»",
    "кнопку \"обратиться к юристу\"",
    "не пользуюсь нейросетями",
)

BAD_QUESTION_FRAGMENTS = (
    "прошу оценить возможные действия, сроки, документы и риски",
    "[контакт скрыт платформой]",
)


def parse_args():
    parser = argparse.ArgumentParser(description="Harant Q&A: 100 parse -> prepare -> validate -> append import.")
    parser.add_argument("--total", type=int, default=10000, help="Сколько новых вопросов попытаться опубликовать.")
    parser.add_argument("--batch-size", type=int, default=100, help="Размер батча карточек Harant.")
    parser.add_argument("--url-limit", type=int, default=0, help="Сколько ссылок Harant максимум обработать; 0 без лимита.")
    parser.add_argument("--questions-url", default="https://harant.ru/questions/", help="Стартовая страница Harant.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Каталог батчевых файлов.")
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout.")
    parser.add_argument("--delay", type=float, default=0.25, help="Пауза между карточками.")
    parser.add_argument("--workers", type=int, default=1, help="Сколько карточек Harant парсить параллельно.")
    parser.add_argument("--log-each-url", action="store_true", help="Писать в лог каждую карточку, а не только прогресс.")
    parser.add_argument("--progress-interval", type=int, default=10, help="Как часто писать прогресс карточек в лог.")
    parser.add_argument("--max-load-more", type=int, default=1300, help="Максимум AJAX «Показать еще».")
    parser.add_argument("--answers", choices=("first", "all"), default="first", help="Первый или все ответы.")
    parser.add_argument("--resume", action="store_true", help="Продолжить по state.json и сохраненному списку URL.")
    parser.add_argument("--verify-db-each-batch", action="store_true", help="Дополнительно запускать DB-проверку после каждого импорта.")
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
    result = subprocess.run(
        command,
        cwd=ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        env=env,
    )
    if result.stdout:
        log(result.stdout.strip(), log_path)
    if result.stderr:
        log(result.stderr.strip(), log_path)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed with code {result.returncode}: {' '.join(str(part) for part in command)}")
    return result.stdout


def default_state():
    return {
        "published": 0,
        "batch": 1,
        "queue": [],
        "seenUrls": [],
        "payload": None,
        "initialLoaded": False,
        "loadMoreCount": 0,
        "sourceExhausted": False,
    }


def load_state(state_path):
    if not state_path.exists():
        return default_state()
    return json.loads(state_path.read_text(encoding="utf-8"))


def save_state(state_path, state):
    state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def add_unique_urls(queue, seen_urls, found_urls):
    added = 0
    for url in found_urls:
        if url in seen_urls:
            continue
        seen_urls.add(url)
        queue.append(url)
        added += 1
    return added


def ensure_initial_loaded(args, state, session, log_path):
    if state.get("initialLoaded"):
        return

    log("Loading initial Harant questions page...", log_path)
    soup = fetch_soup(session, args.questions_url, args.timeout)
    queue = state.setdefault("queue", [])
    seen_urls = set(state.setdefault("seenUrls", []))
    added = add_unique_urls(queue, seen_urls, find_question_urls(soup, args.questions_url))
    state["seenUrls"] = list(seen_urls)
    state["payload"] = extract_load_more_payload(soup)
    state["initialLoaded"] = True
    log(f"Initial page loaded: added_urls={added}, queue={len(queue)}", log_path)


def load_until_queue(args, state, session, min_count, log_path):
    ensure_initial_loaded(args, state, session, log_path)
    queue = state.setdefault("queue", [])
    seen_urls = set(state.setdefault("seenUrls", []))
    empty_loads = 0

    while len(queue) < min_count and not state.get("sourceExhausted"):
        if args.url_limit and len(seen_urls) >= args.url_limit:
            state["sourceExhausted"] = True
            break
        if state.get("loadMoreCount", 0) >= args.max_load_more:
            state["sourceExhausted"] = True
            break

        payload = state.get("payload")
        if not payload:
            state["sourceExhausted"] = True
            break
        if payload.get("current_page", "").isdigit() and payload.get("max_pages", "").isdigit():
            if int(payload["current_page"]) >= int(payload["max_pages"]):
                state["sourceExhausted"] = True
                break

        loaded_soup = None
        next_payload = payload
        for attempt in range(1, 4):
            try:
                loaded_soup, next_payload = load_more_questions(session, payload, args.questions_url, args.timeout)
                break
            except Exception as error:
                log(
                    f"Load more error attempt {attempt}/3: {type(error).__name__}: {error}",
                    log_path,
                )
                time.sleep(min(2 * attempt, 8))
                session = build_session()
        else:
            log("Load more failed after retries; continuing with current queue.", log_path)
            break

        state["payload"] = next_payload
        state["loadMoreCount"] = state.get("loadMoreCount", 0) + 1
        if loaded_soup is None:
            state["sourceExhausted"] = True
            break

        added = add_unique_urls(queue, seen_urls, find_question_urls(loaded_soup, args.questions_url))
        state["seenUrls"] = list(seen_urls)
        log(
            f"Loaded more: page_calls={state['loadMoreCount']}, added_urls={added}, queue={len(queue)}, seen={len(seen_urls)}",
            log_path,
        )
        if added == 0:
            empty_loads += 1
            # On --resume the feed may have shifted by many pages of already-seen
            # questions (Harant orders newest-first and grows over time), so allow
            # a wide overlap band before declaring the source exhausted.
            if empty_loads >= 400:
                state["sourceExhausted"] = True
                break
            continue
        empty_loads = 0


def parse_batch(args, urls, batch_number, raw_xlsx, log_path):
    def should_log_progress(index):
        interval = max(args.progress_interval, 1)
        return args.log_each_url or index == 1 or index == len(urls) or index % interval == 0

    if args.workers <= 1:
        session = build_session()
        records = []
        for index, url in enumerate(urls, start=1):
            if should_log_progress(index):
                log(f"Batch {batch_number}: [{index}/{len(urls)}] {url}", log_path)
            try:
                record = parse_question_detail(session, url, args.timeout, args.answers)
            except Exception as error:
                log(f"Skipped parse error: {error}", log_path)
                continue
            if not record.lawyer_answer:
                log("Skipped: no lawyer answer.", log_path)
                continue
            records.append((index, record))
            if args.delay:
                time.sleep(args.delay)
    else:
        workers = min(args.workers, len(urls))
        records = []

        def parse_one(index, url):
            session = build_session()
            try:
                record = parse_question_detail(session, url, args.timeout, args.answers)
            except Exception as error:
                return index, url, None, str(error)
            return index, url, record, ""

        log(f"Batch {batch_number}: parsing with {workers} workers.", log_path)
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(parse_one, index, url) for index, url in enumerate(urls, start=1)]
            for future in as_completed(futures):
                index, url, record, error = future.result()
                if should_log_progress(index):
                    log(f"Batch {batch_number}: [{index}/{len(urls)}] {url}", log_path)
                if error:
                    log(f"Skipped parse error: {error}", log_path)
                    continue
                if not record or not record.lawyer_answer:
                    log("Skipped: no lawyer answer.", log_path)
                    continue
                records.append((index, record))

    if records:
        ordered_records = [record for _, record in sorted(records, key=lambda item: item[0])]
        save_to_excel(ordered_records, raw_xlsx, include_meta=True)
    return len(records)


def validate_prepared_json(json_path, report_path):
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    rows = payload.get("rows", [])
    errors = []
    seen_questions = set()
    seen_titles = set()

    for index, row in enumerate(rows, start=1):
        title = str(row.get("rawTitle", "")).strip()
        question = str(row.get("rawQuestion", "")).strip()
        answer = str(row.get("lawyerAnswer", "")).strip()
        lower_title = title.lower()
        lower_question = question.lower()
        lower_answer = answer.lower()
        title_words = re.findall(r"[A-Za-zА-Яа-яЁё0-9]+", title)
        question_key = normalize_key(question)
        title_key = normalize_key(title)

        if not title.endswith("?"):
            errors.append({"row": index, "field": "rawTitle", "reason": "title_not_question", "value": title})
        if len(title_words) < 5 or len(title_words) > 16:
            errors.append({"row": index, "field": "rawTitle", "reason": "title_word_count", "value": title})
        if title and title == title.upper() and re.search(r"[А-ЯЁA-Z]", title):
            errors.append({"row": index, "field": "rawTitle", "reason": "title_all_caps", "value": title})
        if any(fragment in lower_title for fragment in BAD_TITLE_FRAGMENTS):
            errors.append({"row": index, "field": "rawTitle", "reason": "bad_title_fragment", "value": title})
        if question_key in seen_questions:
            errors.append({"row": index, "field": "rawQuestion", "reason": "duplicate_question", "value": title})
        if title_key in seen_titles:
            errors.append({"row": index, "field": "rawTitle", "reason": "duplicate_title", "value": title})
        if any(fragment in lower_question for fragment in BAD_QUESTION_FRAGMENTS):
            errors.append({"row": index, "field": "rawQuestion", "reason": "bad_question_fragment", "value": question[:220]})
        if len(answer) < 80:
            errors.append({"row": index, "field": "lawyerAnswer", "reason": "short_answer", "value": answer[:220]})
        if any(fragment in lower_answer for fragment in BAD_ANSWER_FRAGMENTS):
            errors.append({"row": index, "field": "lawyerAnswer", "reason": "bad_answer_fragment", "value": answer[:220]})

        seen_questions.add(question_key)
        seen_titles.add(title_key)

    report = {"rows": len(rows), "errors": errors}
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # Don't abort the whole run on a few bad rows: drop the offending rows from the
    # import payload and keep the valid ones. This matches the content rules
    # ("если после удаления рекламы ответ слабый — строка не импортируется").
    bad_rows = {error["row"] for error in errors}
    if bad_rows:
        kept = [row for index, row in enumerate(rows, start=1) if index not in bad_rows]
        payload["rows"] = kept
        json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return len(kept)
    return len(rows)


def normalize_key(value):
    return re.sub(r"[^0-9a-zа-яё]+", "", value.lower().replace("ё", "е"))[:500]


def parse_imported_count(stdout):
    match = re.search(r"Imported questions:\s*(\d+)", stdout)
    return int(match.group(1)) if match else 0


def ensure_rules_file(log_path):
    for path in RULES_PATHS:
        if path.exists():
            log(f"Using Q&A rules: {path}", log_path)
            return
    raise RuntimeError("QNA_CONTENT_RULES.md not found in mvp/ or project root.")


def main():
    args = parse_args()
    if args.total < 1 or args.batch_size < 1:
        raise SystemExit("--total and --batch-size must be positive.")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    log_path = args.output_dir / "harant_qna_batch_run.log"
    state_path = args.output_dir / "state.json"

    ensure_rules_file(log_path)
    state = load_state(state_path) if args.resume else default_state()
    session = build_session()

    while state["published"] < args.total:
        load_until_queue(args, state, session, args.batch_size, log_path)
        save_state(state_path, state)
        queue = state.setdefault("queue", [])
        if not queue:
            log("Source queue is empty; stopping.", log_path)
            break

        batch_number = state["batch"]
        batch_urls = queue[: args.batch_size]
        state["queue"] = queue[len(batch_urls) :]
        batch_dir = args.output_dir / f"batch_{batch_number:04d}"
        batch_dir.mkdir(parents=True, exist_ok=True)

        raw_xlsx = batch_dir / f"harant_batch_{batch_number:04d}_raw.xlsx"
        enriched_xlsx = batch_dir / f"harant_batch_{batch_number:04d}_enriched.xlsx"
        import_json = batch_dir / f"harant_batch_{batch_number:04d}_site_import.json"
        validation_json = batch_dir / f"harant_batch_{batch_number:04d}_validation.json"

        log(
            f"Starting batch {batch_number}: urls={len(batch_urls)}, remaining_queue={len(state['queue'])}, published={state['published']}",
            log_path,
        )
        parsed_count = parse_batch(args, batch_urls, batch_number, raw_xlsx, log_path)
        if parsed_count:
            try:
                run_command(
                    [
                        sys.executable,
                        str(ROOT / "scripts" / "prepare_harant_qna_import.py"),
                        "--input",
                        str(raw_xlsx),
                        "--output-json",
                        str(import_json),
                        "--output-xlsx",
                        str(enriched_xlsx),
                    ],
                    log_path,
                )
                prepared_count = validate_prepared_json(import_json, validation_json)
                log(f"Batch {batch_number}: prepared rows passed validation: {prepared_count}", log_path)
                if prepared_count:
                    stdout = run_command(
                        [
                            NPM,
                            "run",
                            "import:qna:pravoved",
                            "--",
                            "--input",
                            str(import_json),
                            "--append",
                            "--require-public-answer",
                        ],
                        log_path,
                    )
                    imported_count = parse_imported_count(stdout)
                    state["published"] += imported_count
                    log(f"Batch {batch_number}: imported={imported_count}, total_published={state['published']}", log_path)
                    if args.verify_db_each_batch:
                        run_command([NPX, "tsx", "scripts/verify-harant-qna-import.ts"], log_path)
            except Exception as error:
                # One bad batch (validation/import/network) must not kill the whole
                # multi-hour run. Log it, advance, and continue with the next batch.
                log(f"Batch {batch_number}: SKIPPED after error: {type(error).__name__}: {error}", log_path)
        else:
            log(f"Batch {batch_number}: no answered records parsed.", log_path)

        state["batch"] += 1
        save_state(state_path, state)

    run_command([NPX, "tsx", "scripts/verify-harant-qna-import.ts"], log_path)
    save_state(state_path, state)
    log(
        f"Finished. Published in this run: {state['published']}. Seen URLs: {len(state.get('seenUrls', []))}. "
        f"Queue: {len(state.get('queue', []))}. Source exhausted: {state.get('sourceExhausted')}",
        log_path,
    )


if __name__ == "__main__":
    main()
