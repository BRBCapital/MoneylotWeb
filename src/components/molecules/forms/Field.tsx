"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { imagesAndIcons } from "@/constants/imagesAndIcons";

export function TextField({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  disabled,
  readOnly,
  error,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string | null;
}) {
  return (
    <div className="w-full">
      <label className="block text-[11px] font-medium text-[#5F6368]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={`mt-1 h-[40px] w-full rounded-[6px] border border-black/10 px-3 text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081] ${
          disabled ? "bg-[#F3F3F3] opacity-70 cursor-not-allowed" : "bg-white"
        }`}
      />
      {error ? (
        <p className="mt-1 text-[11px] text-[#E53935]">{error}</p>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  placeholder = "Select",
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ label: string; value: string }>;
  error?: string | null;
}) {
  return (
    <div className="w-full">
      <label className="block text-[11px] font-medium text-[#5F6368]">
        {label}
      </label>
      <div className="relative mt-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[40px] w-full appearance-none rounded-[6px] border border-black/10 bg-white px-3 pr-10 text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081] focus:outline-none focus:ring-0"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      {error ? (
        <p className="mt-1 text-[11px] text-[#E53935]">{error}</p>
      ) : null}
    </div>
  );
}

export function SearchableSelectField({
  label,
  placeholder = "Select",
  searchPlaceholder = "Search",
  value,
  onChange,
  options,
  disabled,
  error,
}: {
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ label: string; value: string }>;
  disabled?: boolean;
  error?: string | null;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel = useMemo(() => {
    const found = options.find((o) => o.value === value);
    return found?.label || "";
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <div className="w-full" ref={wrapRef}>
      <label className="block text-[11px] font-medium text-[#5F6368]">
        {label}
      </label>
      <div className="relative mt-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((v) => !v);
          }}
          className={`h-[40px] w-full rounded-[6px] border border-black/10 bg-white px-3 pr-10 text-left text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081] ${
            disabled ? "opacity-60 cursor-not-allowed" : ""
          }`}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {selectedLabel || (
            <span className="text-[#8A8A8A]">{placeholder}</span>
          )}
        </button>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
            <div className="p-2">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-[36px] w-full rounded-[8px] border border-black/10 bg-white px-3 text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
              />
            </div>
            <div
              role="listbox"
              className="max-h-[220px] overflow-auto scrollbar-hidden"
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-[#5F6368]">
                  No results
                </div>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-[12px] ${
                      o.value === value
                        ? "bg-[#5FCE551A] text-[#2E2E2E]"
                        : "text-[#2E2E2E] hover:bg-black/5"
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {o.value === value ? (
                      <span className="ml-3 text-[#89E081]">✓</span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 text-[11px] text-[#E53935]">{error}</p>
      ) : null}
    </div>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string | null;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="w-full">
      <label className="block text-[14px] font-medium text-[#5F6368]">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-[40px] w-full rounded-[6px] border border-black/10 bg-white px-3 pr-10 text-[14px] text-[#2E2E2E] outline-none focus:border-[#89E081]"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-80 hover:opacity-100"
          aria-label={show ? "Hide password" : "Show password"}
        >
          <Image
            src={show ? imagesAndIcons.hidePassword : imagesAndIcons.showPassword}
            alt={show ? "Hide password" : "Show password"}
            width={18}
            height={18}
          />
        </button>
      </div>
      {error ? (
        <p className="mt-1 text-[11px] text-[#E53935]">{error}</p>
      ) : null}
    </div>
  );
}

export function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string; // ISO format: YYYY-MM-DD
  onChange: (v: string) => void;
  error?: string | null;
}) {
  const inputId = React.useId();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="block text-[11px] font-medium text-[#5F6368]"
      >
        {label}
      </label>
      <div className="relative mt-1">
        <input
          ref={inputRef}
          id={inputId}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[40px] w-full appearance-none rounded-[6px] border border-black/10 bg-white px-3 pr-12 text-[12px] text-[#2E2E2E] outline-none focus:border-[#89E081] focus:outline-none focus:ring-0"
        />
        <button
          type="button"
          onClick={() => {
            const el = inputRef.current;
            if (!el) return;
            // Prefer opening the native picker when supported.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (el as any).showPicker?.();
            el.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-80 hover:opacity-100"
          aria-label="Open date picker"
        >
          <Image
            src={imagesAndIcons.dateIcon}
            alt="Date"
            width={18}
            height={18}
          />
        </button>
      </div>
      {error ? (
        <p className="mt-1 text-[11px] text-[#E53935]">{error}</p>
      ) : null}
    </div>
  );
}

export function PhoneNumberField({
  label,
  countryCode,
  onCountryCodeChange,
  phoneNumber,
  onPhoneNumberChange,
  countryCodeOptions = ["+234", "+1", "+44"],
  error,
}: {
  label: string;
  countryCode: string;
  onCountryCodeChange: (v: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (v: string) => void;
  countryCodeOptions?: string[];
  error?: string | null;
}) {
  return (
    <div className="w-full">
      <label className="block text-[11px] font-medium text-[#5F6368]">
        {label}
      </label>
      <div className="mt-1 flex h-[40px] w-full overflow-hidden rounded-[6px] border border-black/10 bg-white">
        <div className="relative flex w-[64px] shrink-0 items-center px-2">
          <select
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
            className="h-full w-full appearance-none border-0 bg-transparent pr-4 text-[12px] text-[#2E2E2E] outline-none focus:outline-none focus:ring-0"
          >
            {countryCodeOptions.map((cc) => (
              <option key={cc} value={cc}>
                {cc}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[#8A8A8A]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M5 6.5L8 9.5L11 6.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <div className="h-full w-px bg-black/10" />
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => {
            const raw = e.target.value || "";
            // Remove spaces and any non-digit characters
            const cleaned = raw.replace(/\s+/g, "").replace(/[^\d]/g, "");
            onPhoneNumberChange(cleaned);
          }}
          placeholder="810 987 6549"
          className="h-full flex-1 bg-white px-3 text-[12px] text-[#2E2E2E] outline-none"
        />
      </div>
      {error ? (
        <p className="mt-1 text-[11px] text-[#E53935]">{error}</p>
      ) : null}
    </div>
  );
}

