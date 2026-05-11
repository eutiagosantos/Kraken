import { NextResponse } from "next/server";

import type { MockWorkspace } from "@/lib/mock-data";
import { getSessionUser } from "@/lib/api/session";

export async function GET() {
  try {
    const { supabase, user, error: userError } = await getSessionUser();
    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: memberships, error: memErr } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);

    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }

    const ids = Array.from(new Set((memberships ?? []).map((m) => m.workspace_id)));
    if (ids.length === 0) {
      return NextResponse.json({ data: [] as MockWorkspace[] });
    }

    const { data: workspaces, error: wsErr } = await supabase
      .from("workspaces")
      .select("id, name")
      .in("id", ids);

    if (wsErr) {
      return NextResponse.json({ error: wsErr.message }, { status: 500 });
    }

    const workspacesOut: MockWorkspace[] = [];

    for (const ws of workspaces ?? []) {
      const { count, error: countErr } = await supabase
        .from("workspace_members")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", ws.id);

      if (countErr) {
        return NextResponse.json({ error: countErr.message }, { status: 500 });
      }

      const n = count ?? 0;
      workspacesOut.push({
        id: ws.id,
        name: ws.name,
        plan: "Workspace",
        membersLabel: n === 1 ? "1 membro" : `${n} membros`,
      });
    }

    return NextResponse.json({ data: workspacesOut });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load workspaces.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
