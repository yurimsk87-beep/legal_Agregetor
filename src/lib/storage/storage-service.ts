import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type StorageDriver = "local" | "s3";
export type UploadKind = "lawyer-photo" | "document" | "generic";

export type UploadFileInput = {
  file?: Blob;
  buffer?: Buffer | Uint8Array | ArrayBuffer;
  mimeType?: string;
  size?: number;
  kind?: UploadKind;
  prefix?: string;
  allowedMimeTypes?: readonly string[];
  maxSizeMb?: number;
};

export type UploadFileResult = {
  key: string;
  publicUrl: string;
  mimeType: string;
  size: number;
  driver: StorageDriver;
};

type NormalizedUpload = {
  buffer: Buffer;
  mimeType: string;
  size: number;
};

type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string;
};

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageValidationError";
  }
}

export class StorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageConfigurationError";
  }
}

export const DEFAULT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "application/rtf",
  "text/plain"
] as const;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.oasis.opendocument.text": ".odt",
  "application/rtf": ".rtf",
  "text/plain": ".txt"
};

const KIND_PREFIXES: Record<UploadKind, string> = {
  "lawyer-photo": "lawyers/photos",
  document: "documents",
  generic: "files"
};

const STRICT_SIGNATURE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "application/pdf"]);

export class StorageService {
  async uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
    const upload = await normalizeUpload(input);
    validateUpload(upload, input);

    const driver = getStorageDriver();
    const key = buildObjectKey(input.kind ?? "generic", input.prefix, upload.mimeType);

    if (driver === "s3") {
      const config = getS3Config();
      await uploadToS3(config, key, upload.buffer, upload.mimeType);

      return {
        key,
        publicUrl: buildS3PublicUrl(config, key),
        mimeType: upload.mimeType,
        size: upload.size,
        driver
      };
    }

    await uploadToLocal(key, upload.buffer);

    return {
      key,
      publicUrl: buildLocalPublicUrl(key),
      mimeType: upload.mimeType,
      size: upload.size,
      driver
    };
  }

  getPublicUrl(key: string) {
    if (!isSafeObjectKey(key)) {
      throw new StorageValidationError("Invalid storage key.");
    }

    if (getStorageDriver() === "s3") {
      return buildS3PublicUrl(getS3Config(), key);
    }

    return buildLocalPublicUrl(key);
  }
}

export const storageService = new StorageService();

async function normalizeUpload(input: UploadFileInput): Promise<NormalizedUpload> {
  let buffer: Buffer;

  if (input.file) {
    buffer = Buffer.from(await input.file.arrayBuffer());
  } else if (input.buffer instanceof ArrayBuffer) {
    buffer = Buffer.from(input.buffer);
  } else if (input.buffer) {
    buffer = Buffer.from(input.buffer);
  } else {
    throw new StorageValidationError("File is required.");
  }

  const declaredMimeType = normalizeMimeType(input.mimeType || input.file?.type);
  const sniffedMimeType = sniffMimeType(buffer);
  const mimeType = declaredMimeType || sniffedMimeType;

  if (!mimeType) {
    throw new StorageValidationError("File MIME type is required.");
  }

  return {
    buffer,
    mimeType,
    size: input.size ?? input.file?.size ?? buffer.byteLength
  };
}

function validateUpload(upload: NormalizedUpload, input: UploadFileInput) {
  if (upload.size <= 0 || upload.buffer.byteLength <= 0) {
    throw new StorageValidationError("Empty files are not allowed.");
  }

  const maxSizeMb = input.maxSizeMb ?? getMaxUploadSizeMb();
  const maxBytes = maxSizeMb * 1024 * 1024;

  if (upload.size > maxBytes || upload.buffer.byteLength > maxBytes) {
    throw new StorageValidationError(`File is too large. Maximum size is ${maxSizeMb} MB.`);
  }

  const allowedMimeTypes = new Set(input.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES);
  if (!allowedMimeTypes.has(upload.mimeType)) {
    throw new StorageValidationError(`MIME type ${upload.mimeType} is not allowed.`);
  }

  const sniffedMimeType = sniffMimeType(upload.buffer);
  if (STRICT_SIGNATURE_MIME_TYPES.has(upload.mimeType) && sniffedMimeType !== upload.mimeType) {
    throw new StorageValidationError("File content does not match the declared MIME type.");
  }
}

function getStorageDriver(): StorageDriver {
  const value = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  if (value === "local" || value === "s3") return value;
  throw new StorageConfigurationError("STORAGE_DRIVER must be either local or s3.");
}

