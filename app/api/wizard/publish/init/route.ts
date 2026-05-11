import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api/session";

/** Cria um registo `upload_jobs` e devolve o UUID usado como pasta de Storage: `{userId}/{operationId}/…`. */
export async function POST() {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("upload_jobs")
    .insert({
      user_id: user.id,
      account_name: "—",
      total: 0,
      done: 0,
      status: "awaiting_creatives",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Falha ao criar operação." }, { status: 500 });
  }

  return NextResponse.json({ data: { operationId: data.id } });
}
