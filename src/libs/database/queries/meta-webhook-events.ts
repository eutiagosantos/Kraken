import "server-only";

import { db } from "@/libs/database";
import type { Json } from "@/models/schema";
import { metaWebhookEvents } from "@/models/schema";

export async function insertMetaWebhookEvent(input: {
  topic: string | null;
  payload: Json;
  signatureValid: boolean;
  receivedAt: string;
}): Promise<void> {
  await db.insert(metaWebhookEvents).values({
    topic: input.topic,
    payload: input.payload,
    signature_valid: input.signatureValid,
    received_at: input.receivedAt,
  });
}
