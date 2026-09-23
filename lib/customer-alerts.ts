function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysInMonthUTC(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

// Adds `monthOffset` calendar months to (year, monthIndex, day), clamping the
// day to the target month's real length instead of letting Date.UTC overflow
// into the following month (e.g. Jan 31 + 1 month must land on Feb 28/29, not
// March 3).
function addMonthsClamped(year: number, monthIndex: number, day: number, monthOffset: number): Date {
  const totalMonths = year * 12 + monthIndex + monthOffset;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonthIndex = ((totalMonths % 12) + 12) % 12;
  const clampedDay = Math.min(day, daysInMonthUTC(targetYear, targetMonthIndex));
  return new Date(Date.UTC(targetYear, targetMonthIndex, clampedDay));
}

export function isInUpgradeWindow(
  lastSaleDate: string | null,
  upgradeAlertMonths: number,
  now: Date = new Date()
): boolean {
  if (!lastSaleDate) return false;
  const last = new Date(lastSaleDate);
  const threshold = addMonthsClamped(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate(), upgradeAlertMonths);
  return startOfDayUTC(now) >= threshold;
}

export function nextBirthday(birthdate: string, now: Date = new Date()): Date {
  const birth = new Date(birthdate);
  const today = startOfDayUTC(now);
  const candidateForYear = (year: number) => {
    const day = Math.min(birth.getUTCDate(), daysInMonthUTC(year, birth.getUTCMonth()));
    return new Date(Date.UTC(year, birth.getUTCMonth(), day));
  };
  let next = candidateForYear(today.getUTCFullYear());
  if (next < today) {
    next = candidateForYear(today.getUTCFullYear() + 1);
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
