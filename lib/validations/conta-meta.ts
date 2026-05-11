export interface ContaMetaPayload {
  accountId: string;
  name: string;
}

export function isValidContaMetaPayload(payload: unknown): payload is ContaMetaPayload {
  if (!payload || typeof payload !== "object") return false;
  const value = payload as Partial<ContaMetaPayload>;
  return Boolean(value.accountId && value.name);
}
