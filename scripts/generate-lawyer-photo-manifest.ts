import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

type Gender = "female" | "male";

const prisma = new PrismaClient();
const configPath = path.resolve("scripts/lawyer-image-style-config.json");
const photoVersion = "realistic-headshots-20260609";

type ConfigOption = {
  id: string;
  label: string;
  hex?: string | null;
  pattern?: string | null;
  palette?: string[];
  accent?: string;
  crop?: string;
  purpose?: string;
};

type ImageStyleConfig = {
  suitColors: ConfigOption[];
  shirtColors: ConfigOption[];
  tieOptions: ConfigOption[];
  backgroundOptions: ConfigOption[];
  poseOptions: ConfigOption[];
  expressionOptions: ConfigOption[];
  styleOptions: ConfigOption[];
  imageSourceOptions: ConfigOption[];
};

async function main() {
  const outputPath = path.resolve(process.argv[2] ?? "public/generated-lawyer-photos/manifest.json");
  const config = readConfig();
  const lawyers = await prisma.lawyer.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      slug: true,
      firstName: true,
      lastName: true,
      middleName: true
    }
  });

  const records = lawyers.map((lawyer, index) => {
    const fullName = [lawyer.lastName, lawyer.firstName, lawyer.middleName].filter(Boolean).join(" ");
    const gender = inferGender(lawyer);
    const style = buildStyleProfile(lawyer.slug, index, gender, config);

    return {
      index: index + 1,
      slug: lawyer.slug,
      fullName,
      gender,
      photoUrl: generatedPhotoUrl(lawyer.slug),
      imageSource: style.imageSource,
      imagePurpose: lawyer.slug.startsWith("dev-city-lawyer-") ? "demo-city-profile" : "sample-profile",
      imagePolicy: {
        publicTrustSignal: false,
        verifiedUserUpload: false,
        note: "Generated/sample image metadata; not a verification signal."
      },
      style,
      prompt: buildPrompt(fullName, gender, style)
    };
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), "utf8");
  console.log(JSON.stringify({ outputPath, lawyers: records.length }, null, 2));
}

function readConfig(): ImageStyleConfig {
  return JSON.parse(fs.readFileSync(configPath, "utf8")) as ImageStyleConfig;
}

function buildStyleProfile(slug: string, index: number, gender: Gender, config: ImageStyleConfig) {
  const source = pickBySlug(config.imageSourceOptions, slug, "source", index, 11);
  const style = pickBySlug(config.styleOptions, slug, "style", index, 7);
  const background = pickBySlug(config.backgroundOptions, slug, "background", index, 5);
  const pose = pickBySlug(config.poseOptions, slug, "pose", index, 3);
  const expression = pickBySlug(config.expressionOptions, slug, "expression", index, 2);
  const suit = pickBySlug(config.suitColors, slug, "suit", index, 5);
  const shirt = pickBySlug(config.shirtColors, slug, "shirt", index, 3);
  const tie = gender === "female" && index % 3 !== 0
    ? config.tieOptions[index % 2]
    : pickBySlug(config.tieOptions, slug, "tie", index, 4);

  return {
    suitColor: suit,
    shirtColor: shirt,
    tieOption: tie,
    background,
    pose,
    expression,
    visualStyle: style,
    imageSource: source
  };
}

function pickBySlug<T>(options: T[], slug: string, salt: string, index: number, step: number): T {
  if (!options.length) throw new Error(`Missing image style options for ${salt}.`);

  const hash = stableNumber(`${slug}:${salt}`);
  return options[(hash + index * step) % options.length];
}

function stableNumber(value: string) {
  const digest = crypto.createHash("sha256").update(value).digest("hex");
  return Number.parseInt(digest.slice(0, 12), 16);
}

function generatedPhotoUrl(slug: string) {
  return `/generated-lawyer-photos/${slug}.png?v=${photoVersion}`;
}

function buildPrompt(
  fullName: string,
  gender: Gender,
  style: ReturnType<typeof buildStyleProfile>
) {
  const tie = style.tieOption.hex ? style.tieOption.label : "no tie";

  return [
    "Professional lawyer profile portrait for a Russian legal directory.",
    `Subject: ${gender} lawyer, Eastern European professional appearance, ${style.expression.label}.`,
    `Wardrobe: ${style.suitColor.label}, ${style.shirtColor.label}, ${tie}.`,
    `Background: ${style.background.label}, ${style.background.accent ?? "subtle business environment"}.`,
    `Pose/framing: ${style.pose.label}, ${style.pose.crop ?? "profile portrait"}.`,
    `Style: ${style.visualStyle.label}.`,
    `Profile name for internal matching only: ${fullName}.`,
    "Avoid: cartoon look, over-glossy stock-photo mood, fake badges, logos, text, watermark, exaggerated luxury, casual clothing."
  ].join(" ");
}

function inferGender(lawyer: { firstName: string; lastName: string; middleName?: string | null }): Gender {
  const firstName = lawyer.firstName.toLowerCase();
  const middleName = lawyer.middleName?.toLowerCase() ?? "";
  const lastName = lawyer.lastName.toLowerCase();
  const femaleFirstNames = new Set([
    "анна",
    "алена",
    "алёна",
    "александра",
    "анастасия",
    "валентина",
    "валерия",
    "вера",
    "виктория",
    "галина",
    "дарья",
    "елена",
    "елизавета",
    "екатерина",
    "жанна",
    "зоя",
    "инна",
    "ирина",
    "кристина",
    "ксения",
    "лариса",
    "любовь",
    "людмила",
    "маргарита",
    "марина",
    "мария",
    "надежда",
    "наталья",
    "нина",
    "оксана",
    "ольга",
    "полина",
    "светлана",
    "софия",
    "татьяна",
    "юлия"
  ]);
  const maleFirstNames = new Set([
    "азамат",
    "александр",
    "алексей",
    "андрей",
    "антон",
    "артем",
    "артём",
    "борис",
    "вадим",
    "валерий",
    "василий",
    "виктор",
    "виталий",
    "владимир",
    "владислав",
    "вячеслав",
    "геннадий",
    "георгий",
    "григорий",
    "денис",
    "дмитрий",
    "евгений",
    "иван",
    "игорь",
    "илья",
    "кирилл",
    "константин",
    "лев",
    "максим",
    "михаил",
    "никита",
    "николай",
    "олег",
    "павел",
    "петр",
    "пётр",
    "роман",
    "сергей",
    "станислав",
    "тимур",
    "юрий",
    "ярослав"
  ]);

  if (/(вна|ична|кызы)$/.test(middleName)) return "female";
  if (/(вич|оглы)$/.test(middleName)) return "male";
  if (femaleFirstNames.has(firstName)) return "female";
  if (maleFirstNames.has(firstName)) return "male";
  if (/(ова|ева|ёва|ина|ая|ская|цкая)$/.test(lastName)) return "female";

  return "male";
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
