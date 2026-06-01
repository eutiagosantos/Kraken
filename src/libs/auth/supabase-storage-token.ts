import "server-only";

import jwt from "jsonwebtoken";

import { getSessionUser } from "@/libs/api/session";

/** Mints a Supabase-compatible JWT so Storage RLS (`auth.uid()`) matches `profiles.id`. */
export async function createSupabaseStorageAccessToken(): Promise<
  { accessToken: string; expiresAt: number } | { error: string }
> {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET?.trim();
  if (!jwtSecret) {
    return { error: "SUPABASE_JWT_SECRET is not configured." };
  }

  const { user, error } = await getSessionUser();
  if (error) return { error: error.message };
  if (!user) return { error: "Unauthorized." };

  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
  const accessToken = jwt.sign(
    {
      sub: user.id,
      role: "authenticated",
      aud: "authenticated",
    },
    jwtSecret,
    { expiresIn: "1h" }
  );

  return { accessToken, expiresAt };
}
