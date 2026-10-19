import { formatCalendarDate } from "../src/lib/calendarDate";

describe("date-only wedding dates", () => {
  test("shows the requested calendar day in the phone's locale", () => {
    expect(formatCalendarDate("2026-10-19", "en-US")).toBe("10/19/2026");
    expect(formatCalendarDate("2024-02-29", "en-US")).toBe("2/29/2024");
  });
  test.each(["0000-01-01", "2026-02-29", "2026-04-31", "invalid", "2026-10-19T12:00:00Z"])("rejects invalid date-only value %s", (value) => {
    expect(formatCalendarDate(value, "en-US")).toBeNull();
  });
});
