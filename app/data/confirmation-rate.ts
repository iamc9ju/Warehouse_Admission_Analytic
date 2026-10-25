export function confirmationRate(confirmed: number, eligible?: number): number | null {
  return eligible !== undefined && eligible > 0 ? confirmed * 100 / eligible : null;
}

export function confirmationRateLabel(rate: number | null): string {
  return rate === null ? "ไม่มีฐานคำนวณ" : `${rate.toFixed(2)}%`;
}
