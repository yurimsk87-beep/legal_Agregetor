from __future__ import annotations

import argparse
import html
import json
import os
import re
import time
from array import array
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, Literal
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup, Tag
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter


BASE_URL = "https://pravoved.ru"
SITEMAP_INDEX = f"{BASE_URL}/sitemap.xml"
SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT = SCRIPT_DIR / "outputs" / "pravoved_questions.xlsx"
DEFAULT_LIMIT = 15

QUESTION_URL_PATTERN = re.compile(r"^/question/\d+/?$")
QUESTION_SITEMAP_PATTERN = re.compile(r"/questions_\d+\.xml$")
QUESTION_ID_PATTERN = re.compile(r"/question/(\d+)/?$")
# Прямое извлечение id вопроса из <loc> в sitemap, чтобы не материализовать
# полные URL-строки (их >1.5 млн → MemoryError).
QUESTION_LOC_ID_PATTERN = re.compile(r"<loc>\s*https?://[^<\s]*?/question/(\d+)/?\s*</loc>", re.I)

# CSS fallbacks if JSON-LD is missing on a page.
CATEGORY_FALLBACK_SELECTORS = (
    "nav[aria-label*='хлеб'] a",
    ".breadcrumbs a",
)
QUESTION_FALLBACK_SELECTORS = (
    "h1",
    "[class*='question__text']",
    "[class*='QuestionText']",
)


class ParserError(RuntimeError):
    """Raised when a Pravoved page no longer contains the expected data."""


@dataclass(frozen=True)
class QuestionRecord:
    category: str
    question: str
    lawyer_answer: str
    question_url: str
    parsed_at: str


def build_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
        }
    )
    # Optional outbound proxy to dodge an IP ban on the source site. Set
    # PRAVOVED_PROXY=http://user:pass@host:port (or socks5h://...). Falls back to
    # the standard HTTPS_PROXY env var. localhost (the import DB) is exempt.
    proxy = os.environ.get("PRAVOVED_PROXY") or os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    if proxy:
        session.proxies.update({"http": proxy, "https": proxy})
        session.trust_env = False  # use only the explicit proxy, ignore other env proxy vars
    return session


def normalize_text(value: str) -> str:
    # Pravoved encodes angle brackets etc. as HTML entities (&lt; &gt; &amp; …) in
    # JSON-LD; decode them once so stored text shows real characters, not "&lt;".
    value = html.unescape(value or "").replace("\xa0", " ")
    lines = []
    for raw_line in value.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        if line:
            lines.append(line)
    return "\n".join(lines)


def fetch_text(session: requests.Session, url: str, timeout: int) -> str:
    response = session.get(url, timeout=timeout)
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding
    return response.text


def question_id(url: str) -> int:
    match = QUESTION_ID_PATTERN.search(urlparse(url).path)
    return int(match.group(1)) if match else 0


# --- URL collection via sitemaps -------------------------------------------------

def find_question_sitemaps(session: requests.Session, index_url: str, timeout: int) -> list[str]:
    xml = fetch_text(session, index_url, timeout)
    locs = re.findall(r"<loc>([^<]+)</loc>", xml)
    sitemaps = [loc.strip() for loc in locs if QUESTION_SITEMAP_PATTERN.search(loc)]
    # Newest questions live in the higher-numbered sitemaps; sort by index.
    sitemaps.sort(key=lambda loc: int(re.search(r"questions_(\d+)\.xml$", loc).group(1)))
    return sitemaps


def build_question_url(question_id_value: int) -> str:
    return f"{BASE_URL}/question/{question_id_value}/"


