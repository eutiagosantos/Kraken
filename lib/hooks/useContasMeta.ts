"use client";

import { useMemo } from "react";
import { mockContas } from "@/lib/mock-data/contas";

export function useContasMeta() {
  return useMemo(() => mockContas, []);
}
