import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { analyzeLawyerAnswerQuality } from "../src/lib/answer-quality";
import { hasForbiddenContact, redactForbiddenContacts } from "../src/lib/contact-safety";
import { PUBLIC_ANSWER_MIN_QUALITY_SCORE } from "../src/lib/qna-publication-rules";

const prisma = new PrismaClient();

type Mode = "audit" | "repair";

type Args = {
  mode: Mode;
  batchSize: number;
  limit?: number;
  promotePassing: boolean;
  reportPath: string;
};

type GateStatus = "PASS" | "FAIL" | "REVIEW";

type RowReport = {
  questionId: string;
  publicNumber: string | null;
  slug: string;
  sourcePage: string | null;
  wasIndexable: boolean;
  gates: {
    publication: GateStatus;
    quality: GateStatus;
    duplicate: GateStatus;
    originality: GateStatus;
    legal: GateStatus;
    privacy: GateStatus;
    technical: GateStatus;
  };
  reasons: string[];
  repairs: string[];
  finalIndexable: boolean;
};

const IMPORT_SOURCE = /(harant|pravoved|fixture|\.xlsx\b|import)/i;
const ORIGINALITY_PASS = /\[ORIGINALITY:PASS\]/i;
const SEMANTIC_PASS = /\[SEMANTIC:PASS\]/i;
const LEGAL_VERIFIED = /\[LEGAL:VERIFIED(?:[^\]]*)\]/i;

const BAD_TITLE =
  /^(что делать\??|как быть\??|как выйти из положения\??|юридическая консультация по ситуации|как решить вопрос по теме|как действовать по вопросу)/i;
const LEGAL_SIGNIFICANCE =
  /(?:\bст\.?\s*\d+|\b(?:гк|гпк|ук|упк|коап|тк|ск|жк|нк)\s*рф\b|федеральн(?:ый|ого)\s+закон|постановлен(?:ие|ия)|определен(?:ие|ия)\s+верховн|госпошлин|подсудн|срок\s+(?:подач|обжалован|исков|обращен)|в течение\s+\d+|\d+\s+(?:дн|дней|месяц|месяцев|лет)\b|обязан(?:ы|а)?\s|вправе\s|не имеет права|должен\s+подать|подается\s+в\s+суд)/i;

