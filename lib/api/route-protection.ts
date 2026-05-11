import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api/session";

export async function assertProtectedApiRoute() {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }
  return { ok: true as const, supabase, user };
}
