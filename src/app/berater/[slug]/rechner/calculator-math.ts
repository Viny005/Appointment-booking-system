export function nonNegativeNumber(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function budgetBalance(income: number, fixed: number, variable: number) {
  return income - fixed - variable;
}

function monthlyRate(annualPercent: number) {
  return Math.pow(1 + annualPercent / 100, 1 / 12) - 1;
}

export function futureValue(initial: number, monthly: number, annualPercent: number, years: number) {
  const n = Math.max(0, Math.round(years * 12));
  const r = monthlyRate(annualPercent);
  if (!n) return initial;
  return initial * Math.pow(1 + r, n) + (r === 0 ? monthly * n : monthly * (Math.pow(1 + r, n) - 1) / r);
}

export function monthlyForGoal(target: number, initial: number, annualPercent: number, years: number) {
  const n = Math.max(1, Math.round(years * 12));
  const r = monthlyRate(annualPercent);
  const grownInitial = initial * Math.pow(1 + r, n);
  const missing = Math.max(0, target - grownInitial);
  if (r === 0) return missing / n;
  return missing * r / (Math.pow(1 + r, n) - 1);
}

export function reserveTarget(essentialMonthlyExpenses: number, months: number) {
  return essentialMonthlyExpenses * months;
}
