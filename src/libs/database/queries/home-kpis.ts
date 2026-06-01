import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/libs/database";
import { homeKpis } from "@/models/schema";

export type HomeKpiRow = typeof homeKpis.$inferSelect;

export async function listHomeKpisByUserId(userId: string): Promise<HomeKpiRow[]> {
  return db
    .select()
    .from(homeKpis)
    .where(eq(homeKpis.user_id, userId))
    .orderBy(asc(homeKpis.label));
}