async function main() {
  assertDatabase();
  const args = parseArgs(process.argv.slice(2));
  const report: RowReport[] = [];
  const exactQuestionKeys = new Map<string, string>();
  let cursor: string | undefined;
  let scanned = 0;
  let repaired = 0;
  let deindexed = 0;
  let promoted = 0;

  while (true) {
    const rows = await prisma.question.findMany({
      orderBy: { id: "asc" },
      take: args.batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        reports: {
          where: { status: { in: ["NEW", "IN_REVIEW"] } },
          select: { id: true }
        },
        answers: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            text: true,
            status: true,
            qualityStatus: true,
            isModerated: true,
            containsContactAttempt: true,
            containsUnsupportedLegalClaim: true,
            containsFearPressure: true,
            containsGenericLeadBait: true,
            legalReferencesVerified: true,
            answerQualityScore: true,
            moderationComment: true,
            answerReviewReason: true,
            editorReviewedAt: true
          }
        }
      }
    });

    if (!rows.length) break;

    for (const question of rows) {
      if (args.limit && scanned >= args.limit) break;
      scanned += 1;

      const reasons: string[] = [];
      const repairs: string[] = [];
      const sourceImported = IMPORT_SOURCE.test(question.sourcePage ?? "");
      const cleanedTitle = cleanPublicText(redactForbiddenContacts(question.title)).slice(0, 90);
      const cleanedText = cleanPublicText(redactForbiddenContacts(question.text));
      const publicMarker = `${question.indexabilityReason ?? ""}\n${question.moderationComment ?? ""}`;

      const exactKey = normalizeDedupe(cleanedText || cleanedTitle);
      const exactDuplicateOf = exactKey ? exactQuestionKeys.get(exactKey) : undefined;
      if (exactKey && !exactDuplicateOf) exactQuestionKeys.set(exactKey, question.id);

      const cleanedAnswers = question.answers.map((answer) => {
        const cleaned = cleanPublicText(redactForbiddenContacts(answer.text));
        const quality = analyzeLawyerAnswerQuality(cleaned);
        const manualLegalVerification = LEGAL_VERIFIED.test(
          `${answer.moderationComment ?? ""}\n${answer.answerReviewReason ?? ""}`
        );
        const legallySignificant = LEGAL_SIGNIFICANCE.test(cleaned);
        const legalPass = !legallySignificant || manualLegalVerification;
        return { answer, cleaned, quality, legallySignificant, legalPass, manualLegalVerification };
      });

      const publicationPass =
        question.status === "PUBLISHED" &&
        question.qualityStatus === "APPROVED" &&
        question.reports.length === 0 &&
        cleanedAnswers.some(
          ({ answer, quality }) =>
            answer.status === "PUBLISHED" &&
            answer.qualityStatus === "APPROVED" &&
            answer.isModerated &&
            quality.score >= PUBLIC_ANSWER_MIN_QUALITY_SCORE &&
            !quality.containsContactAttempt &&
            !quality.containsUnsupportedLegalClaim &&
            !quality.containsFearPressure &&
            !quality.containsGenericLeadBait
        );

      const qualityPass =
        cleanedTitle.length >= 8 &&
        cleanedText.length >= 25 &&
        !BAD_TITLE.test(cleanedTitle) &&
        cleanedAnswers.some(
          ({ cleaned, quality }) =>
            cleaned.length >= 40 && quality.score >= PUBLIC_ANSWER_MIN_QUALITY_SCORE
        );

      const privacyPass =
        !hasForbiddenContact(cleanedTitle) &&
        !hasForbiddenContact(cleanedText) &&
        cleanedAnswers.every(({ cleaned }) => !hasForbiddenContact(cleaned));

      const duplicateStatus: GateStatus =
        exactDuplicateOf || question.isDuplicate
          ? "FAIL"
          : sourceImported && !SEMANTIC_PASS.test(publicMarker)
            ? "REVIEW"
            : "PASS";

      const originalityStatus: GateStatus = sourceImported
        ? ORIGINALITY_PASS.test(publicMarker) && Boolean(question.editorReviewedAt)
          ? "PASS"
          : "REVIEW"
        : "PASS";

      const legalStatus: GateStatus = cleanedAnswers.some(({ legalPass }) => !legalPass)
        ? "REVIEW"
        : "PASS";
      const technicalPass = Boolean(question.slug) && !question.slug.includes("?");

      if (!publicationPass) reasons.push("publicationGate");
      if (!qualityPass) reasons.push("contentQualityGate");
      if (duplicateStatus !== "PASS") {
        reasons.push(exactDuplicateOf ? `exactDuplicate:${exactDuplicateOf}` : "semanticDuplicateGate");
      }
      if (originalityStatus !== "PASS") reasons.push("originalityGate");
      if (legalStatus !== "PASS") reasons.push("legalGate");
      if (!privacyPass) reasons.push("privacyGate");
      if (!technicalPass) reasons.push("technicalGate");

      const allPass =
        publicationPass &&
        qualityPass &&
        duplicateStatus === "PASS" &&
        originalityStatus === "PASS" &&
        legalStatus === "PASS" &&
        privacyPass &&
        technicalPass;

      if (args.mode === "repair") {
        const questionUpdate: Prisma.QuestionUpdateInput = {};

        if (cleanedTitle !== question.title) {
          questionUpdate.title = cleanedTitle;
          questionUpdate.enrichedTitle = cleanedTitle;
          repairs.push("question.title");
        }
        if (cleanedText !== question.text) {
          questionUpdate.text = cleanedText;
          questionUpdate.enrichedText = cleanedText;
          repairs.push("question.text");
        }
        if (exactDuplicateOf && !question.isDuplicate) {
          questionUpdate.isDuplicate = true;
          repairs.push("question.isDuplicate");
        }

        const reason = allPass
          ? "GATES_PASS"
          : `GATES_FAIL:${reasons.join(",")}`.slice(0, 1000);
        questionUpdate.indexabilityReason = preserveManualMarkers(publicMarker, reason);

        if (!allPass && question.isIndexable) {
          questionUpdate.isIndexable = false;
          deindexed += 1;
          repairs.push("question.isIndexable=false");
        } else if (allPass && args.promotePassing && !question.isIndexable) {
          questionUpdate.isIndexable = true;
          promoted += 1;
          repairs.push("question.isIndexable=true");
        }

        await prisma.question.update({ where: { id: question.id }, data: questionUpdate });

        for (const item of cleanedAnswers) {
          const { answer, cleaned, quality, legallySignificant, manualLegalVerification } = item;
          const answerUpdate: Prisma.AnswerUpdateInput = {};

          if (cleaned !== answer.text) {
            answerUpdate.text = cleaned;
            repairs.push(`answer:${answer.id}:text`);
          }
          if (answer.containsContactAttempt !== quality.containsContactAttempt) {
            answerUpdate.containsContactAttempt = quality.containsContactAttempt;
          }
          if (answer.containsUnsupportedLegalClaim !== quality.containsUnsupportedLegalClaim) {
            answerUpdate.containsUnsupportedLegalClaim = quality.containsUnsupportedLegalClaim;
          }
          if (answer.containsFearPressure !== quality.containsFearPressure) {
            answerUpdate.containsFearPressure = quality.containsFearPressure;
          }
          if (answer.containsGenericLeadBait !== quality.containsGenericLeadBait) {
            answerUpdate.containsGenericLeadBait = quality.containsGenericLeadBait;
          }
          if (answer.answerQualityScore !== quality.score) {
            answerUpdate.answerQualityScore = quality.score;
          }

          // Old values may have come from heuristic detection. Under the new rules,
          // legalReferencesVerified is true only with an explicit verification marker.
          const verified = legallySignificant ? manualLegalVerification : false;
          if (answer.legalReferencesVerified !== verified) {
            answerUpdate.legalReferencesVerified = verified;
          }

          if (Object.keys(answerUpdate).length > 0) {
            await prisma.answer.update({ where: { id: answer.id }, data: answerUpdate });
          }
        }

        if (repairs.length) repaired += 1;
      }

      report.push({
        questionId: question.id,
        publicNumber: question.publicNumber,
        slug: question.slug,
        sourcePage: question.sourcePage,
        wasIndexable: question.isIndexable,
        gates: {
          publication: publicationPass ? "PASS" : "FAIL",
          quality: qualityPass ? "PASS" : "FAIL",
          duplicate: duplicateStatus,
          originality: originalityStatus,
          legal: legalStatus,
          privacy: privacyPass ? "PASS" : "FAIL",
          technical: technicalPass ? "PASS" : "FAIL"
        },
        reasons,
        repairs,
        finalIndexable: allPass && (args.promotePassing || question.isIndexable)
      });
    }

    cursor = rows[rows.length - 1]!.id;
    if (args.limit && scanned >= args.limit) break;
  }

  const summary = summarize(report);
  const payload = {
    generatedAt: new Date().toISOString(),
    mode: args.mode,
    promotePassing: args.promotePassing,
    scanned,
    repaired,
    deindexed,
    promoted,
    summary,
    rows: report
  };

  mkdirSync(dirname(args.reportPath), { recursive: true });
  writeFileSync(args.reportPath, JSON.stringify(payload, null, 2), "utf8");

  console.log(
    JSON.stringify(
      { ...payload, rows: undefined, reportPath: args.reportPath },
      null,
      2
    )
  );
}