function getMaxUploadSizeMb() {
  const value = Number(process.env.MAX_UPLOAD_SIZE_MB || 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new StorageConfigurationError("MAX_UPLOAD_SIZE_MB must be a positive number.");
  }
  return value;
}

function getS3Config(): S3Config {
  const config = {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL
  };

  const missing = Object.entries(config)
    .filter(([key, value]) => key !== "publicBaseUrl" && !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new StorageConfigurationError(`Missing S3 storage env vars: ${missing.join(", ")}.`);
  }

  return config as S3Config;
}

function buildObjectKey(kind: UploadKind, prefix: string | undefined, mimeType: string) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safePrefix = sanitizePrefix(prefix || KIND_PREFIXES[kind]);
  const extension = MIME_EXTENSIONS[mimeType] || ".bin";
  const key = `${safePrefix}/${year}/${month}/${crypto.randomUUID()}${extension}`;

  if (!isSafeObjectKey(key)) {
    throw new StorageValidationError("Generated storage key is invalid.");
  }

  return key;
}

function sanitizePrefix(value: string) {
  const normalized = value
    .replace(/\\/g, "/")
    .toLowerCase()
    .split("/")
    .map((segment) => segment.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");

  return normalized || KIND_PREFIXES.generic;
}

function isSafeObjectKey(key: string) {
  return (
    key.length > 0 &&
    key.length <= 500 &&
    !key.startsWith("/") &&
    !key.includes("\\") &&
    !key.split("/").some((segment) => !segment || segment === "." || segment === "..") &&
    /^[a-z0-9/_-]+\.[a-z0-9]+$/.test(key)
  );
}

function normalizeMimeType(value?: string) {
  return value?.split(";")[0]?.trim().toLowerCase() || "";
}

function sniffMimeType(buffer: Buffer) {
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }

  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis") return "image/avif";
  }

  if (buffer.length >= 6) {
    const gifHeader = buffer.subarray(0, 6).toString("ascii");
    if (gifHeader === "GIF87a" || gifHeader === "GIF89a") return "image/gif";
  }

  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }

  return "";
}

async function uploadToLocal(key: string, buffer: Buffer) {
  const uploadRoot = path.resolve(process.cwd(), "public", "uploads");
  const destination = path.resolve(uploadRoot, ...key.split("/"));

  if (!destination.startsWith(`${uploadRoot}${path.sep}`)) {
    throw new StorageValidationError("Invalid local storage path.");
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, buffer, { flag: "wx" });
}

async function uploadToS3(config: S3Config, key: string, buffer: Buffer, mimeType: string) {
  const endpoint = config.endpoint.replace(/\/+$/, "");
  const encodedBucket = encodeURIComponent(config.bucket);
  const encodedKey = encodeS3Key(key);
  const url = new URL(`${encodedBucket}/${encodedKey}`, `${endpoint}/`);
  const host = url.host;
  const { amzDate, dateStamp } = getAmzDates(new Date());
  const payloadHash = sha256Hex(buffer);
  const canonicalUri = `/${encodedBucket}/${encodedKey}`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = [
    `content-type:${mimeType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`
  ].join("\n");
  const canonicalRequest = ["PUT", canonicalUri, "", `${canonicalHeaders}\n`, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signature = hmacHex(getSignatureKey(config.secretAccessKey, dateStamp, config.region, "s3"), stringToSign);
  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const body = new Blob([new Uint8Array(buffer)], { type: mimeType });
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": mimeType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate
    },
    body
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`S3 upload failed with status ${response.status}${body ? `: ${body.slice(0, 300)}` : ""}`);
  }
}

function buildLocalPublicUrl(key: string) {
  return buildPublicUrl(`/uploads/${key}`);
}

function buildS3PublicUrl(config: S3Config, key: string) {
  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/+$/, "")}/${encodeS3Key(key)}`;
  }

  return `${config.endpoint.replace(/\/+$/, "")}/${encodeURIComponent(config.bucket)}/${encodeS3Key(key)}`;
}

function buildPublicUrl(pathname: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (!siteUrl) return pathname;
  return new URL(pathname, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString();
}

function encodeS3Key(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function sha256Hex(value: crypto.BinaryLike) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hmac(key: crypto.BinaryLike, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: crypto.BinaryLike, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest("hex");
}

function getSignatureKey(secretAccessKey: string, dateStamp: string, region: string, service: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, service);
  return hmac(serviceKey, "aws4_request");
}

function getAmzDates(date: Date) {
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate,
    dateStamp: amzDate.slice(0, 8)
  };
}
