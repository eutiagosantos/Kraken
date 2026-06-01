import { NextResponse } from "next/server";
import { z } from "zod";

import { assertProtectedApiRoute } from "@/libs/api/route-protection";
import { listWorkspacesForUser, renameWorkspace } from "@/libs/database/queries/workspaces";
import type { MockWorkspace } from "@/libs/mock-data";
import { getSessionUser } from "@/libs/api/session";

const patchBodySchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
});

export async function GET() {
  try {
    const { user, error: userError } = await getSessionUser();
    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const rows = await listWorkspacesForUser(user.id);
    const workspacesOut: MockWorkspace[] = rows.map((ws) => ({
      id: ws.id,
      name: ws.name,
      plan: "Workspace",
      membersLabel: ws.memberCount === 1 ? "1 membro" : `${ws.memberCount} membros`,
    }));

    return NextResponse.json({ data: workspacesOut });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load workspaces.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const protection = await assertProtectedApiRoute();
  if (!protection.ok) return protection.response;
  const { user } = protection;

  const raw = await request.json().catch(() => ({}));
  const parsed = patchBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "workspaceId e name são obrigatórios." }, { status: 400 });
  }

  const { workspaceId, name } = parsed.data;

  try {
    const result = await renameWorkspace(user.id, workspaceId, name);
    if (!result.ok) {
      if (result.error === "not_found") {
        return NextResponse.json({ error: "Workspace não encontrado." }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Apenas o owner pode renomear o workspace." },
        { status: 403 }
      );
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update workspace.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