function parseArgs(argv: string[]): Args {
  const mode: Mode = argv.includes("--repair") ? "repair" : "audit";
  const batchSize = numberArg(argv, "--batch-size") ?? 250;
  const limit = numberArg(argv, "--limit");
  const reportArg = stringArg(argv, "--report");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  return {
    mode,
    batchSize: Math.min(Math.max(batchSize, 25), 1000),
    limit,
    promotePassing: argv.includes("--promote-passing"),
    reportPath: resolve(reportArg ?? `reports/qna-gate-audit-${stamp}.json`)
  };
}

function numberArg(argv: string[], name: string) {
  const value = stringArg(argv, name);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
}

function stringArg(argv: string[], name: string) {
  const prefix = `${name}=`;
  return argv.find((item) => item.startsWith(prefix))?.slice(prefix.length);
}

function assertDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }
}

function cleanPublicText(value: string) {
  return value
    .replace(
      /\[контакт скрыт платформой\](?:\s*\[контакт скрыт платформой\])+/gi,
      "[контакт скрыт платформой]"
    )
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeDedupe(value: string) {
  return value
    .toLowerCase()
    .replace(/\[контакт скрыт платформой\]/gi, " ")
    .replace(/[^a-zа-яё0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
}

function preserveManualMarkers(current: string, reason: string) {
  const markers = [
    current.match(/\[ORIGINALITY:PASS\]/i)?.[0],
    current.match(/\[SEMANTIC:PASS\]/i)?.[0]
  ].filter(Boolean);

  return [...markers, reason].join(" ").trim().slice(0, 1000);
}

function summarize(rows: RowReport[]) {
  const result = {
    total: rows.length,
    currentlyIndexable: rows.filter((row) => row.wasIndexable).length,
    allGatesPass: 0,
    publicationFail: 0,
    qualityFail: 0,
    duplicateFailOrReview: 0,
    originalityFailOrReview: 0,
    legalFailOrReview: 0,
    privacyFail: 0,
    technicalFail: 0
  };

  for (const row of rows) {
    const g = row.gates;
    if (Object.values(g).every((status) => status === "PASS")) {
      result.allGatesPass += 1;
    }
    if (g.publication !== "PASS") result.publicationFail += 1;
    if (g.quality !== "PASS") result.qualityFail += 1;
    if (g.duplicate !== "PASS") result.duplicateFailOrReview += 1;
    if (g.originality !== "PASS") result.originalityFailOrReview += 1;
    if (g.legal !== "PASS") result.legalFailOrReview += 1;
    if (g.privacy !== "PASS") result.privacyFail += 1;
    if (g.technical !== "PASS") result.technicalFail += 1;
  }

  return result;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
