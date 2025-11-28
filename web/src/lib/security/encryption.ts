import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // AES-GCM recommended IV length

let cachedKey: Buffer | null = null;

function loadKey(): Buffer {
  if (cachedKey) {
    return cachedKey;
  }

  const raw = process.env.CALENDAR_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "CALENDAR_ENCRYPTION_KEY is missing. Generate a 32-byte base64 or hex string."
    );
  }

  let key: Buffer;
  const normalized = raw.trim();
  if (/^[a-f0-9]+$/i.test(normalized) && normalized.length === KEY_LENGTH * 2) {
    key = Buffer.from(normalized, "hex");
  } else {
    key = Buffer.from(normalized, "base64");
  }

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      "CALENDAR_ENCRYPTION_KEY must decode to 32 bytes (256-bit key)."
    );
  }

  cachedKey = key;
  return key;
}

export function encryptSecret(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) {
    return null;
  }

  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = buffer.subarray(IV_LENGTH + 16);

  const key = loadKey();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}


