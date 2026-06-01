import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/libs/database";
import { workspaceMembers, workspaces } from "@/models/schema";

export type WorkspaceListItem = {
  id: string;
  name: string;
  memberCount: number;
};

export async function listWorkspacesForUser(userId: string): Promise<WorkspaceListItem[]> {
  const memberships = await db
    .select({ workspace_id: workspaceMembers.workspace_id })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.user_id, userId));

  const ids = Array.from(new Set(memberships.map((m) => m.workspace_id)));
  if (ids.length === 0) return [];

  const wsRows = await db
    .select({ id: workspaces.id, name: workspaces.name })
    .from(workspaces)
    .where(inArray(workspaces.id, ids));

  const memberRows = await db
    .select({ workspace_id: workspaceMembers.workspace_id })
    .from(workspaceMembers)
    .where(inArray(workspaceMembers.workspace_id, ids));

  const countsByWorkspace = new Map<string, number>();
  for (const row of memberRows) {
    countsByWorkspace.set(row.workspace_id, (countsByWorkspace.get(row.workspace_id) ?? 0) + 1);
  }

  return wsRows.map((ws) => ({
    id: ws.id,
    name: ws.name,
    memberCount: countsByWorkspace.get(ws.id) ?? 0,
  }));
}

export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string
): Promise<{ role: string } | null> {
  const rows = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspace_id, workspaceId), eq(workspaceMembers.user_id, userId))
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function renameWorkspace(
  userId: string,
  workspaceId: string,
  name: string
): Promise<
  | { ok: true; data: { id: string; name: string } }
  | { ok: false; error: "not_found" | "forbidden" }
> {
  const membership = await getWorkspaceMembership(userId, workspaceId);
  if (!membership) return { ok: false, error: "not_found" };
  if (membership.role !== "owner") return { ok: false, error: "forbidden" };

  const rows = await db
    .update(workspaces)
    .set({ name })
    .where(eq(workspaces.id, workspaceId))
    .returning({ id: workspaces.id, name: workspaces.name });

  const updated = rows[0];
  if (!updated) return { ok: false, error: "not_found" };
  return { ok: true, data: updated };
}

export type WorkspaceWithRole = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  role: string;
};

export async function listWorkspacesWithRoleForUser(userId: string): Promise<WorkspaceWithRole[]> {
  const memberships = await db
    .select({
      workspace_id: workspaceMembers.workspace_id,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.user_id, userId));

  const ids = Array.from(new Set(memberships.map((m) => m.workspace_id)));
  if (ids.length === 0) return [];

  const wsRows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      created_by: workspaces.created_by,
      created_at: workspaces.created_at,
    })
    .from(workspaces)
    .where(inArray(workspaces.id, ids));

  const roleByWorkspace = new Map(memberships.map((m) => [m.workspace_id, m.role]));
  return wsRows.map((ws) => ({
    ...ws,
    role: roleByWorkspace.get(ws.id) ?? "member",
  }));
}

export async function getFirstWorkspaceByCreator(
  userId: string
): Promise<{ id: string } | null> {
  const rows = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.created_by, userId))
    .orderBy(asc(workspaces.created_at))
    .limit(1);
  return rows[0] ?? null;
}
