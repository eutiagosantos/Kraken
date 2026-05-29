import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function encryptionKeyBytes(): Buffer {
  const raw = process.env.KRAKEN_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("KRAKEN_ENCRYPTION_KEY em falta.");
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  const buf = Buffer.from(raw, "utf8");
  if (buf.length !== 32) {
    throw new Error("KRAKEN_ENCRYPTION_KEY deve ter 32 bytes (64 hex ou string UTF-8 de 32 caracteres).");
  }
  return buf;
}

/** Encrypts App Secret for storage. Returns `ivHex:ciphertextHex`. */
export function encryptAppSecret(plaintext: string): string {
  const key = encryptionKeyBytes();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

/** Decrypts value produced by {@link encryptAppSecret}. */
export function decryptAppSecret(stored: string): string {
  const parts = stored.split(":");
  if (parts.length < 2) {
    throw new Error("Formato de secret encriptado inválido.");
  }
  const ivHex = parts.shift()!;
  const ciphertextHex = parts.join(":");
  const key = encryptionKeyBytes();
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(ciphertextHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function isEncryptionConfigured(): boolean {
  return Boolean(process.env.KRAKEN_ENCRYPTION_KEY?.trim());
}
