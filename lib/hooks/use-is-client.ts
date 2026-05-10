"use client";

import { useEffect, useState } from "react";

/** True after mount; avoids Recharts ResponsiveContainer measuring during SSG. */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}
