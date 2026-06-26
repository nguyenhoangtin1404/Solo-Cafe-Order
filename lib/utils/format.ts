const VND_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export function formatCurrency(amount: number): string {
  return VND_FORMATTER.format(amount);
}