def collect_question_ids(
    session: requests.Session,
    index_url: str,
    timeout: int,
    newest_first: bool,
    start_offset: int = 0,
    limit: int | None = None,
) -> list[int]:
    """Собрать отсортированные уникальные id вопросов из sitemap.

    Память: храним только целочисленные id (URL детерминирован — см.
    build_question_url), а не >1.5 млн URL-строк + set строк, иначе MemoryError.
    Порядок сохраняется прежний (по возрастанию id; newest_first — по убыванию),
    поэтому resume по offset продолжает работать.
    """
    sitemaps = find_question_sitemaps(session, index_url, timeout)
    if not sitemaps:
        raise ParserError("В sitemap не найдено карт вопросов (questions_*.xml).")

    ids = array("Q")  # компактно: 8 байт на id вместо ~90 байт на URL-строку
    for sitemap_url in sitemaps:
        xml = fetch_text(session, sitemap_url, timeout)
        for match in QUESTION_LOC_ID_PATTERN.finditer(xml):
            ids.append(int(match.group(1)))

    try:
        import numpy as np

        # np.unique = сортировка + дедуп в C над uint64-буфером (~8 байт/id),
        # без материализации ~3 млн id в Python-список (это и вызывало Out of memory).
        ordered = np.unique(np.frombuffer(ids, dtype=np.uint64))
        del ids
        if newest_first:
            ordered = ordered[::-1]
        return ordered[start_offset:] if limit is None else ordered[start_offset : start_offset + limit]
    except ImportError:
        # Фолбэк без numpy: дороже по памяти, но рабочий.
        ordered_list = ids.tolist()
        del ids
        ordered_list.sort()
        write = 0
        previous: int | None = None
        for value in ordered_list:
            if value != previous:
                ordered_list[write] = value
                write += 1
                previous = value
        del ordered_list[write:]
        if newest_first:
            ordered_list.reverse()
        return ordered_list[start_offset:] if limit is None else ordered_list[start_offset : start_offset + limit]


def collect_question_urls(
    session: requests.Session,
    index_url: str,
    limit: int,
    timeout: int,
    newest_first: bool,
    start_offset: int,
) -> list[str]:
    ids = collect_question_ids(session, index_url, timeout, newest_first, start_offset, limit)
    return [build_question_url(int(question_id_value)) for question_id_value in ids]


# --- Detail parsing via JSON-LD --------------------------------------------------

def iter_jsonld(html: str) -> Iterable[dict]:
    for raw in re.findall(r"<script[^>]+application/ld\+json[^>]*>(.*?)</script>", html, re.S):
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    yield item
        elif isinstance(data, dict):
            if isinstance(data.get("@graph"), list):
                for item in data["@graph"]:
                    if isinstance(item, dict):
                        yield item
            else:
                yield data


def answer_text_from(answer: object) -> tuple[str, str]:
    if not isinstance(answer, dict):
        return "", ""
    text = normalize_text(answer.get("text") or "")
    author = answer.get("author") or {}
    author_name = author.get("name") if isinstance(author, dict) else ""
    return text, normalize_text(author_name or "")


def extract_answers(question_entity: dict, answer_mode: Literal["first", "all"]) -> str:
    candidates: list[str] = []
    accepted = question_entity.get("acceptedAnswer")
    suggested = question_entity.get("suggestedAnswer") or []
    if isinstance(suggested, dict):
        suggested = [suggested]

    ordered = ([accepted] if accepted else []) + list(suggested)
    seen: set[str] = set()
    for answer in ordered:
        text, _author = answer_text_from(answer)
        if not text or text in seen:
            continue
        seen.add(text)
        candidates.append(text)

    if not candidates:
        return ""
    if answer_mode == "first":
        return candidates[0]
    return "\n\n---\n\n".join(candidates)


def category_from_breadcrumb(entities: list[dict]) -> str:
    for entity in entities:
        if entity.get("@type") != "BreadcrumbList":
            continue
        names = []
        for element in entity.get("itemListElement", []):
            if not isinstance(element, dict):
                continue
            item = element.get("item")
            name = element.get("name") or (item.get("name") if isinstance(item, dict) else "")
            if name:
                names.append(normalize_text(name))
        # [Главная, Вопросы, <Категория>, <Заголовок вопроса>] → категория предпоследняя.
        if len(names) >= 2:
            return names[-2]
    return ""


def parse_question_detail(
    session: requests.Session,
    question_url: str,
    timeout: int,
    answer_mode: Literal["first", "all"],
) -> QuestionRecord:
    html = fetch_text(session, question_url, timeout)
    entities = list(iter_jsonld(html))

    question_entity: dict | None = None
    for entity in entities:
        if entity.get("@type") == "QAPage" and isinstance(entity.get("mainEntity"), dict):
            question_entity = entity["mainEntity"]
            break
        if entity.get("@type") == "Question":
            question_entity = entity
            break

    category = category_from_breadcrumb(entities)
    question = ""
    lawyer_answer = ""

    if question_entity:
        name = normalize_text(question_entity.get("name") or "")
        body = normalize_text(question_entity.get("text") or "")
        # "Вопрос" = заголовок + тело (заголовок помогает prepare-шагу собрать title).
        if name and body and name not in body:
            question = f"{name}\n{body}"
        else:
            question = body or name
        lawyer_answer = extract_answers(question_entity, answer_mode)

    if not question:
        soup = BeautifulSoup(html, "html.parser")
        for selector in QUESTION_FALLBACK_SELECTORS:
            element = soup.select_one(selector)
            if element:
                question = normalize_text(element.get_text(" ", strip=True))
                if question:
                    break

    if not question:
        raise ParserError(f"Не удалось найти текст вопроса на странице {question_url}.")

    return QuestionRecord(
        category=category,
        question=question,
        lawyer_answer=lawyer_answer,
        question_url=question_url,
        parsed_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )


