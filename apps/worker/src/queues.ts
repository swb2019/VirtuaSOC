export const QUEUES = {
  ingest: "ingest",
} as const;

export const JOBS = {
  ingestRss: "ingest.rss",
  retentionCleanup: "maintenance.retention_cleanup",
  autoSitrep: "reports.auto_sitrep",
} as const;
