"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

type SearchableSelectOption = {
  value: string;
  label: string;
  searchText?: string;
};

type SearchableSelectCopy = {
  searchPlaceholder: string;
  noResults: string;
};

type SearchableSelectProps = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  autoComplete?: string;
  value: string;
  options: SearchableSelectOption[];
  copy: SearchableSelectCopy;
  errorMessage?: string | null;
};

function normalizeSearchValue(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function SearchableSelect({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  value,
  options,
  copy,
  errorMessage,
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pendingHighlightRef = useRef<number | null>(null);
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setHighlightedIndex(-1);
      return;
    }

    searchInputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue) ?? null,
    [options, selectedValue],
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);

    if (normalizedQuery.length === 0) {
      return options;
    }

    return options.filter((option) => {
      const haystack = normalizeSearchValue(`${option.label} ${option.searchText ?? ""}`);
      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const pendingHighlight = pendingHighlightRef.current;
    pendingHighlightRef.current = null;

    if (pendingHighlight !== null) {
      setHighlightedIndex(
        filteredOptions.length > 0 ? Math.max(0, Math.min(pendingHighlight, filteredOptions.length - 1)) : -1,
      );
      return;
    }

    if (query.length > 0) {
      setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
      return;
    }

    const selectedIndex = filteredOptions.findIndex((option) => option.value === selectedValue);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : filteredOptions.length > 0 ? 0 : -1);
  }, [filteredOptions, isOpen, query, selectedValue]);

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) {
      return;
    }

    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, isOpen]);

  function closeSelect() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function selectOption(option: SearchableSelectOption) {
    setSelectedValue(option.value);
    closeSelect();
  }

  function moveHighlight(direction: -1 | 1) {
    if (filteredOptions.length === 0) {
      return;
    }

    setHighlightedIndex((currentIndex) => {
      if (currentIndex < 0) {
        return direction === 1 ? 0 : filteredOptions.length - 1;
      }

      return (currentIndex + direction + filteredOptions.length) % filteredOptions.length;
    });
  }

  function handlePrintableKey(eventKey: string) {
    pendingHighlightRef.current = 0;
    setQuery(eventKey);
    setIsOpen(true);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      pendingHighlightRef.current = 0;
      setIsOpen(true);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      pendingHighlightRef.current = Math.max(filteredOptions.length - 1, 0);
      setIsOpen(true);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSelect();
      return;
    }

    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      handlePrintableKey(event.key);
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (event.key === "Enter") {
      const highlightedOption = filteredOptions[highlightedIndex];

      if (highlightedOption) {
        event.preventDefault();
        selectOption(highlightedOption);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSelect();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selectedValue} autoComplete={autoComplete} />

      <label htmlFor={`${id}-trigger`} className="mb-2 block text-sm font-semibold text-slate-900">
        {label}
      </label>

      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-describedby={errorMessage ? `${id}-error` : undefined}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-white/75 bg-white/80 px-4 py-3 text-left text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={selectedOption ? undefined : "text-slate-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span aria-hidden="true" className="text-slate-400">
          ▾
        </span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.4)]">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={copy.searchPlaceholder}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-activedescendant={highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined}
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />

          <div id={listboxId} role="listbox" aria-labelledby={`${id}-trigger`} className="mt-3 max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              <div className="space-y-1">
                {filteredOptions.map((option, index) => {
                  const isSelected = option.value === selectedValue;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <button
                      ref={(element) => {
                        optionRefs.current[index] = element;
                      }}
                      key={`${name}-${option.value}-${option.label}`}
                      id={`${id}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                        isHighlighted
                          ? "bg-slate-100 text-slate-900"
                          : isSelected
                          ? "bg-emerald-50 text-emerald-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => selectOption(option)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-4 py-3 text-sm text-slate-500">{copy.noResults}</p>
            )}
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-rose-600">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export type { SearchableSelectCopy, SearchableSelectOption };
