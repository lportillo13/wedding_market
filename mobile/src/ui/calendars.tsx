import { copy } from "../i18n/copy";
import { type VendorDetail } from "../lib/api";
import { styles } from "../theme/styles";
import { colors } from "../theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

export function QuoteDateCalendar({
  value,
  language,
  onChange,
}: {
  value: string;
  language: "en" | "es";
  onChange: (value: string) => void;
}) {
  const labels = copy[language];
  const selectedParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const [month, setMonth] = useState(() => {
    if (selectedParts) return new Date(Number(selectedParts[1]), Number(selectedParts[2]) - 1, 1);
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    const nextSelectedParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (nextSelectedParts) {
      setMonth(new Date(Number(nextSelectedParts[1]), Number(nextSelectedParts[2]) - 1, 1));
      return;
    }
    const today = new Date();
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }, [value]);

  const days = useMemo(() => {
    const leadingBlanks = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [month]);
  const monthLabel = new Intl.DateTimeFormat(language === "es" ? "es-CR" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(month);
  const weekDays = language === "es" ? ["D", "L", "M", "X", "J", "V", "S"] : ["S", "M", "T", "W", "T", "F", "S"];
  const selectedLabel = selectedParts
    ? new Intl.DateTimeFormat(language === "es" ? "es-CR" : "en-US", { dateStyle: "long" }).format(
        new Date(Number(selectedParts[1]), Number(selectedParts[2]) - 1, Number(selectedParts[3])),
      )
    : labels.selectDate;

  return (
    <View style={styles.datePickerCard}>
      <View style={styles.datePickerHeader}>
        <TouchableOpacity onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} style={styles.datePickerArrow}>
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.datePickerMonth}>{monthLabel}</Text>
        <TouchableOpacity onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} style={styles.datePickerArrow}>
          <Ionicons name="chevron-forward" size={18} color={colors.ink} />
        </TouchableOpacity>
      </View>
      <View style={styles.datePickerWeekRow}>
        {weekDays.map((day, index) => <Text key={`${day}-${index}`} style={styles.datePickerWeekday}>{day}</Text>)}
      </View>
      <View style={styles.datePickerGrid}>
        {days.map((day, index) => {
          if (!day) return <View key={`blank-${index}`} style={styles.datePickerDay} />;
          const dateValue = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const selected = value === dateValue;
          return (
            <TouchableOpacity
              accessibilityLabel={dateValue}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={dateValue}
              onPress={() => onChange(dateValue)}
              style={[styles.datePickerDay, selected && styles.datePickerDaySelected]}
            >
              <Text style={[styles.datePickerDayText, selected && styles.datePickerDayTextSelected]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.quoteSelectedDateRow}>
        <Text style={styles.selectedDateText}>{selectedLabel}</Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange("")}>
            <Text style={styles.quoteClearDateText}>{labels.clearDate}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}


export function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (year && month && day) return new Date(year, month - 1, day);
  return new Date(value);
}


export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}


export function AvailabilityPreview({ dates, language }: { dates: NonNullable<VendorDetail["availability"]>; language: "en" | "es" }) {
  const labels = copy[language];
  const { width } = useWindowDimensions();
  const [referenceDate] = useState(() => new Date());
  const referenceTime = referenceDate.getTime();
  const upcoming = dates
    .map((date) => ({ ...date, parsed: parseDateValue(date.date) }))
    .filter((date) => date.parsed.getTime() >= referenceTime - 24 * 60 * 60 * 1000)
    .sort((left, right) => left.parsed.getTime() - right.parsed.getTime());
  const statusByDate = new Map(upcoming.map((date) => [dateKey(date.parsed), date.status]));
  const startSource = referenceDate;
  const calendarWidth = Math.max(280, width - 104);
  const monthStarts = Array.from({ length: 12 }, (_, offset) =>
    new Date(startSource.getFullYear(), startSource.getMonth() + offset, 1),
  );

  return (
    <View style={styles.availabilityMonths}>
      {!upcoming.length ? (
        <Text style={styles.detailBody}>{labels.availabilityEmpty}</Text>
      ) : null}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={calendarWidth + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.availabilityMonthScroller}
      >
        {monthStarts.map((monthStart) => {
          const monthLabel = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
          const leadingBlanks = monthStart.getDay();
          const cells = [
            ...Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}`, day: null as number | null })),
            ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 })),
          ];

          return (
            <View key={monthLabel} style={[styles.availabilityMonthCard, { width: calendarWidth }]}>
              <Text style={styles.availabilityCalendarTitle}>{monthLabel}</Text>
              <View style={styles.availabilityWeekdays}>
                {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
                  <Text key={`${label}-${index}`} style={styles.availabilityWeekday}>{label}</Text>
                ))}
              </View>
              <View style={styles.availabilityCalendarGrid}>
                {cells.map((cell) => {
                  if (!cell.day) return <View key={cell.key} style={styles.availabilityCalendarDayBlank} />;
                  const current = new Date(monthStart.getFullYear(), monthStart.getMonth(), cell.day);
                  const status = statusByDate.get(dateKey(current));
                  return (
                    <View
                      key={cell.key}
                      style={[
                        styles.availabilityCalendarDay,
                        status === "available" && styles.availabilityDayOpen,
                        status === "busy" && styles.availabilityDayBusy,
                      ]}
                    >
                      <Text
                        style={[
                          styles.availabilityCalendarNumber,
                          status === "available" && styles.availabilityCalendarNumberOpen,
                          status === "busy" && styles.availabilityCalendarNumberBusy,
                        ]}
                      >
                        {cell.day}
                      </Text>
                      {status ? <View style={[styles.availabilityDot, status === "busy" && styles.availabilityDotBusy]} /> : null}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}


export function EditableAvailabilityCalendar({
  dates,
  language,
  onChange,
}: {
  dates: Record<string, string>[];
  language: "en" | "es";
  onChange: React.Dispatch<React.SetStateAction<Record<string, string>[]>>;
}) {
  const labels = copy[language];
  const statusByDate = new Map(dates.filter((item) => item.date).map((item) => [item.date, item.status]));
  const today = new Date();
  const monthStarts = [0, 1].map((offset) => new Date(today.getFullYear(), today.getMonth() + offset, 1));

  function cycleDate(key: string) {
    onChange((current) => {
      const existing = current.find((item) => item.date === key);
      if (!existing) return [...current, { date: key, status: "available" }];
      if (existing.status === "available") {
        return current.map((item) => item.date === key ? { ...item, status: "busy" } : item);
      }
      return current.filter((item) => item.date !== key);
    });
  }

  return (
    <View style={styles.availabilityMonths}>
      <View style={styles.availabilityLegend}>
        <View style={styles.availabilityLegendItem}><View style={[styles.availabilityLegendDot, styles.availabilityLegendOpen]} /><Text style={styles.vendorMeta}>{labels.available}</Text></View>
        <View style={styles.availabilityLegendItem}><View style={[styles.availabilityLegendDot, styles.availabilityLegendBusy]} /><Text style={styles.vendorMeta}>{labels.busy}</Text></View>
      </View>
      {monthStarts.map((monthStart) => {
        const monthLabel = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
        const leadingBlanks = monthStart.getDay();
        const cells = [
          ...Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}`, day: null as number | null })),
          ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 })),
        ];

        return (
          <View key={monthLabel} style={styles.availabilityMonthCard}>
            <Text style={styles.availabilityCalendarTitle}>{monthLabel}</Text>
            <View style={styles.availabilityWeekdays}>
              {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
                <Text key={`${label}-${index}`} style={styles.availabilityWeekday}>{label}</Text>
              ))}
            </View>
            <View style={styles.availabilityCalendarGrid}>
              {cells.map((cell) => {
                if (!cell.day) return <View key={cell.key} style={styles.availabilityCalendarDayBlank} />;
                const current = new Date(monthStart.getFullYear(), monthStart.getMonth(), cell.day);
                const key = dateKey(current);
                const status = statusByDate.get(key);
                return (
                  <TouchableOpacity
                    key={cell.key}
                    onPress={() => cycleDate(key)}
                    style={[
                      styles.availabilityCalendarDay,
                      status === "available" && styles.availabilityDayOpen,
                      status === "busy" && styles.availabilityDayBusy,
                    ]}
                  >
                    <Text
                      style={[
                        styles.availabilityCalendarNumber,
                        status === "available" && styles.availabilityCalendarNumberOpen,
                        status === "busy" && styles.availabilityCalendarNumberBusy,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
