export type ReportSectionDefinition = {
  id: string;
  title: string;
  required: boolean;
  maxChars?: number;
};

export type ReportDefinition = {
  id: string;
  title: string;
  description: string;
  cadence: "ad_hoc" | "daily" | "weekly" | "monthly" | "incident";
  requiredSources: string[];
  requiredSections: ReportSectionDefinition[];
  recommendedSections: ReportSectionDefinition[];
};
