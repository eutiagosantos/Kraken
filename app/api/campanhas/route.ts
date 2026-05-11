import { NextResponse } from "next/server";
import { z } from "zod";

import { campanhaToInsert, rowToCampanha } from "@/lib/campanhas-map";
import { getSessionUser } from "@/lib/api/session";

const structureEnum = z.enum(["1-50-1", "1-3-5", "1-1-5"]);
const statusEnum = z.enum(["ativa", "processando", "concluida", "pausada", "erro"]);

const creativeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["image", "video"]),
  thumb: z.string(),
});

const campanhaCreateSchema = z.object({
  name: z.string().min(1),
  account: z.string().min(1),
  accountId: z.string().min(1),
  structure: structureEnum,
  objective: z.string().min(1),
  dailyBudget: z.number().nonnegative(),
  antiSpy: z.boolean(),
  status: statusEnum,
  adsCreated: z.number().int().nonnegative(),
  adsTotal: z.number().int().nonnegative(),
  trend: z.array(z.number()).default([]),
  creatives: z.array(creativeSchema).default([]),
  errors: z.array(z.object({ id: z.string(), message: z.string(), adName: z.string() })).optional(),
  workspaceId: z.string().uuid().optional().nullable(),
});

export async function GET() {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("campanhas")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(rowToCampanha) });
}

export async function POST(request: Request) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = campanhaCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const row = campanhaToInsert(user.id, {
    ...parsed.data,
    workspaceId: parsed.data.workspaceId,
  });

  const { data, error } = await supabase.from("campanhas").insert(row).select("*").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: rowToCampanha(data) }, { status: 201 });
}
