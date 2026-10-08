#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
DB_SERVICE="${DB_SERVICE:-postgres}"
DB_NAME="${DB_NAME:-legal_aggregator}"
DB_USER="${DB_USER:-postgres}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_DIR="${1:-outputs/qna-export-$STAMP}"

mkdir -p "$OUTPUT_DIR"

dc() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

psql_query() {
  dc exec -T "$DB_SERVICE" psql -X -qAt -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" -c "$1"
}

echo "Exporting Q&A from PostgreSQL to: $OUTPUT_DIR"

QUESTION_COUNT="$(psql_query 'SELECT count(*) FROM "Question";' | tr -d '\r')"
ANSWER_COUNT="$(psql_query 'SELECT count(*) FROM "Answer";' | tr -d '\r')"

echo "Questions: $QUESTION_COUNT"
echo "Answers:   $ANSWER_COUNT"

# Exact, restoreable PostgreSQL snapshot of both Q&A tables.
dc exec -T "$DB_SERVICE" pg_dump \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --format=custom \
  --data-only \
  --no-owner \
  --no-privileges \
  --table='"Question"' \
  --table='"Answer"' \
  > "$OUTPUT_DIR/qna_tables.dump"

# Complete raw tables in portable CSV form.
dc exec -T "$DB_SERVICE" psql -X -q -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" \
  -c '\copy "Question" TO STDOUT WITH (FORMAT csv, HEADER true)' \
  | gzip -6 > "$OUTPUT_DIR/questions.csv.gz"

dc exec -T "$DB_SERVICE" psql -X -q -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" \
  -c '\copy "Answer" TO STDOUT WITH (FORMAT csv, HEADER true)' \
  | gzip -6 > "$OUTPUT_DIR/answers.csv.gz"

# One JSON object per question with every Question field and every linked Answer field.
psql_query 'SELECT jsonb_build_object(
  '"'"'question'"'"', to_jsonb(q),
  '"'"'answers'"'"', COALESCE(
    (
      SELECT jsonb_agg(to_jsonb(a) ORDER BY a."createdAt", a."id")
      FROM "Answer" a
      WHERE a."questionId" = q."id"
    ),
    '"'"'[]'"'"'::jsonb
  )
) FROM "Question" q ORDER BY q."createdAt", q."id";' \
  | gzip -6 > "$OUTPUT_DIR/qna_full.jsonl.gz"

JSONL_COUNT="$(gzip -cd "$OUTPUT_DIR/qna_full.jsonl.gz" | wc -l | tr -d ' ')"
if [ "$JSONL_COUNT" != "$QUESTION_COUNT" ]; then
  echo "ERROR: qna_full.jsonl.gz contains $JSONL_COUNT questions, expected $QUESTION_COUNT." >&2
  exit 1
fi

(
  cd "$OUTPUT_DIR"
  sha256sum qna_tables.dump questions.csv.gz answers.csv.gz qna_full.jsonl.gz > checksums.sha256
)

cat > "$OUTPUT_DIR/manifest.txt" <<EOF
generated_at_utc=$STAMP
database=$DB_NAME
questions=$QUESTION_COUNT
answers=$ANSWER_COUNT
qna_jsonl_rows=$JSONL_COUNT
contains_sensitive_data=true
files=qna_tables.dump,questions.csv.gz,answers.csv.gz,qna_full.jsonl.gz,checksums.sha256
EOF

echo "Done."
echo "Manifest: $OUTPUT_DIR/manifest.txt"
echo "WARNING: export contains all Q&A fields, including potentially sensitive data. Keep it private."
