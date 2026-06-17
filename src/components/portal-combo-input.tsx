"use client";

import { useEffect, useRef, useState } from "react";

interface ComboInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
}

export function ComboInput({ value, onChange, suggestions, placeholder, className }: ComboInputProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(false); // true = user is typing (filter mode)
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setActiveIdx(-1); }, [open, value]);

  // When just opened (not typing) → show ALL suggestions
  // When typing → filter by what's typed
  const items = typed
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions;

  // "Create new" row when typed value isn't among suggestions
  const showAdd =
    typed &&
    value.trim() !== "" &&
    !suggestions.some((s) => s.toLowerCase() === value.trim().toLowerCase());

  const totalItems = items.length + (showAdd ? 1 : 0);

  function select(s: string) {
    onChange(s);
    setTyped(false);
    setOpen(false);
    setActiveIdx(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setTyped(false); setOpen(true); }
      setActiveIdx((i) => Math.min(i + 1, totalItems - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && open) {
        e.preventDefault();
        if (activeIdx < items.length) select(items[activeIdx]);
        else if (showAdd) select(value.trim());
      }
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
      setTyped(false);
    }
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* Input + dropdown arrow */}
      <div style={{ position: "relative" }}>
        <input
          className={className ?? "text-input"}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          style={{ paddingRight: 34 }}
          onChange={(e) => {
            onChange(e.target.value);
            setTyped(true);
            setOpen(true);
          }}
          onFocus={() => {
            setTyped(false); // show all on focus
            setOpen(true);
          }}
          onBlur={() =>
            setTimeout(() => {
              setOpen(false);
              setTyped(false);
            }, 160)
          }
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            if (open) {
              setOpen(false);
            } else {
              setTyped(false);
              setOpen(true);
            }
          }}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 34,
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
            fontSize: 11,
            borderRadius: "0 10px 10px 0",
          }}
        >
          {open ? "▴" : "▾"}
        </button>
      </div>

      {/* Dropdown */}
      {open && totalItems > 0 && (
        <div className="combo-dropdown">
          {items.map((s, i) => (
            <button
              key={s}
              className={`combo-option${i === activeIdx ? " active" : ""}${s === value ? " combo-selected" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(s);
              }}
            >
              {s === value && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1.5 6l3 3 6-6" stroke="var(--clay)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {s}
            </button>
          ))}

          {showAdd && (
            <button
              className={`combo-option combo-option-add${items.length === activeIdx ? " active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(value.trim());
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M6 1v10M1 6h10" stroke="var(--clay)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span>
                <span style={{ color: "var(--clay)", fontWeight: 600 }}>Создать:</span>{" "}
                {value.trim()}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
