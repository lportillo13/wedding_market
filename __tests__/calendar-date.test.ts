import assert from "node:assert/strict";
import test from "node:test";
import { formatCalendarDate, parseCalendarDate } from "@/shared/calendar/date";

test("wedding dates remain the selected day across viewer time zones", () => {
  for (const timeZone of ["America/Costa_Rica", "America/Los_Angeles", "Pacific/Kiritimati"]) {
    assert.equal(formatCalendarDate("2026-10-19", "en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }), "10/19/2026");
  }
  assert.match(formatCalendarDate("2026-10-19", "es-CR") ?? "", /19/);
});

test("invalid calendar days are rejected instead of rolling into a different month or crashing", () => {
  for (const value of [null, "", "0000-01-01", "2026-02-29", "2026-04-31", "2026-13-01", "2026-10-19T12:00:00Z"]) {
    assert.equal(parseCalendarDate(value), null);
    assert.equal(formatCalendarDate(value, "en-US"), null);
  }
  assert.ok(parseCalendarDate("2024-02-29"));
});
