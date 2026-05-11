export interface LoginInput {
  email: string;
  password: string;
}

export function isValidLoginInput(payload: unknown): payload is LoginInput {
  if (!payload || typeof payload !== "object") return false;
  const value = payload as Partial<LoginInput>;
  return Boolean(value.email && value.password);
}
