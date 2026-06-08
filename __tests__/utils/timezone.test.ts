import {
  getPreviousDayHCMBounds,
  getTodayHCMBounds,
} from "@/lib/utils/timezone";

describe("timezone", () => {
  it("getPreviousDayHCMBounds nối liền trước getTodayHCMBounds", () => {
    const today = getTodayHCMBounds();
    const yesterday = getPreviousDayHCMBounds();

    expect(yesterday.end).toBe(today.start);
    expect(
      new Date(today.start).getTime() - new Date(yesterday.start).getTime()
    ).toBe(24 * 60 * 60 * 1000);
  });
});
