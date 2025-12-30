import type { ReportDefinition, ReportSectionDefinition } from "./types.js";

export type ReportSectionDraft = {
  id: string;
  title: string;
  contentMarkdown: string;
  evidenceIds: string[];
};

export type ReportDraft = {
  definitionId: string;
  title: string;
  sections: ReportSectionDraft[];
  evidenceIds: string[];
};

function sectionDraftFromDef(sd: ReportSectionDefinition): ReportSectionDraft {
  return {
    id: sd.id,
    title: sd.title,
    contentMarkdown: "",
    evidenceIds: [],
  };
}

export function createDraftFromDefinition(def: ReportDefinition, title?: string): ReportDraft {
  const sections = [
    ...def.requiredSections.map(sectionDraftFromDef),
    ...def.recommendedSections.map(sectionDraftFromDef),
  ];

  return {
    definitionId: def.id,
    title: title ?? def.title,
    sections,
    evidenceIds: [],
  };
}


