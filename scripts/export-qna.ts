import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, mkdirSync, writeFileSync } from "node:fs";
import { once } from "node:events";
import { basename, join, resolve } from "node:path";
import { finished } from "node:stream/promises";
import { createGzip } from "node:zlib";
import { PrismaClient } from "@prisma/client";

type Args = {
  outputDir?: string;
  batchSize: number;
};

const prisma = new PrismaClient();
const root = process.cwd();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const args = parseArgs(process.argv.slice(2));
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = resolve(args.outputDir ?? join(root, "outputs", `qna-export-${timestamp}`));
  mkdirSync(outputDir, { recursive: true });

  const questionsPath = join(outputDir, "questions.jsonl.gz");
  const answersPath = join(outputDir, "answers.jsonl.gz");
  const nestedPath = join(outputDir, "qna_full.jsonl.gz");
  const manifestPath = join(outputDir, "manifest.json");

  const [expectedQuestions, expectedAnswers] = await Promise.all([
    prisma.question.count(),
    prisma.answer.count()
  ]);

  const questionsWriter = createJsonlGzipWriter(questionsPath);
  const nestedWriter = createJsonlGzipWriter(nestedPath);

  let exportedQuestions = 0;
  let nestedAnswers = 0;
  let questionCursor: string | undefined;

  while (true) {
    const rows = await prisma.question.findMany({
      orderBy: { id: "asc" },
      take: args.batchSize,
      ...(questionCursor ? { cursor: { id: questionCursor }, skip: 1 } : {}),
      include: {
        answers: {
          orderBy: { id: "asc" }
        }
      }
    });

    if (!rows.length) break;

    for (const row of rows) {
      const { answers, ...question } = row;
      await questionsWriter.write(question);
      await nestedWriter.write({ question, answers });
      exportedQuestions += 1;
      nestedAnswers += answers.length;
    }

    questionCursor = rows.at(-1)!.id;
    process.stdout.write(
      `Questions: ${exportedQuestions}/${expectedQuestions}; nested answers: ${nestedAnswers}\r`
    );
  }

  await Promise.all([questionsWriter.close(), nestedWriter.close()]);
  process.stdout.write("\n");

  const answersWriter = createJsonlGzipWriter(answersPath);
  let exportedAnswers = 0;
  let answerCursor: string | undefined;

  while (true) {
    const rows = await prisma.answer.findMany({
      orderBy: { id: "asc" },
      take: args.batchSize,
      ...(answerCursor ? { cursor: { id: answerCursor }, skip: 1 } : {})
    });

    if (!rows.length) break;

    for (const row of rows) {
      await answersWriter.write(row);
      exportedAnswers += 1;
    }

    answerCursor = rows.at(-1)!.id;
    process.stdout.write(`Answers: ${exportedAnswers}/${expectedAnswers}\r`);
  }

  await answersWriter.close();
  process.stdout.write("\n");

  if (exportedQuestions !== expectedQuestions) {
    throw new Error(
      `Question count mismatch: expected ${expectedQuestions}, exported ${exportedQuestions}.`
    );
  }
  if (exportedAnswers !== expectedAnswers) {
    throw new Error(
      `Answer count mismatch: expected ${expectedAnswers}, exported ${exportedAnswers}.`
    );
  }
  if (nestedAnswers !== expectedAnswers) {
    throw new Error(
      `Nested answer count mismatch: expected ${expectedAnswers}, exported ${nestedAnswers}.`
    );
  }

  const files = await Promise.all(
    [questionsPath, answersPath, nestedPath].map(async (path) => ({
      file: basename(path),
      sha256: await sha256(path)
    }))
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "PostgreSQL via Prisma DATABASE_URL",
    readOnly: true,
    containsSensitiveData: true,
    format: {
      questions: "JSONL gzip; one complete Question row per line",
      answers: "JSONL gzip; one complete Answer row per line",
      qnaFull: "JSONL gzip; one complete Question row plus all linked Answer rows per line"
    },
    counts: {
      questions: exportedQuestions,
      answers: exportedAnswers
    },
    files
  };

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Export complete: ${outputDir}`);
  console.log(`Questions: ${exportedQuestions}`);
  console.log(`Answers: ${exportedAnswers}`);
  console.log(`Manifest: ${manifestPath}`);
}

function parseArgs(argv: string[]): Args {
  const parsed: Args = { batchSize: 1000 };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--output-dir" && next) {
      parsed.outputDir = next;
      index += 1;
      continue;
    }

    if (arg === "--batch-size" && next) {
      const value = Number(next);
      if (!Number.isInteger(value) || value < 1 || value > 10000) {
        throw new Error("--batch-size must be an integer between 1 and 10000.");
      }
      parsed.batchSize = value;
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage: npx tsx scripts/export-qna.ts [options]",
          "",
          "Options:",
          "  --output-dir PATH   Export directory (default: outputs/qna-export-<timestamp>)",
          "  --batch-size N      Prisma batch size, 1..10000 (default: 1000)",
          "",
          "The export is read-only and contains all Question/Answer fields, including",
          "potentially sensitive fields such as Question.userEmail. Keep the output private."
        ].join("\n")
      );
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function createJsonlGzipWriter(path: string) {
  const gzip = createGzip({ level: 6 });
  const output = createWriteStream(path, { flags: "wx" });
  gzip.pipe(output);

  return {
    async write(value: unknown) {
      const line = `${JSON.stringify(value)}\n`;
      if (!gzip.write(line, "utf8")) {
        await once(gzip, "drain");
      }
    },
    async close() {
      gzip.end();
      await finished(output);
    }
  };
}

async function sha256(path: string) {
  const hash = createHash("sha256");
  const stream = createReadStream(path);

  stream.on("data", (chunk) => hash.update(chunk));
  await finished(stream);

  return hash.digest("hex");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
