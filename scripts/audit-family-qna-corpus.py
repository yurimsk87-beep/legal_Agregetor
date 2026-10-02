#!/usr/bin/env python3
"""Audit family-route Q&A coverage against a full CSV export."""

from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path


MIN_SCORE = 35
MIN_RESULTS = 1
MAX_RESULTS = 6
EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
PHONE_RE = re.compile(r"(?:^|\D)(?:\+?7|8)[\s().-]*(?:\d[\s().-]*){10}(?:\D|$)")
EXTERNAL_CONTACT_RE = re.compile(r"https?://|\b(?:t\.me|wa\.me|telegram|whatsapp|телеграм|ватсап)\b", re.IGNORECASE)
PASSPORT_RE = re.compile(r"\bпаспорт\D{0,24}\d{4}[\s-]*\d{6}\b", re.IGNORECASE)
SNILS_RE = re.compile(r"\b\d{3}-\d{3}-\d{3}[\s-]\d{2}\b")
INN_RE = re.compile(r"\bинн\D{0,12}\d{10,12}\b", re.IGNORECASE)
CARD_RE = re.compile(r"\b(?:\d[ -]*?){16}\b")
ADDRESS_RE = re.compile(
    r"\b(?:ул\.?|улица|проспект|пр-т|пер\.?|переулок)\s+[\w\s.-]{2,50},?\s+(?:д\.?|дом)\s*\d+",
    re.IGNORECASE,
)
NON_WORD_RE = re.compile(r"[^\w\s-]", re.UNICODE)


SYNONYM_GROUPS = [
    ["алименты", "деньги на ребенка", "содержание ребенка", "выплаты на ребенка"],
    [
        "долг по алиментам",
        "задолженность по алиментам",
        "алименты не платит",
        "не платит алименты",
        "бывший муж не платит алименты",
        "отец не платит алименты",
    ],
    ["неустойка по алиментам", "неустойка"],
    ["пристав", "приставы", "фссп", "исполнительное производство"],
    [
        "порядок общения",
        "график общения",
        "видеться с ребенком",
        "встречи с ребенком",
        "не дает общаться с ребенком",
        "не дает видеться с ребенком",
    ],
    [
        "место жительства ребенка",
        "с кем будет жить ребенок",
        "оставить ребенка с матерью",
        "оставить ребенка с отцом",
        "ребенка забрали",
        "мать не отдает ребенка",
    ],
    [
        "раздел имущества",
        "совместно нажитое",
        "поделить квартиру",
        "раздел квартиры",
        "раздел ипотеки",
        "делится ли квартира",
    ],
    [
        "лишение родительских прав",
        "лишить прав",
        "лишить родительских прав",
        "родитель опасен для ребенка",
    ],
    ["развод", "расторжение брака", "развестись"],
    ["судебный приказ", "приказ о взыскании"],
    ["госпошлина", "пошлина за подачу"],
    ["оставили без движения", "вернули заявление", "вернули иск", "иск без движения"],
]

POTENTIAL_GAP_DEFINITIONS = [
    {
        "key": "adult_child_support_after_18",
        "title": "Содержание совершеннолетнего ребёнка после 18 лет",
        "classification": "candidate_for_separate_confirmation",
        "patterns": [
            re.compile(r"(?:алимент|содержан).*(?:\bсовершеннолет\w*|\bпосле\s+18|\bстарше\s+18)"),
            re.compile(r"(?:\bсовершеннолет\w*|\bпосле\s+18|\bстарше\s+18).*(?:алимент|содержан)"),
        ],
    },
    {
        "key": "support_for_parents",
        "title": "Содержание нетрудоспособных родителей совершеннолетними детьми",
        "classification": "candidate_for_separate_confirmation",
        "patterns": [
            re.compile(r"алимент.*\b(?:на|в пользу)\s+родител"),
            re.compile(r"(?:родител|мать|отец).*(?:инвалид|нетрудоспособ|пенсион).*(?:алимент).*(?:сын|дочер|дет)"),
            re.compile(r"(?:сын|дочер|дети).*(?:платить|взыскать).*(?:алимент|содержан).*(?:родител|матер|отц)"),
            re.compile(r"содержан.*нетрудоспособн.*родител"),
        ],
    },
    {
        "key": "adult_guardianship",
        "title": "Опека над совершеннолетним или недееспособным гражданином",
        "classification": "candidate_outside_child_guardianship_route",
        "patterns": [
            re.compile(r"(?:опекун|попечител).{0,40}(?:\bсовершеннолет\w*|\bнедееспособ\w*)"),
            re.compile(r"(?:\bсовершеннолет\w*|\bнедееспособ\w*).{0,40}(?:опекун|попечител)"),
            re.compile(r"(?:оформ|установ|назнач|стать).{0,40}(?:опек|попечитель).*(?:\bсовершеннолет\w*|\bнедееспособ\w*)"),
            re.compile(r"признать.*недееспособ.*(?:опек|попечитель)"),
        ],
    },
    {
        "key": "adoption_cancellation",
        "title": "Отмена усыновления",
        "classification": "candidate_scenario_for_existing_adoption_route",
        "patterns": [
            re.compile(r"отмен.*усынов"),
            re.compile(r"усынов.*отмен"),
        ],
    },
]


