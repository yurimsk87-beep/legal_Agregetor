import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { documentResultSchema, type DocumentResultV1 } from "@/lib/document-result-contract";

function storageKey(): Buffer {
  const raw = process.env.DOCUMENT_STORAGE_KEY;
  if (!raw || !/^[A-Za-z0-9+/]{43}=$/.test(raw)) {
    throw new Error("DOCUMENT_STORAGE_KEY must be a base64-encoded 32-byte key.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("Invalid DOCUMENT_STORAGE_KEY length.");
  return key;
}

function associatedData(ownerId: string, versionId: string): Buffer {
  return Buffer.from(`saved-legal-document-v1:${ownerId}:${versionId}`, "utf8");
}

/** No plaintext document title, facts, or text is stored in the archive table. */
export function encryptSavedDocument(result: DocumentResultV1, ownerId: string): string {
  const parsed = documentResultSchema.parse(result);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", storageKey(), iv);
  cipher.setAAD(associatedData(ownerId, parsed.versionId));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(parsed), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptSavedDocument(payload: string, ownerId: string, versionId: string): DocumentResultV1 {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("Unknown encrypted document format.");
  const iv = Buffer.from(parts[1], "base64url");
  const tag = Buffer.from(parts[2], "base64url");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Invalid encrypted document.");
  const decipher = createDecipheriv("aes-256-gcm", storageKey(), iv);
  decipher.setAAD(associatedData(ownerId, versionId));
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(Buffer.from(parts[3], "base64url")), decipher.final()]);
  const result = documentResultSchema.parse(JSON.parse(plaintext.toString("utf8")));
  if (result.versionId !== versionId) throw new Error("Document ID mismatch.");
  return result;
}
