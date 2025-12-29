import { createDecipheriv } from "node:crypto";

function decodeKey(key: string): Buffer {
  const trimmed = key.trim();
  if (!trimmed) throw new Error("TENANT_DSN_ENCRYPTION_KEY is required");

  const isHex = /^[0-9a-f]+$/i.test(trimmed) && trimmed.length % 2 === 0;
  const buf = isHex ? Buffer.from(trimmed, "hex") : Buffer.from(trimmed, "base64");
  if (buf.length !== 32) throw new Error("TENANT_DSN_ENCRYPTION_KEY must be 32 bytes (base64 or hex)");
  return buf;
}

export function decryptString(encryptionKey: string, encrypted: string): string {
  const key = decodeKey(encryptionKey);
  const parts = encrypted.split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted payload format");

  const [ivB64, ctB64, tagB64] = parts;
  const iv = Buffer.from(ivB64!, "base64");
  const ciphertext = Buffer.from(ctB64!, "base64");
  const tag = Buffer.from(tagB64!, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}


