import crypto from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const maxPdfSizeMb = 5;
const maxPdfBytes = maxPdfSizeMb * 1024 * 1024;

export type StoredLeadAttachment = {
  fileName: string;
  fileType: "application/pdf";
  fileSize: number;
  storageKey: string;
};

export class LeadAttachmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadAttachmentValidationError";
  }
}

export function validateLeadPdfAttachment(file: File): string | null {
  if (!file.size) return "PDF-файл не сформирован.";
  if (file.size > maxPdfBytes) return `Размер PDF не должен превышать ${maxPdfSizeMb} МБ.`;
  if (file.type && file.type !== "application/pdf") return "Для проверки можно передать только PDF.";
  if (!file.name.toLowerCase().endsWith(".pdf")) return "Имя файла должно оканчиваться на .pdf.";
  return null;
}

export async function storeLeadPdfAttachment(leadId: string, file: File): Promise<StoredLeadAttachment> {
  const validationError = validateLeadPdfAttachment(file);
  if (validationError) throw new LeadAttachmentValidationError(validationError);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new LeadAttachmentValidationError("Содержимое файла не соответствует формату PDF.");
  }

  const storageKey = `${leadId}/${crypto.randomUUID()}.pdf`;
  const destination = resolveLeadAttachmentPath(storageKey);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, buffer, { flag: "wx" });

  return {
    fileName: safeDownloadName(file.name),
    fileType: "application/pdf",
    fileSize: file.size,
    storageKey
  };
}

export async function readLeadPdfAttachment(storageKey: string) {
  return readFile(resolveLeadAttachmentPath(storageKey));
}

export async function deleteLeadPdfAttachment(storageKey: string) {
  await rm(resolveLeadAttachmentPath(storageKey), { force: true });
}

export function isStoredLeadAttachment(value: unknown): value is StoredLeadAttachment {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<StoredLeadAttachment>;
  return (
    typeof item.fileName === "string" &&
    item.fileType === "application/pdf" &&
    typeof item.fileSize === "number" &&
    typeof item.storageKey === "string"
  );
}

function resolveLeadAttachmentPath(storageKey: string) {
  if (!/^[a-zA-Z0-9_-]+\/[a-f0-9-]+\.pdf$/.test(storageKey)) {
    throw new LeadAttachmentValidationError("Некорректный путь PDF-вложения.");
  }
  const privateRoot = path.resolve(process.cwd(), ".private", "lead-attachments");
  const destination = path.resolve(privateRoot, ...storageKey.split("/"));
  if (!destination.startsWith(`${privateRoot}${path.sep}`)) {
    throw new LeadAttachmentValidationError("Некорректный путь PDF-вложения.");
  }
  return destination;
}

function safeDownloadName(name: string) {
  const base = path.parse(name).name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]+/g, "-").slice(0, 100);
  return `${base || "document-review"}.pdf`;
}
