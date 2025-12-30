import type { FastifyPluginAsync } from "fastify";

import { loadReportDefinitions } from "@virtuasoc/reporting";

export const reportDefinitionsRoutes: FastifyPluginAsync = async (app) => {
  const defs = await loadReportDefinitions({
    dir: process.env.REPORT_DEFINITIONS_DIR,
  });

  app.get("/report-definitions", async () => ({ definitions: defs }));

  app.get<{ Params: { id: string } }>("/report-definitions/:id", async (req, reply) => {
    const def = defs.find((d) => d.id === req.params.id);
    if (!def) return reply.code(404).send({ error: "Not found" });
    return { definition: def };
  });
};


