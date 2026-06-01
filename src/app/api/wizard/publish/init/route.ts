import { NextResponse } from "next/server";

import { getSessionUser } from "@/libs/api/session";
import { createAwaitingCreativesUploadJob } from "@/libs/database/queries/upload-jobs";
import { checkInFlightUploadJob } from "@/libs/wizard/upload-jobs-in-flight.server";
import { PUBLISH_INIT_CONFLICT_PT } from "@/libs/wizard/upload-jobs-constants";

/** Cria um registo `upload_jobs` e devolve o UUID usado como pasta de Storage: `{userId}/{operationId}/…`. */
export async function POST() {
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const inFlight = await checkInFlightUploadJob(user.id);
  if (!inFlight.ok) {
    return NextResponse.json(
      { error: inFlight.message || "Não foi possível verificar envios em curso." },
      { status: 500 }
    );
  }
  if (inFlight.blockingId) {
    return NextResponse.json({ error: PUBLISH_INIT_CONFLICT_PT }, { status: 409 });
  }

  try {
    const row = await createAwaitingCreativesUploadJob(user.id, "—");
    if (!row) {
      return NextResponse.json({ error: "Falha ao criar operação." }, { status: 500 });
    }
    return NextResponse.json({ data: { operationId: row.id } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha ao criar operação.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
