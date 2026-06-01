import { NextResponse } from "next/server";

import { assertProtectedApiRoute } from "@/libs/api/route-protection";
import { updateProfileOnboardingCompleted } from "@/libs/database/queries/profiles";

export async function POST() {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { user } = protection;

  const now = new Date().toISOString();
  try {
    await updateProfileOnboardingCompleted(user.id, now);
    return NextResponse.json({ ok: true, onboardingCompletedAt: now });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete onboarding.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
