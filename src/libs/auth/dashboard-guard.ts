import "server-only";

import { redirect } from "next/navigation";

import { getSessionUser } from "@/libs/api/session";
import { getProfileOnboardingCompletedAt } from "@/libs/database/queries/profiles";

export async function requireAuthenticatedUser() {
  const { user, error } = await getSessionUser();
  if (error || !user) {
    redirect("/login");
  }
  return user;
}

export async function requireOnboardingComplete(userId: string) {
  const completedAt = await getProfileOnboardingCompletedAt(userId);
  if (!completedAt) {
    redirect("/onboarding");
  }
}

export async function requireOnboardingIncomplete(userId: string) {
  const completedAt = await getProfileOnboardingCompletedAt(userId);
  if (completedAt) {
    redirect("/home");
  }
}
