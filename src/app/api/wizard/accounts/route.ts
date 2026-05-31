import { NextResponse } from "next/server";

import type { MockAccount } from "@/lib/mock-data";
import { getSessionUser } from "@/lib/api/session";
import { rowToContaMeta } from "@/lib/contas-meta-map";

export async function GET() {
  const { supabase, user } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("meta_ad_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
