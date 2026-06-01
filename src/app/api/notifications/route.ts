import { NextResponse } from "next/server";

import { getSessionUser } from "@/libs/api/session";
import { listActivityEventNotificationsByUserId } from "@/libs/database/queries/activity-events";
import { postgresErrorMessage } from "@/libs/database/postgres-error";

export async function GET() {
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const data = await listActivityEventNotificationsByUserId(user.id, 20);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: postgresErrorMessage(err) }, { status: 500 });
  }
}
