import { NextResponse } from "next/server";

import { getSessionUser } from "@/libs/api/session";

export async function assertProtectedApiRoute() {
  const { user, error } = await getSessionUser();
  if (error) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: error.message }, { status: 500 }),
    };
  }
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }
  return { ok: true as const, user };
}
