export const safeTryNumber = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};
