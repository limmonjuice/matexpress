const whole = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});
const cents = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₱1,150 for whole pesos, ₱16.50 when there are centavos. */
export function formatPeso(value: number) {
  return Number.isInteger(value) ? whole.format(value) : cents.format(value);
}

/** How much cheaper `price` is than `listPrice`, as a whole percentage. */
export function discountPercent(listPrice: number, price: number) {
  if (listPrice <= 0 || price >= listPrice) return 0;
  return Math.round(((listPrice - price) / listPrice) * 100);
}

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
