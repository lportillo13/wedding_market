"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { saveAvailability, type FormMessageState } from "./actions";

type AvailabilityEntry = {
  date: string;
  status: "available" | "busy";
};

type AvailabilityInitial = {
  dates: AvailabilityEntry[];
};

type AvailabilityFormProps = {
  initial: AvailabilityInitial;
};

type EditMode = "available" | "clear";

const initialState: FormMessageState = { ok: false, message: "" };

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

export default function AvailabilityForm({ initial }: AvailabilityFormProps) {
  const [state, formAction, isPending] = useActionState(saveAvailability, initialState);
  const [mode, setMode] = useState<EditMode>("available");
  const [monthOffset, setMonthOffset] = useState(0);
  const [changeMessage, setChangeMessage] = useState("");
  const [entries, setEntries] = useState<Record<string, AvailabilityEntry>>(() =>
    Object.fromEntries(initial.dates.map((entry) => [entry.date, entry]))
  );
  const t = useTranslation();
  const { language } = useLanguage();

  const months = useMemo(
    () => [0, 1, 2].map((offset) => startOfMonth(monthOffset + offset)),
    [monthOffset]
  );
  const sortedEntries = useMemo(
    () => Object.values(entries).sort((left, right) => left.date.localeCompare(right.date)),
    [entries]
  );
  const todayIso = formatIsoDate(new Date());
  const sliderStartLabel = formatMonthLabel(startOfMonth(monthOffset), language);
  const sliderEndLabel = formatMonthLabel(startOfMonth(monthOffset + 2), language);
  const displayChangeMessage = state.ok && state.message ? "" : changeMessage;

  function toggleDate(date: string) {
    setEntries((prev) => {
      const next = { ...prev };
      if (mode === "clear") {
        delete next[date];
        setChangeMessage(t("vendorDashboard.profileAvailability.changeResetBusy"));
        return next;
      }

      next[date] = { date, status: "available" };
      setChangeMessage(t("vendorDashboard.profileAvailability.changeMarkedAvailable"));
      return next;
    });
  }

  return (
    <form action={formAction}>
      <div className="mb-4">
        <div className="form-label mb-2">{t("vendorDashboard.profileAvailability.calendarLabel")}</div>
        <div className="wm-availability-toolbar mb-3">
          <button
            type="button"
            className={`btn ${mode === "available" ? "btn-success" : "btn-outline-success"}`}
            onClick={() => setMode("available")}
          >
            {t("vendorDashboard.profileAvailability.markAvailable")}
          </button>
          <button
            type="button"
            className={`btn ${mode === "clear" ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => setMode("clear")}
          >
            {t("vendorDashboard.profileAvailability.clearDate")}
          </button>
        </div>
        <div className="form-text mb-3">{t("vendorDashboard.profileAvailability.calendarHelp")}</div>
        <div className="wm-availability-slider mb-4">
          <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
            <label className="form-label mb-0" htmlFor="availability-month-slider">
              {t("vendorDashboard.profileAvailability.monthSliderLabel")}
            </label>
            <span className="text-muted small">
              {sliderStartLabel} - {sliderEndLabel}
            </span>
          </div>
          <input
            id="availability-month-slider"
            type="range"
            className="form-range"
            min={0}
            max={21}
            step={1}
            value={monthOffset}
            onChange={(event) => setMonthOffset(Number(event.target.value))}
          />
          <div className="form-text">{t("vendorDashboard.profileAvailability.monthSliderHelp")}</div>
        </div>

        <input type="hidden" name="availability_dates" value={JSON.stringify(sortedEntries)} />

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
                    const iso = cell.iso;
                    const label = cell.label;

                    if (!iso || !label) {
                      return <div key={`${monthLabel}-empty-${index}`} className="wm-availability-day wm-availability-day--empty" />;
                    }

                    const entry = entries[iso];
                    const isPast = iso < todayIso;
                    const tone =
                      entry?.status === "available"
                        ? "wm-availability-day--available"
                        : "wm-availability-day--busy";

                    return (
                      <button
                        key={iso}
                        type="button"
                        className={`wm-availability-day ${tone}`}
                        onClick={() => toggleDate(iso)}
                        disabled={isPast}
                        title={iso}
                      >
                        <span className="wm-availability-day__number">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {displayChangeMessage ? (
        <div className="alert alert-info" role="status">
          {displayChangeMessage}
        </div>
      ) : null}

      {state.message ? (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"}`} role="status">
          {state.message}
        </div>
      ) : null}

      <button className="btn btn-primary" disabled={isPending}>
        {isPending
          ? t("vendorDashboard.profileAvailability.saving")
          : t("vendorDashboard.profileAvailability.save")}
      </button>
    </form>
  );
}
