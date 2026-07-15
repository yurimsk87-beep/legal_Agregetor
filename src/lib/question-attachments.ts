import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const QUESTION_ATTACHMENT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
] as const;

const maxAttachmentSizeMb = 10;
const maxAttachmentBytes = maxAttachmentSizeMb * 1024 * 1024;

const mimeExtensions: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx"
};

export type StoredQuestionAttachment = {
  fileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
};

export const QUESTION_ATTACHMENT_MAX_SIZE_MB = maxAttachmentSizeMb;

export class QuestionAttachmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestionAttachmentValidationError";
  }
}

/** Returns a user-facing error message, or null when the file is acceptable. */
export function validateQuestionAttachment(file: File): string | null {
  if (file.size === 0) return null;
  if (file.size > maxAttachmentBytes) {
    return `Размер файла не должен превышать ${maxAttachmentSizeMb} МБ.`;
  }

  const fileType = file.type || mimeByName(file.name);
  if (!QUESTION_ATTACHMENT_ALLOWED_MIME_TYPES.includes(fileType as (typeof QUESTION_ATTACHMENT_ALLOWED_MIME_TYPES)[number])) {
    return "Разрешены только pdf, jpg, jpeg, png, doc и docx.";
  }

  return null;
}

export async function storeQuestionAttachment(questionId: string, file: File): Promise<StoredQuestionAttachment | null> {
  if (file.size === 0) return null;
  if (file.size > maxAttachmentBytes) {
    throw new QuestionAttachmentValidationError(`Размер файла не должен превышать ${maxAttachmentSizeMb} МБ.`);
  }

  const fileType = file.type || mimeByName(file.name);
  if (!QUESTION_ATTACHMENT_ALLOWED_MIME_TYPES.includes(fileType as (typeof QUESTION_ATTACHMENT_ALLOWED_MIME_TYPES)[number])) {
    throw new QuestionAttachmentValidationError("Разрешены только pdf, jpg, jpeg, png, doc и docx.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = mimeExtensions[fileType] || extensionByName(file.name);
  const safeName = safeFileName(file.name, extension);
  const storageKey = `questions/${questionId}/${crypto.randomUUID()}-${safeName}`;
  const privateRoot = path.resolve(process.cwd(), ".private", "question-attachments");
  const destination = path.resolve(privateRoot, ...storageKey.split("/"));

  if (!destination.startsWith(`${privateRoot}${path.sep}`)) {
    throw new QuestionAttachmentValidationError("Некорректный путь вложения.");
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, buffer, { flag: "wx" });

  return {
    fileName: file.name || safeName,
    fileType,
    fileSize: file.size,
    storageKey
  };
}

function mimeByName(name: string) {
  const extension = extensionByName(name);
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".doc") return "application/msword";
  if (extension === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "";
}

function extensionByName(name: string) {
  const extension = path.extname(name).toLowerCase();
  return extension === ".jpeg" ? ".jpg" : extension;
}

function safeFileName(name: string, fallbackExtension: string) {
  const parsed = path.parse(name);
  const base = (parsed.name || "attachment")
    .toLowerCase()
    .replace(/[^a-z0-9а-яё_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const extension = extensionByName(name) || fallbackExtension || ".bin";
  return `${base || "attachment"}${extension}`;
}
