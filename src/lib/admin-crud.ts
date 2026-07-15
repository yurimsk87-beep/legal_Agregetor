import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type CrudFieldKind = "scalar" | "enum" | "object" | "unsupported";

export type CrudField = {
  name: string;
  kind: CrudFieldKind;
  type: string;
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  isUnique?: boolean;
  isReadOnly?: boolean;
  default?: unknown;
  hasDefaultValue: boolean;
  isUpdatedAt: boolean;
};

type CrudModel = {
  name: string;
  fields: CrudField[];
  primaryKey?: { fields: string[] } | null;
};

export type CrudModelConfig = {
  name: string;
  route: string;
  label: string;
  keyFields: CrudField[];
  scalarFields: CrudField[];
  createFields: CrudField[];
  updateFields: CrudField[];
  listFields: CrudField[];
};

type PrismaDelegate = {
  count(args?: unknown): Promise<number>;
  findMany(args?: unknown): Promise<Record<string, unknown>[]>;
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
  update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<unknown>;
  delete(args: { where: Record<string, unknown> }): Promise<unknown>;
};

const dmmfModels = Prisma.dmmf.datamodel.models as unknown as CrudModel[];
const enumOptions = new Map(
  Prisma.dmmf.datamodel.enums.map((item) => [item.name, item.values.map((value) => value.name)])
);
const hiddenEnumOptions = new Map([
  ["LeadStatus", new Set(["ASSIGNED"])],
  ["LeadSourceType", new Set(["CITY_SERVICE", "CHECKLIST", "CONTACTS", "DOCUMENT_REVIEW"])]
]);

export const adminCrudModels: CrudModelConfig[] = dmmfModels
  .map((model) => toModelConfig(model))
  .sort((left, right) => left.name.localeCompare(right.name));

export function getCrudModel(modelName: string) {
  return adminCrudModels.find((model) => model.name.toLowerCase() === decodeURIComponent(modelName).toLowerCase()) ?? null;
}

export function getEnumOptions(type: string) {
  const hidden = hiddenEnumOptions.get(type);
  const values = enumOptions.get(type) ?? [];
  return hidden ? values.filter((value) => !hidden.has(value)) : values;
}

export function getCrudDelegate(modelName: string): PrismaDelegate {
  const delegateName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const delegate = prisma[delegateName as keyof typeof prisma];

  if (!delegate || typeof delegate !== "object") {
    throw new Error(`Unsupported Prisma model: ${modelName}`);
  }

  return delegate as unknown as PrismaDelegate;
}

export function makeRowKey(model: CrudModelConfig, row: Record<string, unknown>) {
  return JSON.stringify(Object.fromEntries(model.keyFields.map((field) => [field.name, normalizeRowValue(row[field.name])])));
}

export function buildWhereFromKey(model: CrudModelConfig, key: string) {
  const parsed = JSON.parse(key) as Record<string, unknown>;

  if (model.keyFields.length === 1) {
    const keyField = model.keyFields[0];
    return { [keyField.name]: parseScalarValue(keyField, String(parsed[keyField.name] ?? "")) };
  }

  const compoundName = model.keyFields.map((field) => field.name).join("_");
  return {
    [compoundName]: Object.fromEntries(
      model.keyFields.map((field) => [field.name, parseScalarValue(field, String(parsed[field.name] ?? ""))])
    )
  };
}

export function parseCrudFormData(model: CrudModelConfig, formData: FormData, mode: "create" | "update") {
  const fields = mode === "create" ? model.createFields : model.updateFields;
  const data: Record<string, unknown> = {};

  for (const field of fields) {
    const raw = formData.get(field.name);
    const value = String(raw ?? "").trim();
    if (!value) {
      if (mode === "create" && field.hasDefaultValue) {
        continue;
      }
      if (!field.isRequired) {
        data[field.name] = null;
      } else if (mode === "update") {
        data[field.name] = parseEmptyRequiredValue(field);
      }
      continue;
    }

    data[field.name] = parseScalarValue(field, value);
  }

  return data;
}

