function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function isInUpgradeWindow(
  lastSaleDate: string | null,
  upgradeAlertMonths: number,
  now: Date = new Date()
): boolean {
  if (!lastSaleDate) return false;
  const last = new Date(lastSaleDate);
  const threshold = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + upgradeAlertMonths, last.getUTCDate()));
  return startOfDayUTC(now) >= threshold;
}

export function nextBirthday(birthdate: string, now: Date = new Date()): Date {
  const birth = new Date(birthdate);
  const today = startOfDayUTC(now);
  let next = new Date(Date.UTC(today.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()));
  if (next < today) {
    next = new Date(Date.UTC(today.getUTCFullYear() + 1, birth.getUTCMonth(), birth.getUTCDate()));
  }
  return next;
}

export function isBirthdayWithinDays(birthdate: string | null, days: number, now: Date = new Date()): boolean {
  if (!birthdate) return false;
  const today = startOfDayUTC(now);
  const next = nextBirthday(birthdate, now);
  const diffDays = Math.round((next.getTime() - today.getTime()) / 86400000);
  return diffDays >= 0 && diffDays <= days;
}

export function daysInStock(purchaseDate: string, now: Date = new Date()): number {
  const purchase = startOfDayUTC(new Date(purchaseDate));
  const today = startOfDayUTC(now);
  return Math.max(0, Math.round((today.getTime() - purchase.getTime()) / 86400000));
}
