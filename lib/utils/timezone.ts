// Vietnam does not observe DST; UTC+7 is permanent.
// If the timezone ever changes, replace this arithmetic with Intl.DateTimeFormat.
const HCM_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const HCM_TZ = "Asia/Ho_Chi_Minh";

function getIntlPart(parts: Intl.DateTimeFormatPart[], type: string): string {
  const part = parts.find((p) => p.type === type);
  if (!part) throw new Error(`Intl part "${type}" missing for HCM date`);
  return part.value;
}

function hcmYMD(date: Date): { y: string; m: string; d: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: HCM_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return {
    y: getIntlPart(parts, "year"),
    m: getIntlPart(parts, "month"),
    d: getIntlPart(parts, "day"),
  };
}

/** Midnight of the HCM calendar day containing `date`. */
export function startOfDayHCM(date: Date): Date {
  const { y, m, d } = hcmYMD(date);
  return new Date(`${y}-${m}-${d}T00:00:00+07:00`);
}

/** 23:59:59.999 of the HCM calendar day containing `date`. */
export function endOfDayHCM(date: Date): Date {
  return new Date(startOfDayHCM(date).getTime() + DAY_MS - 1);
}

/** Adds N calendar days. Safe because Vietnam (UTC+7) has no DST. */
export function addDaysHCM(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Midnight of the first day of the HCM month containing `date`. */
export function startOfMonthHCM(date: Date): Date {
  const { y, m } = hcmYMD(date);
  return new Date(`${y}-${m}-01T00:00:00+07:00`);
}

/** Midnight of the first day of the previous HCM month. */
export function startOfPrevMonthHCM(date: Date): Date {
  return startOfMonthHCM(new Date(startOfMonthHCM(date).getTime() - 1));
}

/** 23:59:59.999 of the last day of the previous HCM month. */
export function endOfPrevMonthHCM(date: Date): Date {
  return new Date(startOfMonthHCM(date).getTime() - 1);
}

/** YYYY-MM-DD string in HCM timezone (suitable for input[type=date] value). */
export function toInputDateHCM(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: HCM_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Current hour in Asia/Ho_Chi_Minh (0–23). */
export function getHCMHour(): number {
  const hcmNow = Date.now() + HCM_OFFSET_MS;
  return Math.floor((hcmNow % DAY_MS) / (60 * 60 * 1000));
}

/** UTC ISO bounds of "today" in Asia/Ho_Chi_Minh (UTC+7). */
export function getTodayHCMBounds(): { start: string; end: string } {
  const hcmNow = Date.now() + HCM_OFFSET_MS;
  const hcmMidnight = hcmNow - (hcmNow % DAY_MS);
  return {
    start: new Date(hcmMidnight - HCM_OFFSET_MS).toISOString(),
    end: new Date(hcmMidnight + DAY_MS - HCM_OFFSET_MS).toISOString(),
  };
}

/** UTC ISO bounds of the previous HCM calendar day (for midnight-cross lookups). */
export function getPreviousDayHCMBounds(): { start: string; end: string } {
  const { start: todayStart } = getTodayHCMBounds();
  const todayStartMs = new Date(todayStart).getTime();
  return {
    start: new Date(todayStartMs - DAY_MS).toISOString(),
    end: todayStart,
  };
}
