const LEGACY_USD_TO_INR = 83;

const fmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const fmt2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export const toInrAmount = (amount: number) => {
  const value = Number(amount) || 0;
  if (value > 0 && value < 30) return Math.round(value * LEGACY_USD_TO_INR);
  return Math.round(value);
};

export const inr = (amount: number) => fmt.format(toInrAmount(amount));
export const inr2 = (amount: number) => fmt2.format(toInrAmount(amount));
