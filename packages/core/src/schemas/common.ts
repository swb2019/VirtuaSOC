import { Type } from "@sinclair/typebox";

export const Uuid = Type.String({ format: "uuid" });
export const IsoDateTime = Type.String({ format: "date-time" });

export const Severity = Type.Union(
  [
    Type.Literal("low"),
    Type.Literal("medium"),
    Type.Literal("high"),
    Type.Literal("critical"),
  ],
  { $id: "Severity" },
);

export const Handling = Type.Union(
  [
    Type.Literal("unclassified"),
    Type.Literal("internal"),
    Type.Literal("confidential"),
    Type.Literal("restricted"),
  ],
  { $id: "Handling" },
);

export const Confidence = Type.Union(
  [
    Type.Literal("low"),
    Type.Literal("moderate"),
    Type.Literal("high"),
    Type.Literal("very_high"),
  ],
  { $id: "Confidence" },
);

export const Audience = Type.Union(
  [
    Type.Literal("gsoc_analyst"),
    Type.Literal("gsoc_lead"),
    Type.Literal("executive"),
    Type.Literal("regional_security"),
    Type.Literal("ep_team"),
    Type.Literal("all_employees"),
  ],
  { $id: "Audience" },
);
