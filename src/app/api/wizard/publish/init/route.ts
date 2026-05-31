import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api/session";
import { checkInFlightUploadJob, PUBLISH_INIT_CONFLICT_PT } from "@/lib/wizard/upload-jobs-in-flight";

/** Cria um registo `upload_jobs` e devolve o UUID usado como pasta de Storage: `{userId}/{operationId}/…`. */
export async function POST() {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const inFlight = await checkInFlightUploadJob(supabase, user.id);
  if (!inFlight.ok) {
    return NextResponse.json(
      { error: inFlight.message || "Não foi possível verificar envios em curso." },
      { status: 500 }
    );
  }
  if (inFlight.blockingId) {
    return NextResponse.json({ error: PUBLISH_INIT_CONFLICT_PT }, { status: 409 });
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
