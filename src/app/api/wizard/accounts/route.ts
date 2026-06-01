import { NextResponse } from "next/server";

import type { MockAccount } from "@/libs/mock-data";
import { getSessionUser } from "@/libs/api/session";
import { rowToContaMeta } from "@/libs/contas-meta-map";
import { listMetaAdAccountsForUserByName } from "@/libs/database/queries/meta-ad-accounts";

export async function GET() {
  const { user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let data;
  try {
    data = await listMetaAdAccountsForUserByName(user.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "query_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const spendFmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

  const accounts: MockAccount[] = (data ?? []).map((row) => {
    const c = rowToContaMeta(row);
    const status: MockAccount["status"] = c.status === "ativa" ? "ativo" : "suspenso";
    return {
      id: c.accountId,
      name: c.name,
      nickname: c.nickname ?? null,
      status,
      spend: spendFmt.format(c.monthlySpend),
    };
  });

  return NextResponse.json({ data: accounts });
}
