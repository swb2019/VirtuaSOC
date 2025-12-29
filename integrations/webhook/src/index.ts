export type WebhookPayload = unknown;

export async function postWebhook(url: string, payload: WebhookPayload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Webhook failed: ${res.status}`);
}
