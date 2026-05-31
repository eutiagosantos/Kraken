import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api/session";
import type { Json } from "@/lib/supabase/types";
import type { Publico } from "@/lib/stores/wizardStore";

function isPublico(raw: unknown): raw is Publico {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.name === "string" && typeof o.type === "string";
}

export async function GET() {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_publicos")
    .select("payload")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (data ?? []).map((row) => row.payload).filter(isPublico);

  return NextResponse.json({ data: list });
}

export async function POST(request: Request) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  if (!isPublico(raw)) {
    return NextResponse.json({ error: "Invalid público payload." }, { status: 400 });
  }

  const publico: Publico = { ...raw, type: "saved" };

  const { error } = await supabase.from("saved_publicos").insert({
    user_id: user.id,
    payload: publico as unknown as Json,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: publico }, { status: 201 });
}
