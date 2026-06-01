import type { ReactNode } from "react";

import { DashboardShell } from "@/components/app/DashboardShell";
import {
  requireAuthenticatedUser,
  requireOnboardingComplete,
} from "@/libs/auth/dashboard-guard";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAuthenticatedUser();
  await requireOnboardingComplete(user.id);
  return <DashboardShell>{children}</DashboardShell>;
}
