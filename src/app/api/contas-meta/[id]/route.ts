import { NextResponse } from "next/server";
import { z } from "zod";

import { invalidateUserDataShortCache } from "@/lib/api/user-data-short-cache";
import { getSessionUser } from "@/lib/api/session";
import { rowToContaMeta } from "@/lib/contas-meta-map";
import { getMetaGraphAccessToken } from "@/lib/meta/graph-token";
import { invalidatePageCache } from "@/lib/meta/graph-user-pages";
import type { Database } from "@/lib/supabase/types";

type MetaAdAccountUpdate = Database["public"]["Tables"]["meta_ad_accounts"]["Update"];

const patchSchema = z.object({
  nickname: z.string().max(120).optional().nullable(),
  defaultBudget: z.number().optional().nullable(),
  defaultStructure: z.string().max(32).optional().nullable(),
  defaultAntiSpy: z.boolean().optional().nullable(),
  facebookPageId: z.string().max(64).optional().nullable(),
  facebookPageName: z.string().max(512).optional().nullable(),
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
  if (parsed.data.facebookPageId !== undefined) {
    const t = parsed.data.facebookPageId?.trim();
    updates.facebook_page_id = t && t.length > 0 ? t : null;
  }
  if (parsed.data.facebookPageName !== undefined) {
    const t = parsed.data.facebookPageName?.trim();
    updates.facebook_page_name = t && t.length > 0 ? t : null;
  }

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

  if (parsed.data.facebookPageId !== undefined || parsed.data.facebookPageName !== undefined) {
    invalidateUserDataShortCache(user.id);
  }

  return NextResponse.json({ data: rowToContaMeta(data) });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: deleted, error } = await supabase
    .from("meta_ad_accounts")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!deleted?.length) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  invalidateUserDataShortCache(user.id);
  const tokenRes = await getMetaGraphAccessToken(supabase, user.id);
  if ("accessToken" in tokenRes) {
    invalidatePageCache(tokenRes.accessToken);
  }

  return NextResponse.json({ ok: true });
}
