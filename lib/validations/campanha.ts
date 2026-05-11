export interface CampanhaPayload {
  name: string;
}

export function isValidCampanhaPayload(payload: unknown): payload is CampanhaPayload {
  if (!payload || typeof payload !== "object") return false;
  const value = payload as Partial<CampanhaPayload>;
  return Boolean(value.name);
}
