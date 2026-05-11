import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/api/session";

const bodySchema = z.object({
  accountLabel: z.string().min(1).optional(),
  total: z.number().int().nonnegative(),
  done: z.number().int().nonnegative(),
});

export async function POST(request: Request) {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const accountName = parsed.data.accountLabel ?? "Conta";

  const { data, error } = await supabase
    .from("upload_jobs")
    .insert({
      user_id: user.id,
      account_name: accountName,
      total: parsed.data.total,
      done: parsed.data.done,
      status: "processing",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ publishId: data.id });
}
