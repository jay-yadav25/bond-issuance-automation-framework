export function isBusinessDay(date: string): boolean {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6;
}

export function nextBusinessDay(date: string): string {
  const result = new Date(`${date}T00:00:00Z`);
  do result.setUTCDate(result.getUTCDate() + 1); while (!isBusinessDay(result.toISOString().slice(0, 10)));
  return result.toISOString().slice(0, 10);
}
