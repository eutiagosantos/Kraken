"use client";

import { useMemo } from "react";
import { mockCampanhas } from "@/lib/mock-data/campanhas";

export function useCampanhas() {
  return useMemo(() => mockCampanhas, []);
}
