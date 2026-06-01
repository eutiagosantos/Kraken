import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseUrl } from "@/libs/database/env";
import * as schema from "@/models/schema";

declare global {
  // eslint-disable-next-line no-var
  var __krakenDbClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __krakenDb: PostgresJsDatabase<typeof schema> | undefined;
}

function createDbClient() {
  return postgres(getDatabaseUrl(), {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

function getDbInstance(): PostgresJsDatabase<typeof schema> {
  if (!globalThis.__krakenDb) {
    const client = globalThis.__krakenDbClient ?? createDbClient();
    if (process.env.NODE_ENV !== "production") {
      globalThis.__krakenDbClient = client;
    }
    globalThis.__krakenDb = drizzle(client, { schema });
  }
  return globalThis.__krakenDb;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDbInstance(), prop, receiver);
  },
});

export type DbClient = PostgresJsDatabase<typeof schema>;
