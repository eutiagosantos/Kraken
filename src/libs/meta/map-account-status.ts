export function mapAccountStatus(status?: number): "ativa" | "suspensa" | "desconectada" {
  if (status === 1) return "ativa";
  if (status === 2 || status === 3) return "suspensa";
  return "desconectada";
}
