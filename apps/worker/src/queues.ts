export const QUEUES = {
  ingest: "ingest",
} as const;

export const JOBS = {
  ingestRss: "ingest.rss",
  retentionCleanup: "maintenance.retention_cleanup",
  autoSitrep: "reports.auto_sitrep",
  distributeReport: "reports.distribute",
  evaluateSignal: "signals.evaluate",
  enrichEvidence: "evidence.enrich",
  generateProduct: "products.generate",
  distributeProduct: "products.distribute",
} as const;