def normalize(value: str) -> str:
    return " ".join(NON_WORD_RE.sub(" ", value.lower().replace("ё", "е")).split())


NORMALIZED_SYNONYMS = [[normalize(item) for item in group] for group in SYNONYM_GROUPS]


def expand_phrase(phrase: str) -> list[str]:
    normalized = normalize(phrase)
    variants = {normalized} if normalized else set()
    for group in NORMALIZED_SYNONYMS:
        if normalized in group:
            variants.update(group)
    return sorted(variants)


def phrase_present(phrase: str, haystack: str) -> bool:
    for variant in expand_phrase(phrase):
        if len(variant) >= 4 and variant in haystack:
            return True
        words = [word for word in variant.split() if len(word) >= 5]
        if len(words) >= 2 and sum(word in haystack for word in words) >= 2:
            return True
    return False


def count_matches(phrases: list[str], haystack: str) -> int:
    return sum(phrase_present(phrase, haystack) for phrase in phrases)


def load_contexts(repo_root: Path) -> list[dict[str, object]]:
    expression = """
Promise.all([
  import('./src/data/legal-problems.ts'),
  import('./src/data/related-questions-context.ts')
]).then(([problems, contexts]) => {
  console.log(JSON.stringify(problems.legalProblems.map((problem) => ({
    slug: problem.slug,
    title: problem.title,
    primaryTags: problem.relatedQuestionTopics,
    aliases: contexts.PROBLEM_QNA_CONTEXTS[problem.slug]?.aliases ?? [],
    excludedTopics: contexts.PROBLEM_QNA_CONTEXTS[problem.slug]?.excludedTopics ?? [],
    candidatePhrases: contexts.PROBLEM_QNA_CONTEXTS[problem.slug]?.candidatePhrases ?? [],
    requiredTopicGroups: contexts.PROBLEM_QNA_CONTEXTS[problem.slug]?.requiredTopicGroups ?? []
  }))));
});
"""
    result = subprocess.run(
        ["node", "--import", "tsx", "--eval", expression],
        cwd=repo_root,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(result.stdout)


def score_haystack(haystack: str, row: dict[str, str], context: dict[str, object]) -> tuple[int, int, int]:
    if any(count_matches(group, haystack) == 0 for group in context["requiredTopicGroups"]):
        return -999, 0, 0
    excluded = count_matches(context["excludedTopics"], haystack)
    primary_phrases = list(dict.fromkeys(context["primaryTags"] + context["aliases"]))
    primary = count_matches(primary_phrases, haystack)
    score = primary * 40 - excluded * 200
    if row.get("answer_id") or (row.get("answers_json", "").strip() not in ("", "[]")):
        score += 5
    return score, primary, excluded


def direct_contact_data(row: dict[str, str]) -> bool:
    text = " ".join(row.get(field, "") for field in ("title", "question_text", "enriched_title", "enriched_text"))
    patterns = (EMAIL_RE, PHONE_RE, EXTERNAL_CONTACT_RE, PASSPORT_RE, SNILS_RE, INN_RE, CARD_RE, ADDRESS_RE)
    return any(pattern.search(text) for pattern in patterns)


def matching_gap_keys(title_haystack: str) -> list[str]:
    return [
        definition["key"]
        for definition in POTENTIAL_GAP_DEFINITIONS
        if any(pattern.search(title_haystack) for pattern in definition["patterns"])
    ]


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path", type=Path)
    parser.add_argument("--json-output", type=Path)
    parser.add_argument("--summary-only", action="store_true")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    contexts = load_contexts(repo_root)
    if len(contexts) != 24:
        raise SystemExit(f"Expected 24 family routes, found {len(contexts)}")

    for context in contexts:
        primary_phrases = list(dict.fromkeys(context["primaryTags"] + context["aliases"]))
        candidate_phrases = primary_phrases + context["candidatePhrases"]
        context["candidateTerms"] = list(
            dict.fromkeys(
                variant
                for phrase in candidate_phrases
                for variant in expand_phrase(phrase)
                if len(variant) >= 4
            )
        )[:20]

    ranked: dict[str, list[tuple[int, str, str]]] = defaultdict(list)
    matched_ids: dict[str, set[str]] = defaultdict(set)
    matched_titles: dict[str, set[str]] = defaultdict(set)
    pii_rejected = 0
    public_rows = 0
    gap_matches: dict[str, list[tuple[str, str]]] = defaultdict(list)

    with args.csv_path.open("r", encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        required = {"question_id", "title", "question_text", "status", "quality_status"}
        missing = required.difference(reader.fieldnames or [])
        if missing:
            raise SystemExit(f"Missing CSV columns: {', '.join(sorted(missing))}")

        for row in reader:
            if row.get("status") != "PUBLISHED" or row.get("quality_status") != "APPROVED":
                continue
            public_rows += 1
            original_title_haystack = normalize(row.get("title", ""))
            title_haystack = normalize(" ".join(row.get(field, "") for field in ("title", "enriched_title")))
            for gap_key in matching_gap_keys(original_title_haystack):
                gap_matches[gap_key].append((row["question_id"], row.get("title", "")))
            candidate_contexts = [
                context
                for context in contexts
                if any(term in title_haystack for term in context["candidateTerms"])
            ]
            if not candidate_contexts:
                continue

            has_pii = direct_contact_data(row)
            haystack = normalize(
                " ".join(
                    row.get(field, "")
                    for field in ("title", "question_text", "enriched_title", "enriched_text", "category")
                )
            )
            for context in candidate_contexts:
                score, primary, excluded = score_haystack(haystack, row, context)
                if score < MIN_SCORE or primary == 0 or excluded > 0:
                    continue
                if has_pii:
                    pii_rejected += 1
                    continue
                slug = str(context["slug"])
                question_id = row["question_id"]
                title_key = normalize(row.get("title", ""))
                if question_id in matched_ids[slug] or (title_key and title_key in matched_titles[slug]):
                    continue
                matched_ids[slug].add(question_id)
                if title_key:
                    matched_titles[slug].add(title_key)
                ranked[slug].append((score, question_id, row.get("title", "")))

    route_reports = []
    duplicate_ids = 0
    duplicate_titles = 0
    pii_violations = 0
    unrelated_matches = 0
    for context in contexts:
        slug = str(context["slug"])
        results = sorted(ranked[slug], key=lambda item: (-item[0], item[1]))[:MAX_RESULTS]
        ids = [item[1] for item in results]
        duplicate_ids += len(ids) - len(set(ids))
        title_keys = [normalize(item[2]) for item in results]
        duplicate_titles += len(title_keys) - len(set(title_keys))
        route_reports.append(
            {
                "slug": slug,
                "title": context["title"],
                "eligible_questions": len(ranked[slug]),
                "displayed_questions": len(results) if len(results) >= MIN_RESULTS else 0,
                "sample_ids": ids,
                "sample_titles": [item[2] for item in results],
            }
        )

    routes_without_context = sum(not context["primaryTags"] and not context["aliases"] for context in contexts)
    pages_without_block = sum(report["displayed_questions"] < MIN_RESULTS for report in route_reports)
    potential_route_gaps = [
        {
            "key": definition["key"],
            "title": definition["title"],
            "classification": definition["classification"],
            "matching_questions": len(gap_matches[definition["key"]]),
            "sample_ids": [item[0] for item in gap_matches[definition["key"]][:5]],
            "sample_titles": [item[1] for item in gap_matches[definition["key"]][:5]],
        }
        for definition in POTENTIAL_GAP_DEFINITIONS
        if gap_matches[definition["key"]]
    ]
    report = {
        "family_routes_discovered": len(contexts),
        "family_routes_with_qna_context_before": 1,
        "family_routes_with_qna_context_after": len(contexts) - routes_without_context,
        "family_routes_without_related_question_topics": routes_without_context,
        "family_situation_pages_without_similar_qna_block": pages_without_block,
        "unrelated_qna_matches": unrelated_matches,
        "duplicate_qna_ids": duplicate_ids,
        "duplicate_qna_titles": duplicate_titles,
        "pii_violations": pii_violations,
        "pii_candidates_rejected": pii_rejected,
        "public_approved_questions_scanned": public_rows,
        "potential_route_gaps_require_separate_confirmation": potential_route_gaps,
        "routes": route_reports,
    }

    printed_report = {key: value for key, value in report.items() if key != "routes"} if args.summary_only else report
    output = json.dumps(printed_report, ensure_ascii=False, indent=2)
    print(output)
    if args.json_output:
        args.json_output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    return 0 if pages_without_block == 0 and duplicate_ids == 0 and duplicate_titles == 0 and pii_violations == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
