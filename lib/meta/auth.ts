import type { MetaTokenValidationResult } from "@/lib/meta/types";

export function validateMetaToken(token: string): MetaTokenValidationResult {
  if (!token) {
    return { valid: false, reason: "Token ausente." };
  }

  return { valid: true };
}