# --- Excel output (identical schema to harant_questions_parser) ------------------

def save_to_excel(records: list[QuestionRecord], output_path: Path, include_meta: bool) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Pravoved Questions"

    headers = ["Категория вопроса", "Вопрос", "Ответ юриста"]
    if include_meta:
        headers.extend(["URL вопроса", "Дата парсинга"])
    sheet.append(headers)

    for record in records:
        row = [record.category, record.question, record.lawyer_answer]
        if include_meta:
            row.extend([record.question_url, record.parsed_at])
        sheet.append(row)

    header_fill = PatternFill("solid", fgColor="1F4E78")
    header_font = Font(color="FFFFFF", bold=True)
    for cell in sheet[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    widths = {"A": 28, "B": 80, "C": 95, "D": 45, "E": 22}
    for column_letter, width in widths.items():
        sheet.column_dimensions[column_letter].width = width

    for row in sheet.iter_rows(min_row=2):
        for cell in row:
            cell.alignment = Alignment(vertical="top", wrap_text=True)

    sheet.freeze_panes = "A2"
    sheet.auto_filter.ref = f"A1:{get_column_letter(sheet.max_column)}{sheet.max_row}"
    workbook.save(output_path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Парсер вопросов Pravoved: категория, вопрос и ответ юриста в Excel (через sitemap + JSON-LD)."
    )
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT, help="Сколько карточек вопросов обработать.")
    parser.add_argument("--sitemap-index", default=SITEMAP_INDEX, help="Индекс sitemap Pravoved.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Путь к Excel-файлу результата.")
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout в секундах.")
    parser.add_argument("--delay", type=float, default=0.4, help="Пауза между переходами в карточки.")
    parser.add_argument("--start-offset", type=int, default=0, help="Сколько URL пропустить (для батчей).")
    parser.add_argument("--newest-first", action="store_true", help="Сначала самые новые вопросы (по id).")
    parser.add_argument(
        "--answers",
        choices=("first", "all"),
        default="first",
        help="Сохранять первый ответ юриста или все уникальные ответы через разделитель.",
    )
    parser.add_argument("--require-answer", action="store_true", help="Пропускать вопросы без ответа юриста.")
    parser.add_argument("--include-meta", action="store_true", help="Добавить в Excel URL вопроса и дату парсинга.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.limit < 1:
        raise SystemExit("--limit должен быть больше 0.")

    session = build_session()
    question_urls = collect_question_urls(
        session=session,
        index_url=args.sitemap_index,
        limit=args.limit,
        timeout=args.timeout,
        newest_first=args.newest_first,
        start_offset=args.start_offset,
    )

    if not question_urls:
        raise ParserError("Не удалось собрать ссылки на карточки вопросов из sitemap.")

    records: list[QuestionRecord] = []
    for index, question_url in enumerate(question_urls, start=1):
        print(f"[{index}/{len(question_urls)}] {question_url}", flush=True)
        try:
            record = parse_question_detail(session, question_url, args.timeout, args.answers)
        except requests.RequestException as error:
            print(f"  HTTP ошибка: {error}")
            continue
        except ParserError as error:
            print(f"  Ошибка парсинга: {error}")
            continue

        if args.require_answer and not record.lawyer_answer:
            print("  Пропущено: ответ юриста не найден.")
        else:
            records.append(record)

        if args.delay:
            time.sleep(args.delay)

    if not records:
        raise ParserError("После обработки не осталось записей для Excel.")

    save_to_excel(records, args.output, args.include_meta)
    print(f"Готово: {args.output} ({len(records)} строк)")


if __name__ == "__main__":
    main()