export function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(displayValue).join(", ");
  if (typeof value === "object") {
    if ("toString" in value && Object.prototype.toString.call(value) !== "[object Object]") {
      return String(value);
    }
    return JSON.stringify(value);
  }
  return String(value);
}

export function inputValue(field: CrudField, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (field.type === "Json" || field.isList) return JSON.stringify(value, null, 2);
  if (value instanceof Date) return value.toISOString();
  return displayValue(value);
}

export function isLongField(field: CrudField) {
  return field.type === "Json" || field.isList || ["content", "seoText", "description", "summary", "text", "message"].some((part) => field.name.includes(part));
}

export async function countCrudRows() {
  const pairs = await Promise.all(
    adminCrudModels.map(async (model) => {
      try {
        return [model.name, await getCrudDelegate(model.name).count()] as const;
      } catch {
        return [model.name, 0] as const;
      }
    })
  );

  return new Map(pairs);
}

function toModelConfig(model: CrudModel): CrudModelConfig {
  const scalarFields = model.fields.filter((field) => field.kind === "scalar" || field.kind === "enum");
  const keyFields = resolveKeyFields(model, scalarFields);
  const keyNames = new Set(keyFields.map((field) => field.name));
  const createFields = scalarFields.filter((field) => !field.isUpdatedAt && !(field.isId && field.hasDefaultValue) && field.name !== "createdAt" && field.name !== "updatedAt");
  const updateFields = scalarFields.filter(
    (field) => !field.isUpdatedAt && !keyNames.has(field.name) && field.name !== "createdAt" && field.name !== "updatedAt"
  );
  const priorityNames = ["id", "slug", "title", "name", "email", "url", "status", "type", "isIndexable", "seoScore", "createdAt", "updatedAt"];
  const listFields = [
    ...priorityNames.map((name) => scalarFields.find((field) => field.name === name)).filter(Boolean),
    ...scalarFields.filter((field) => !priorityNames.includes(field.name))
  ].slice(0, 8) as CrudField[];

  return {
    name: model.name,
    route: `/admin/crud/${model.name}/`,
    label: splitPascalCase(model.name),
    keyFields,
    scalarFields,
    createFields,
    updateFields,
    listFields
  };
}

function resolveKeyFields(model: CrudModel, scalarFields: CrudField[]) {
  const idField = scalarFields.find((field) => field.isId);
  if (idField) return [idField];

  const primaryKeyFields = model.primaryKey?.fields ?? [];
  if (primaryKeyFields.length) {
    return primaryKeyFields.map((name) => scalarFields.find((field) => field.name === name)).filter(Boolean) as CrudField[];
  }

  const uniqueField = scalarFields.find((field) => field.isUnique);
  if (uniqueField) return [uniqueField];

  return scalarFields.slice(0, 1);
}

function splitPascalCase(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function normalizeRowValue(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return displayValue(value);
}

function parseScalarValue(field: CrudField, value: string): unknown {
  if (field.isList) return parseListValue(value);
  if (field.kind === "enum") return value;

  switch (field.type) {
    case "Int":
      return Number.parseInt(value, 10);
    case "Float":
    case "Decimal":
      return value;
    case "Boolean":
      return value === "true" || value === "on" || value === "1";
    case "DateTime":
      return new Date(value);
    case "Json":
      return JSON.parse(value);
    default:
      return value;
  }
}

function parseListValue(value: string) {
  if (value.startsWith("[")) return JSON.parse(value);
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseEmptyRequiredValue(field: CrudField) {
  if (field.kind === "enum") return getEnumOptions(field.type)[0] ?? "";
  if (field.isList) return [];
  switch (field.type) {
    case "Int":
      return 0;
    case "Float":
    case "Decimal":
      return "0";
    case "Boolean":
      return false;
    case "Json":
      return {};
    case "DateTime":
      return new Date();
    default:
      return "";
  }
}
