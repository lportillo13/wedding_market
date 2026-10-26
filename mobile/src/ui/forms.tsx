import { copy } from "../i18n/copy";
import { styles } from "../theme/styles";
import { colors } from "../theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export function FieldLabel({ text, centered = false }: { text: string; centered?: boolean }) {
  return <Text style={[styles.label, centered && styles.signupFieldLabel]}>{text}</Text>;
}


export function NativeSelect({
  label,
  value,
  options,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <View style={styles.nativeSelectBlock}>
      <View style={styles.nativeSelectHeader}>
        <FieldLabel text={label} />
        {helper ? <Text style={styles.nativeSelectHelper}>{helper}</Text> : null}
      </View>
      <View style={styles.nativeSelectOptions}>
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <TouchableOpacity
              key={option.value || "empty"}
              onPress={() => onChange(option.value)}
              style={[styles.nativeSelectPill, isActive && styles.nativeSelectPillActive]}
            >
              <Text style={[styles.nativeSelectText, isActive && styles.nativeSelectTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}


export function SearchableCountryDropdown({
  label,
  value,
  options,
  onChange,
  language,
  centered = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  language: "en" | "es";
  centered?: boolean;
}) {
  const labels = copy[language];
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => {
        const labelText = option.label.toLowerCase();
        const valueText = option.value.toLowerCase();
        return labelText.includes(normalizedQuery) || valueText.includes(normalizedQuery);
      })
    : options;

  return (
    <View style={styles.countryDropdownBlock}>
      <FieldLabel centered={centered} text={label} />
      <TouchableOpacity
        onPress={() => setIsOpen((current) => !current)}
        style={[styles.countryDropdownTrigger, isOpen && styles.countryDropdownTriggerActive]}
      >
        <Text style={[
          styles.countryDropdownValue,
          centered && styles.countryDropdownValueCentered,
          !selectedLabel && styles.countryDropdownPlaceholder,
        ]}>
          {selectedLabel || labels.searchCountry}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.ink}
          style={centered ? styles.countryDropdownIconCentered : undefined}
        />
      </TouchableOpacity>

      {isOpen ? (
        <View style={styles.countryDropdownMenu}>
          <View style={styles.countrySearchInputWrap}>
            <Ionicons
              name="search-outline"
              size={17}
              color={colors.muted}
              style={centered ? styles.countrySearchIconCentered : undefined}
            />
            <TextInput
              autoCapitalize="words"
              onChangeText={setQuery}
              placeholder={labels.searchCountry}
              style={[styles.countrySearchInput, centered && styles.countrySearchInputCentered]}
              value={query}
            />
          </View>
          <ScrollView nestedScrollEnabled style={styles.countryOptionsList} keyboardShouldPersistTaps="handled">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setQuery("");
                      setIsOpen(false);
                    }}
                    style={[styles.countryOptionRow, isSelected && styles.countryOptionRowActive]}
                  >
                    <Text style={[
                      styles.countryOptionText,
                      centered && styles.countryOptionTextCentered,
                      isSelected && styles.countryOptionTextActive,
                    ]}>
                      {option.label}
                    </Text>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark"
                        size={17}
                        color={colors.ink}
                        style={centered ? styles.countryOptionCheckCentered : undefined}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.countryNoResults}>{labels.noCountryResults}</Text>
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
