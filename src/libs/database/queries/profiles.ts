import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/libs/database";
import { profiles, workspaceMembers, workspaces } from "@/models/schema";

export type ProfileRow = typeof profiles.$inferSelect;

export async function getProfileFullName(userId: string): Promise<string | null> {
  const rows = await db
    .select({ full_name: profiles.full_name })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return rows[0]?.full_name ?? null;
}

export async function getProfileOnboardingCompletedAt(userId: string): Promise<string | null> {
  const rows = await db
    .select({ onboarding_completed_at: profiles.onboarding_completed_at })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return rows[0]?.onboarding_completed_at ?? null;
}

export async function getProfileByClerkId(clerkId: string): Promise<ProfileRow | null> {
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerk_id, clerkId))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateProfileOnboardingCompleted(userId: string, at: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(profiles)
    .set({ onboarding_completed_at: at, updated_at: now })
    .where(eq(profiles.id, userId));
}

export async function updateProfileFullName(
  userId: string,
  fullName: string
): Promise<{ full_name: string | null } | null> {
  const now = new Date().toISOString();
  const rows = await db
    .update(profiles)
    .set({ full_name: fullName, updated_at: now })
    .where(eq(profiles.id, userId))
    .returning({ full_name: profiles.full_name });
  return rows[0] ?? null;
}

export async function linkProfileClerkId(userId: string, clerkId: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(profiles)
    .set({ clerk_id: clerkId, updated_at: now })
    .where(eq(profiles.id, userId));
}

/** Creates profile + default workspace for a new Clerk user (mirrors handle_new_user trigger). */
export async function bootstrapProfileForClerkUser(params: {
  clerkId: string;
  fullName: string | null;
  avatarUrl?: string | null;
}): Promise<ProfileRow> {
  const now = new Date().toISOString();
  const profileId = crypto.randomUUID();

  const [profile] = await db
    .insert(profiles)
    .values({
      id: profileId,
      clerk_id: params.clerkId,
      full_name: params.fullName,
      avatar_url: params.avatarUrl ?? null,
      created_at: now,
      updated_at: now,
    })
    .returning();

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: "Meu workspace",
      created_by: profileId,
      created_at: now,
    })
    .returning({ id: workspaces.id });

  if (workspace) {
    await db.insert(workspaceMembers).values({
      workspace_id: workspace.id,
      user_id: profileId,
      role: "owner",
      created_at: now,
    });
  }

  return profile;
}

export async function ensureProfileForClerkUser(params: {
  clerkId: string;
  fullName: string | null;
  avatarUrl?: string | null;
}): Promise<ProfileRow> {
  const existing = await getProfileByClerkId(params.clerkId);
  if (existing) return existing;
  return bootstrapProfileForClerkUser(params);
}
