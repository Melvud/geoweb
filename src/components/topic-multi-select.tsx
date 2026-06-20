"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import type { Topic } from "@/lib/portal-types";

type TopicMultiSelectProps = {
  topics: Topic[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
};

export function TopicMultiSelect({
  topics,
  selected,
  onChange,
  placeholder = "Выберите научные темы",
}: TopicMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedTopics = topics.filter((topic) => selected.includes(topic.id));

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function toggle(id: string) {
    onChange(selected.includes(id)
      ? selected.filter((selectedId) => selectedId !== id)
      : [...selected, id]);
  }

  return (
    <div ref={rootRef} className="topic-multiselect">
      <div
        className={`topic-multiselect-trigger${open ? " open" : ""}`}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={0}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        <div className="topic-multiselect-values">
          {selectedTopics.length > 0 ? selectedTopics.map((topic) => (
            <span key={topic.id} className="topic-multiselect-chip">
              {topic.name}
              <button
                type="button"
                aria-label={`Убрать тему «${topic.name}»`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggle(topic.id);
                }}
              >
                <X size={12} strokeWidth={2.2} />
              </button>
            </span>
          )) : <span className="topic-multiselect-placeholder">{placeholder}</span>}
        </div>
        <ChevronDown className="topic-multiselect-chevron" size={15} strokeWidth={1.8} />
      </div>

      {open && (
        <div className="combo-dropdown topic-multiselect-dropdown" role="listbox" aria-multiselectable="true">
          {topics.length > 0 ? topics.map((topic) => {
            const checked = selected.includes(topic.id);
            return (
              <button
                key={topic.id}
                type="button"
                role="option"
                aria-selected={checked}
                className={`combo-option${checked ? " combo-selected" : ""}`}
                onClick={() => toggle(topic.id)}
              >
                <span className="topic-multiselect-check">
                  {checked ? <Check size={14} strokeWidth={2.2} /> : null}
                </span>
                <span>{topic.name}</span>
              </button>
            );
          }) : (
            <div className="topic-multiselect-empty">Сначала создайте научную тему</div>
          )}
        </div>
      )}
    </div>
  );
}
