import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/api/session";
import { rowToContaMeta } from "@/lib/contas-meta-map";
import type { Database } from "@/lib/supabase/types";

type MetaAdAccountUpdate = Database["public"]["Tables"]["meta_ad_accounts"]["Update"];

const patchSchema = z.object({
  nickname: z.string().max(120).optional().nullable(),
  defaultBudget: z.number().optional().nullable(),
  defaultStructure: z.string().max(32).optional().nullable(),
  defaultAntiSpy: z.boolean().optional().nullable(),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("meta_ad_accounts")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ data: rowToContaMeta(data) });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const updates: MetaAdAccountUpdate = { updated_at: new Date().toISOString() };
  if (parsed.data.nickname !== undefined) updates.nickname = parsed.data.nickname;
  if (parsed.data.defaultBudget !== undefined) updates.default_budget = parsed.data.defaultBudget;
  if (parsed.data.defaultStructure !== undefined) updates.default_structure = parsed.data.defaultStructure;
  if (parsed.data.defaultAntiSpy !== undefined) updates.default_anti_spy = parsed.data.defaultAntiSpy;

  const { data, error } = await supabase
    .from("meta_ad_accounts")
    .update(updates)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ data: rowToContaMeta(data) });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase.from("meta_ad_accounts").delete().eq("id", params.id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
