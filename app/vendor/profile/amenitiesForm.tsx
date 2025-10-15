"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { saveAmenities, type FormMessageState } from "./actions";

type AmenityOption = {
  key: string;
  group_key: string;
  label: Record<string, unknown> | null;
};

type AmenitiesInitial = {
  selectedKeys: string[];
  capacityMax: string;
  eventTypes: string;
};

type AmenitiesFormProps = {
  initial: AmenitiesInitial;
  options: AmenityOption[];
};

const initialState: FormMessageState = { ok: false, message: "" };

function resolveLabel(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.en === "string") return record.en;
    const first = Object.values(record).find((entry) => typeof entry === "string");
    if (typeof first === "string") return first;
  }
  return "";
}

const GROUP_ORDER = ["amenities", "ceremony_types", "settings", "services"] as const;

export default function AmenitiesForm({ initial, options }: AmenitiesFormProps) {
  const [state, formAction, isPending] = useActionState(saveAmenities, initialState);
  const [selected, setSelected] = useState<Set<string>>(new Set(initial.selectedKeys));
  const [capacityMax, setCapacityMax] = useState(initial.capacityMax);
  const [eventTypes, setEventTypes] = useState(initial.eventTypes);
  const t = useTranslation();

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, AmenityOption[]>();
    for (const option of options) {
      const list = groups.get(option.group_key) ?? [];
      list.push(option);
      groups.set(option.group_key, list);
    }
    for (const [, list] of groups) {
      list.sort((a, b) => resolveLabel(a.label).localeCompare(resolveLabel(b.label)));
    }
    return groups;
  }, [options]);

  function toggleAmenity(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <form action={formAction}>
      <div className="mb-4">
        <label className="form-label" htmlFor="amenities-capacity">
          {t("vendorDashboard.profileAmenities.capacityLabel")}
        </label>
        <input
          id="amenities-capacity"
          name="capacity_max"
          className="form-control"
          value={capacityMax}
          onChange={(event) => setCapacityMax(event.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="form-label" htmlFor="amenities-event-types">
          {t("vendorDashboard.profileAmenities.eventTypesLabel")}
        </label>
        <textarea
          id="amenities-event-types"
          name="event_types"
          className="form-control"
          rows={2}
          value={eventTypes}
          onChange={(event) => setEventTypes(event.target.value)}
        />
        <div className="form-text">{t("vendorDashboard.profileAmenities.csvHelp")}</div>
      </div>

      <p className="text-muted">{t("vendorDashboard.profileAmenities.instructions")}</p>

      <div className="row g-4">
        {GROUP_ORDER.map((groupKey) => {
          const list = groupedOptions.get(groupKey) ?? [];
          if (!list.length) return null;
          return (
            <div className="col-12 col-md-6" key={groupKey}>
              <h3 className="h5 mb-3">{t(`vendorDashboard.profileAmenities.groups.${groupKey}`)}</h3>
              <div className="d-flex flex-column gap-2">
                {list.map((option) => {
                  const label = resolveLabel(option.label) || option.key;
                  return (
                    <div className="form-check" key={option.key}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`amenity-${option.key}`}
                        name="amenities"
                        value={option.key}
                        checked={selected.has(option.key)}
                        onChange={() => toggleAmenity(option.key)}
                      />
                      <label className="form-check-label" htmlFor={`amenity-${option.key}`}>
                        {label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {state.message ? (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"} mt-4`} role="status">
          {state.message}
        </div>
      ) : null}

      <button className="btn btn-primary mt-3" disabled={isPending}>
        {isPending
          ? t("vendorDashboard.profileAmenities.saving")
          : t("vendorDashboard.profileAmenities.save")}
      </button>
    </form>
  );
}
