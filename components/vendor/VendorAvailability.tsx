"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorProfileDTO } from "@/types/vendor-profile";

type VendorAvailabilityProps = {
  dates: VendorProfileDTO["availability"]["dates"];
  isLoggedIn: boolean;
  loginHref: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfMonth(offset: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

function formatMonthLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildMonthDays(monthStart: Date) {
  const firstDay = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const cells: Array<{ iso: string | null; label: number | null }> = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ iso: null, label: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    cells.push({ iso: formatIsoDate(date), label: day });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ iso: null, label: null });
  }

  return cells;
}

export default function VendorAvailability({
  dates,
  isLoggedIn,
  loginHref,
}: VendorAvailabilityProps) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorPublic.availability;
  const [monthOffset, setMonthOffset] = useState(0);

  const months = useMemo(
    () => [0, 1, 2].map((offset) => startOfMonth(monthOffset + offset)),
    [monthOffset]
  );
  const statusMap = useMemo(
    () => new Map(dates.map((entry) => [entry.date, entry.status])),
    [dates]
  );
  const sliderStartLabel = formatMonthLabel(startOfMonth(monthOffset), language);
  const sliderEndLabel = formatMonthLabel(startOfMonth(monthOffset + 2), language);

  if (!isLoggedIn) {
    return (
      <div>
        <h2 className="h3 mb-3">{labels.heading}</h2>
        <div className="alert alert-light border mb-0" role="status">
          <p className="mb-3">{labels.loginRequired}</p>
          <Link href={loginHref} className="btn btn-outline-primary">
            {labels.logInAction}
          </Link>
        </div>
      </div>
    );
  }

  const hasDates = dates.length > 0;

  return (
    <div>
      <h2 className="h3 mb-3">{labels.heading}</h2>
      {hasDates ? (
        <>
          <div className="wm-availability-legend mb-3">
            <span className="wm-availability-legend__item">
              <span className="wm-availability-legend__swatch wm-availability-legend__swatch--available" />
              {labels.availableLegend}
            </span>
            <span className="wm-availability-legend__item">
              <span className="wm-availability-legend__swatch wm-availability-legend__swatch--busy" />
              {labels.busyLegend}
            </span>
          </div>
          <div className="wm-availability-slider mb-4">
            <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
              <label className="form-label mb-0" htmlFor="vendor-availability-month-slider">
                {labels.monthSliderLabel}
              </label>
              <span className="text-muted small">
                {sliderStartLabel} - {sliderEndLabel}
              </span>
            </div>
            <input
              id="vendor-availability-month-slider"
              type="range"
              className="form-range"
              min={0}
              max={21}
              step={1}
              value={monthOffset}
              onChange={(event) => setMonthOffset(Number(event.target.value))}
            />
            <div className="form-text">{labels.monthSliderHelp}</div>
          </div>
          <div className="wm-availability-months">
            {months.map((monthStart) => {
              const monthLabel = formatMonthLabel(monthStart, language);
              const cells = buildMonthDays(monthStart);

              return (
                <section key={monthLabel} className="wm-availability-card">
                  <div className="wm-availability-card__header">{monthLabel}</div>
                  <div className="wm-availability-grid wm-availability-grid--weekdays">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                      <div key={label} className="wm-availability-grid__weekday">
                        {label}
                      </div>
                    ))}
                  </div>
                  <div className="wm-availability-grid">
                    {cells.map((cell, index) => {
                      if (!cell.iso || !cell.label) {
                        return <div key={`${monthLabel}-empty-${index}`} className="wm-availability-day wm-availability-day--empty" />;
                      }

                      const status = statusMap.get(cell.iso) ?? null;
                      const tone =
                        status === "available"
                          ? "wm-availability-day--available"
                          : "wm-availability-day--busy";

                      return (
                        <div key={cell.iso} className={`wm-availability-day wm-availability-day--readonly ${tone}`} title={cell.iso}>
                          <span className="wm-availability-day__number">{cell.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      ) : (
        <div className="alert alert-info mb-3" role="status">
          {labels.empty}
        </div>
      )}
    </div>
  );
}
