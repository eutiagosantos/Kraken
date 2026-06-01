const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBrl(amount: number): string {
  return brlFormatter.format(amount);
}
