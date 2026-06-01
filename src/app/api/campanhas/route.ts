import { NextResponse } from "next/server";
import { z } from "zod";

import { campanhaToInsert, rowToCampanha } from "@/libs/campanhas-map";
import { getSessionUser } from "@/libs/api/session";
import {
  insertCampanha,
  listCampanhasByUserId,
} from "@/libs/database/queries/campanhas";
import { postgresErrorMessage } from "@/libs/database/postgres-error";

const structureEnum = z.union([
  z.enum(["1-50-1", "1-250-1", "1-3-5", "1-1-5"]),
  z.string().regex(/^custom:\d+-\d+-\d+$/),
]);
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
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const data = await listCampanhasByUserId(user.id);
    return NextResponse.json({ data: data.map(rowToCampanha) });
  } catch (err) {
    return NextResponse.json({ error: postgresErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user } = await getSessionUser();
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

  try {
    const data = await insertCampanha({
      user_id: row.user_id,
      workspace_id: row.workspace_id ?? null,
      name: row.name,
      account_name: row.account_name,
      account_meta_id: row.account_meta_id,
      structure: row.structure,
      objective: row.objective,
      daily_budget: row.daily_budget ?? 0,
      anti_spy: row.anti_spy ?? false,
      status: row.status ?? "rascunho",
      ads_created: row.ads_created ?? 0,
      ads_total: row.ads_total ?? 0,
      trend: row.trend ?? [],
      creatives: row.creatives ?? [],
      errors: row.errors ?? null,
      meta_ids: row.meta_ids ?? null,
    });
    return NextResponse.json({ data: rowToCampanha(data) }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: postgresErrorMessage(err) }, { status: 500 });
  }
}
