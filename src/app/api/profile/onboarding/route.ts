import { NextResponse } from "next/server";

import { assertProtectedApiRoute } from "@/lib/api/route-protection";

export async function POST() {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { supabase, user } = protection;

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: now })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, onboardingCompletedAt: now });
}
