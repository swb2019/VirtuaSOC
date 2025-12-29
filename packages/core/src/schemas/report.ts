import { Type } from "@sinclair/typebox";

import { Audience, Handling, IsoDateTime, Severity, Uuid } from "./common.js";

export const ReportStatus = Type.Union(
  [
    Type.Literal("draft"),
    Type.Literal("in_review"),
    Type.Literal("approved"),
    Type.Literal("rejected"),
    Type.Literal("distributed"),
  ],
  { $id: "ReportStatus" },
);

export const ReportSectionSchema = Type.Object(
  {
    id: Type.String({ maxLength: 64 }),
    title: Type.String({ maxLength: 128 }),
    contentMarkdown: Type.String({ maxLength: 200000 }),
    evidenceIds: Type.Array(Uuid, { default: [] }),
  },
  { $id: "ReportSection", additionalProperties: false },
);

export const ReportSchema = Type.Object(
  {
    id: Uuid,
    tenantId: Uuid,
    createdAt: IsoDateTime,
    updatedAt: IsoDateTime,
    definitionId: Type.String({ maxLength: 128 }),
    title: Type.String({ maxLength: 512 }),
    status: ReportStatus,
    audience: Type.Array(Audience, { default: [] }),
    handling: Handling,
    severity: Type.Optional(Severity),
    periodStart: Type.Optional(IsoDateTime),
    periodEnd: Type.Optional(IsoDateTime),
    sections: Type.Array(ReportSectionSchema, { default: [] }),
    fullMarkdown: Type.Optional(Type.String({ maxLength: 400000 })),
    evidenceIds: Type.Array(Uuid, { default: [] }),
    createdByUserId: Type.Optional(Uuid),
    approvedByUserId: Type.Optional(Uuid),
    approvedAt: Type.Optional(IsoDateTime),
  },
  { $id: "Report", additionalProperties: false },
);
