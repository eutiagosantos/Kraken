import { NextResponse } from "next/server";

import { getSessionUser } from "@/libs/api/session";
import { postgresErrorMessage } from "@/libs/database/postgres-error";
import {
  insertSavedPublico,
  listSavedPublicoPayloadsByUserId,
} from "@/libs/database/queries/saved-publicos";
import type { Json } from "@/models/schema";
import type { Publico } from "@/libs/stores/wizardStore";

function isPublico(raw: unknown): raw is Publico {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.name === "string" && typeof o.type === "string";
}

export async function GET() {
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payloads = await listSavedPublicoPayloadsByUserId(user.id, 50);
    const list = payloads.filter(isPublico);
    return NextResponse.json({ data: list });
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
  if (!isPublico(raw)) {
    return NextResponse.json({ error: "Invalid público payload." }, { status: 400 });
  }

  const publico: Publico = { ...raw, type: "saved" };

  try {
    await insertSavedPublico(user.id, publico as unknown as Json);
    return NextResponse.json({ data: publico }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: postgresErrorMessage(err) }, { status: 500 });
  }
}
