export type EntityType = "PERSON" | "FACILITY" | "ROUTE" | "VENDOR" | "ORG";

export const ENTITY_TYPES: EntityType[] = ["PERSON", "FACILITY", "ROUTE", "VENDOR", "ORG"];

export function normalizeEntityType(raw: unknown): EntityType | null {
  const s = String(raw ?? "").trim().toUpperCase();
  if (s === "PERSON" || s === "FACILITY" || s === "ROUTE" || s === "VENDOR" || s === "ORG") return s;
  return null;
}


