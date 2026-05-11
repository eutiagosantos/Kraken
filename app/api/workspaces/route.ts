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

    const { data: memberRows, error: memberRowsErr } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .in("workspace_id", ids);

    if (memberRowsErr) {
      return NextResponse.json({ error: memberRowsErr.message }, { status: 500 });
    }

    const countsByWorkspace = new Map<string, number>();
    for (const row of memberRows ?? []) {
      countsByWorkspace.set(row.workspace_id, (countsByWorkspace.get(row.workspace_id) ?? 0) + 1);
    }

    const workspacesOut: MockWorkspace[] = [];
    for (const ws of workspaces ?? []) {
      const n = countsByWorkspace.get(ws.id) ?? 0;
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
