"use client";

import { useEffect, useId, useMemo, useState, type ChangeEvent } from "react";

type SuggestionItem = string | Record<string, unknown>;

type AutocompleteInputProps = {
  name?: string;
  className?: string;
  type?: "search" | "text";
  placeholder?: string;
  ariaLabel: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  suggestions?: string[];
  suggestionsEndpoint?: string;
  minQueryLength?: number;
  autoComplete?: string;
  id?: string;
};

function normalizeRemoteSuggestion(item: SuggestionItem): string | null {
  if (typeof item === "string") {
    return item.trim() || null;
  }

  const candidates = [item.label, item.value, item.business_name, item.name, item.title, item.slug];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

export default function AutocompleteInput({
  name,
  className = "form-control",
  type = "search",
  placeholder,
  ariaLabel,
  defaultValue = "",
  value,
  onValueChange,
  suggestions = [],
  suggestionsEndpoint,
  minQueryLength = 2,
  autoComplete = "off",
  id,
}: AutocompleteInputProps) {
  const listId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[]>([]);
  const currentValue = value ?? internalValue;

  useEffect(() => {
    if (value === undefined) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, value]);

  useEffect(() => {
    const query = currentValue.trim();
    if (!suggestionsEndpoint || query.length < minQueryLength) {
      setRemoteSuggestions([]);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const delimiter = suggestionsEndpoint.includes("?") ? "&" : "?";
        const response = await fetch(
          `${suggestionsEndpoint}${delimiter}q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Autocomplete request failed (${response.status})`);
        }

        const payload = (await response.json()) as { items?: SuggestionItem[] };
        setRemoteSuggestions(
          Array.from(
            new Set((payload.items ?? []).map(normalizeRemoteSuggestion).filter((item): item is string => Boolean(item))),
          ),
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setRemoteSuggestions([]);
        }
      }
    }, 160);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [currentValue, minQueryLength, suggestionsEndpoint]);

  const filteredLocalSuggestions = useMemo(() => {
    const query = currentValue.trim().toLowerCase();
    const filtered = query
      ? suggestions.filter((item) => item.toLowerCase().includes(query))
      : suggestions;

    return filtered.slice(0, 12);
  }, [currentValue, suggestions]);

  const mergedSuggestions = useMemo(
    () => Array.from(new Set([...filteredLocalSuggestions, ...remoteSuggestions])).slice(0, 12),
    [filteredLocalSuggestions, remoteSuggestions],
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  return (
    <>
      <input
        id={id}
        list={mergedSuggestions.length ? listId : undefined}
        name={name}
        className={className}
        type={type}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete={autoComplete}
        value={currentValue}
        onChange={handleChange}
      />
      {mergedSuggestions.length ? (
        <datalist id={listId}>
          {mergedSuggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </>
  );
}
