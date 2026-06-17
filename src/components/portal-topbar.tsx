"use client";

import { Sun, Moon, Pencil, Check } from "lucide-react";
import { usePortal } from "@/components/portal-provider";
import { EditableText } from "@/components/editable-text";

type ViewMode = "admin" | "public";

export function PortalTopbar({
  mode,
  theme,
  savedLabel,
  showModeToggle = true,
  onGo,
  onToggleTheme,
}: {
  mode: ViewMode;
  theme: "light" | "dark";
  savedLabel: string;
  showModeToggle?: boolean;
  onGo: (href: string) => void;
  onToggleTheme: () => void;
}) {
  const { state, isAdminUnlocked, toggleEditMode } = usePortal();
  const editMode = state.editMode;

  return (
    <header className="topbar">
      <button
        className="brand"
        onClick={() => {
          if (editMode) return;
          onGo(mode === "admin" ? "/admin" : "/");
        }}
      >
        <span className="brand-mark">
          <span className="brand-icon" />
        </span>
        <span>
          <EditableText as="span" id="topbar.brandTitle" className="brand-title" />
          <br />
          <EditableText as="span" id="topbar.brandSubtitle" className="brand-subtitle" />
        </span>
      </button>

      {showModeToggle && (
        <div className="mode-toggle">
          <button
            className={`mode-pill ${mode === "public" ? "active" : ""}`}
            onClick={() => !editMode && onGo("/")}
          >
            <EditableText id="topbar.modePublic" />
          </button>
          <button
            className={`mode-pill ${mode === "admin" ? "active" : ""}`}
            onClick={() => !editMode && onGo("/admin")}
          >
            <EditableText id="topbar.modeAdmin" />
          </button>
        </div>
      )}

      <div className="topbar-right">
        {mode === "admin" ? (
          <div className="autosave">
            <span className="pulse-dot" />
            {savedLabel}
          </div>
        ) : null}
        {isAdminUnlocked && (
          <button
            className="icon-button"
            onClick={toggleEditMode}
            title={editMode ? "Завершить редактирование текстов" : "Редактировать тексты на странице"}
            style={
              editMode
                ? { background: "var(--clay)", color: "#fff", borderColor: "var(--clay)" }
                : undefined
            }
          >
            {editMode ? <Check size={16} strokeWidth={2} /> : <Pencil size={15} strokeWidth={1.8} />}
          </button>
        )}
        <button className="icon-button" onClick={onToggleTheme} title="Сменить тему">
          {theme === "dark" ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
        </button>
        <div className="avatar-dot" />
      </div>
    </header>
  );
}
