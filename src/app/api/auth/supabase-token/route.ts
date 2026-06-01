import { NextResponse } from "next/server";

import { createSupabaseStorageAccessToken } from "@/libs/auth/supabase-storage-token";

export async function GET() {
  const result = await createSupabaseStorageAccessToken();
  if ("error" in result) {
    const status = result.error === "Unauthorized." ? 401 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({
    access_token: result.accessToken,
    expires_at: result.expiresAt,
  });
}
