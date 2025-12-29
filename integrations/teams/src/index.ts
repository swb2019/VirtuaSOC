export type TeamsWebhookMessage = {
  title: string;
  text: string;
};

export async function sendTeamsWebhook(webhookUrl: string, msg: TeamsWebhookMessage) {
  const payload = { title: msg.title, text: msg.text };
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Teams webhook failed: ${res.status}`);
  }
}
