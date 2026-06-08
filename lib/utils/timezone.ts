const HCM_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

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
