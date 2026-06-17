"use client";

import { useRef } from "react";
import type { CSSProperties, ElementType, KeyboardEvent } from "react";
import { usePortal } from "@/components/portal-provider";
import { resolveUiText } from "@/lib/ui-text";

/**
 * Интерфейсный текст с inline-редактированием.
 *
 * В обычном режиме просто выводит строку (значение из БД или дефолт).
 * Когда админ авторизован и включён «Режим редактирования», текст можно
 * редактировать прямо на странице — изменение сохраняется при потере фокуса
 * или нажатии Enter.
 */
export function EditableText({
  id,
  as,
  className,
  style,
  multiline = false,
}: {
  id: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  multiline?: boolean;
}) {
  const { state, isAdminUnlocked, saveUiText } = usePortal();
  const ref = useRef<HTMLElement>(null);
  const Tag = (as ?? "span") as ElementType;

  const value = resolveUiText(state.uiText, id);
  const canEdit = isAdminUnlocked && state.editMode;

  if (!canEdit) {
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }

  function commit() {
    const next = (ref.current?.textContent ?? "").replace(/\s+/g, " ").trim();
    if (next && next !== value) {
      void saveUiText(id, next);
    } else if (ref.current) {
      // Откатить визуально, если пусто или без изменений
      ref.current.textContent = value;
    }
  }

  return (
    <Tag
      ref={ref}
      className={className}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      title="Нажмите, чтобы отредактировать · Enter — сохранить"
      style={{
        ...style,
        outline: "1px dashed var(--clay)",
        outlineOffset: 3,
        borderRadius: 3,
        cursor: "text",
        minWidth: 12,
        display: "inline-block",
      }}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" && !multiline) {
          event.preventDefault();
          (event.target as HTMLElement).blur();
        }
        if (event.key === "Escape" && ref.current) {
          ref.current.textContent = value;
          (event.target as HTMLElement).blur();
        }
      }}
      onBlur={commit}
    >
      {value}
    </Tag>
  );
}
