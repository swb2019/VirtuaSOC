import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { ReportDefinition } from "./types.js";

export type LoadReportDefinitionsOptions = {
  dir?: string;
};

function defaultDefinitionsDir(): string {
  return fileURLToPath(new URL("../report_definitions/mvp/", import.meta.url));
}

export async function loadReportDefinitions(opts: LoadReportDefinitionsOptions = {}): Promise<ReportDefinition[]> {
  const dir = opts.dir ?? defaultDefinitionsDir();
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort((a, b) => a.localeCompare(b));

  const defs: ReportDefinition[] = [];
  for (const file of files) {
    const text = await readFile(`${dir}/${file}`, "utf8");
    defs.push(JSON.parse(text) as ReportDefinition);
  }
  return defs;
}



