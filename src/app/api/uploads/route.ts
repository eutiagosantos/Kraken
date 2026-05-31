import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true, uploadId: "stub-upload-id" }, { status: 202 });
}
