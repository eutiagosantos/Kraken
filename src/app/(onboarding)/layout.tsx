import type { ReactNode } from "react";

import {
  requireAuthenticatedUser,
  requireOnboardingIncomplete,
} from "@/libs/auth/dashboard-guard";

export default async function OnboardingRouteLayout({ children }: { children: ReactNode }) {
  const user = await requireAuthenticatedUser();
  await requireOnboardingIncomplete(user.id);
  return children;
}
