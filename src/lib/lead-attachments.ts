import crypto from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { DOCUMENT_REVIEW_RETENTION_DAYS } from "@/data/document-review-policy";

const maxPdfSizeMb = 5;
const maxPdfBytes = maxPdfSizeMb * 1024 * 1024;
const dangerousPdfTokens = [
  "/javascript",
  "/js",
  "/launch",
  "/embeddedfile",
  "/openaction",
  "/aa",
  "/richmedia",
  "/submitform",
  "/importdata",
  "/gotoe",
  "/rendition",
  "/sound",
  "/movie",
  "/objstm",
  "/xrefstm"
];

export type StoredLeadAttachment = {
  fileName: string;
  fileType: "application/pdf";
  fileSize: number;
  storageKey: string;
  storedAt: string;
  expiresAt: string;
  storageBackend: "shared-private-filesystem" | "local-private-filesystem";
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

export function validateLeadPdfBuffer(buffer: Buffer): string | null {
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    return "Содержимое файла не соответствует формату PDF.";
  }
  if (!buffer.subarray(Math.max(0, buffer.length - 2048)).toString("latin1").includes("%%EOF")) {
    return "PDF не содержит корректного завершения файла.";
  }
  const pdfSource = buffer
    .toString("latin1")
    .replace(/#([0-9a-f]{2})/gi, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .toLowerCase();
  if (dangerousPdfTokens.some((token) => pdfSource.includes(token))) {
    return "PDF содержит запрещённые активные или вложенные объекты.";
  }
  return null;
}

export async function storeLeadPdfAttachment(leadId: string, file: File): Promise<StoredLeadAttachment> {
  const validationError = validateLeadPdfAttachment(file);
  if (validationError) throw new LeadAttachmentValidationError(validationError);

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentError = validateLeadPdfBuffer(buffer);
  if (contentError) throw new LeadAttachmentValidationError(contentError);

  const storageKey = `${leadId}/${crypto.randomUUID()}.pdf`;
  const destination = resolveLeadAttachmentPath(storageKey);
  await cleanupExpiredLeadPdfAttachments().catch(() => undefined);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, buffer, { flag: "wx" });
  const storedAt = new Date();
  const expiresAt = new Date(storedAt.getTime() + DOCUMENT_REVIEW_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  return {
    fileName: safeDownloadName(file.name),
    fileType: "application/pdf",
    fileSize: file.size,
    storageKey,
    storedAt: storedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    storageBackend: process.env.LEAD_ATTACHMENT_STORAGE_ROOT ? "shared-private-filesystem" : "local-private-filesystem"
  };
}

export async function readLeadPdfAttachment(attachment: StoredLeadAttachment) {
  if (Date.parse(attachment.expiresAt) <= Date.now()) {
    await deleteLeadPdfAttachment(attachment.storageKey);
    throw new LeadAttachmentValidationError("Срок хранения PDF истёк, файл удалён.");
  }
  return readFile(resolveLeadAttachmentPath(attachment.storageKey));
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
    typeof item.storageKey === "string" &&
    typeof item.storedAt === "string" &&
    typeof item.expiresAt === "string" &&
    (item.storageBackend === "shared-private-filesystem" || item.storageBackend === "local-private-filesystem")
  );
}

function resolveLeadAttachmentPath(storageKey: string) {
  if (!/^[a-zA-Z0-9_-]+\/[a-f0-9-]+\.pdf$/.test(storageKey)) {
    throw new LeadAttachmentValidationError("Некорректный путь PDF-вложения.");
  }
  const privateRoot = getPrivateRoot();
  const destination = path.resolve(privateRoot, ...storageKey.split("/"));
  if (!destination.startsWith(`${privateRoot}${path.sep}`)) {
    throw new LeadAttachmentValidationError("Некорректный путь PDF-вложения.");
  }
  return destination;
}

function getPrivateRoot() {
  const configuredRoot = process.env.LEAD_ATTACHMENT_STORAGE_ROOT?.trim();
  if (process.env.NODE_ENV === "production" && !configuredRoot) {
    throw new LeadAttachmentValidationError("Закрытое общее хранилище PDF не настроено для production.");
  }
  return path.resolve(configuredRoot || path.join(process.cwd(), ".private", "lead-attachments"));
}

async function cleanupExpiredLeadPdfAttachments() {
  const privateRoot = getPrivateRoot();
  const entries = await readdir(privateRoot, { recursive: true, withFileTypes: true }).catch(() => []);
  const threshold = Date.now() - DOCUMENT_REVIEW_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  await Promise.all(entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".pdf"))
    .map(async (entry) => {
      const filePath = path.join(entry.parentPath, entry.name);
      const metadata = await stat(filePath);
      if (metadata.mtimeMs < threshold) await rm(filePath, { force: true });
    }));
}

function safeDownloadName(name: string) {
  const base = path.parse(name).name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]+/g, "-").slice(0, 100);
  return `${base || "document-review"}.pdf`;
}

