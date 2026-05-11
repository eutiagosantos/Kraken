import { NextResponse } from "next/server";
import { z } from "zod";

import { rowToCampanha } from "@/lib/campanhas-map";
import { getSessionUser } from "@/lib/api/session";
import type { Database } from "@/lib/supabase/types";

type CampanhaUpdate = Database["public"]["Tables"]["campanhas"]["Update"];

const patchSchema = z
  .object({
    name: z.string().min(1).optional(),
    account: z.string().min(1).optional(),
    accountId: z.string().min(1).optional(),
    structure: z.enum(["1-50-1", "1-3-5", "1-1-5"]).optional(),
    objective: z.string().min(1).optional(),
    dailyBudget: z.number().nonnegative().optional(),
    antiSpy: z.boolean().optional(),
    status: z.enum(["ativa", "processando", "concluida", "pausada", "erro"]).optional(),
    adsCreated: z.number().int().nonnegative().optional(),
    adsTotal: z.number().int().nonnegative().optional(),
    trend: z.array(z.number()).optional(),
    creatives: z
      .array(z.object({ id: z.string(), name: z.string(), type: z.enum(["image", "video"]), thumb: z.string() }))
      .optional(),
    errors: z.array(z.object({ id: z.string(), message: z.string(), adName: z.string() })).optional().nullable(),
  })
  .strict();

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("campanhas")
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

  return NextResponse.json({ data: rowToCampanha(data) });
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

  const p = parsed.data;
  const updates: CampanhaUpdate = {};
  if (p.name !== undefined) updates.name = p.name;
  if (p.account !== undefined) updates.account_name = p.account;
  if (p.accountId !== undefined) updates.account_meta_id = p.accountId;
  if (p.structure !== undefined) updates.structure = p.structure;
  if (p.objective !== undefined) updates.objective = p.objective;
  if (p.dailyBudget !== undefined) updates.daily_budget = p.dailyBudget;
  if (p.antiSpy !== undefined) updates.anti_spy = p.antiSpy;
  if (p.status !== undefined) updates.status = p.status;
  if (p.adsCreated !== undefined) updates.ads_created = p.adsCreated;
  if (p.adsTotal !== undefined) updates.ads_total = p.adsTotal;
  if (p.trend !== undefined) updates.trend = p.trend;
  if (p.creatives !== undefined) updates.creatives = p.creatives;
  if (p.errors !== undefined) updates.errors = p.errors;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("campanhas")
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

  return NextResponse.json({ data: rowToCampanha(data) });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase.from("campanhas").delete().eq("id", params.id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
