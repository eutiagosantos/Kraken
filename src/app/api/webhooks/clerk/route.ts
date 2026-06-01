import { NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { bootstrapProfileForClerkUser, getProfileByClerkId } from "@/libs/database/queries/profiles";

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not configured." }, { status: 500 });
  }

  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: WebhookEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, headers) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type === "user.created") {
    const clerkId = event.data.id;
    const existing = await getProfileByClerkId(clerkId);
    if (!existing) {
      const fullName =
        [event.data.first_name, event.data.last_name].filter(Boolean).join(" ").trim() ||
        event.data.email_addresses[0]?.email_address?.split("@")[0] ||
        null;
      await bootstrapProfileForClerkUser({
        clerkId,
        fullName,
        avatarUrl: event.data.image_url ?? null,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
