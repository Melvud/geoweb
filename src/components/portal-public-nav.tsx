"use client";

import { useState } from "react";
import { Search, Menu, X } from "lucide-react";
import { usePortal } from "@/components/portal-provider";
import { EditableText } from "@/components/editable-text";
import { resolveUiText } from "@/lib/ui-text";

type PublicRoute =
  | "home"
  | "about"
  | "students"
  | "research"
  | "publications"
  | "photos"
  | "expeditions"
  | "archive"
  | "library"
  | "contacts"
  | "search";

export function PortalPublicNav({
  publicLinks,
  publicRoute,
  searchQuery,
  onGo,
  onSearchInput,
}: {
  publicLinks: Array<{ key: PublicRoute; href: string }>;
  publicRoute: PublicRoute;
  searchQuery: string;
  onGo: (href: string) => void;
  onSearchInput: (value: string) => void;
}) {
  const { state } = usePortal();
  const editMode = state.editMode;
  const [open, setOpen] = useState(false);

  function handleGo(href: string) {
    if (editMode) return;
    setOpen(false);
    onGo(href);
  }

  return (
    <div className="public-sticky-nav">
      <div className="public-nav-inner">
        <button
          className="nav-burger"
          aria-label="Меню"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
        </button>

        <div className={`public-nav-list ${open ? "open" : ""}`}>
          {publicLinks.map((item) => (
            <button
              key={item.key}
              className={`public-nav-link ${publicRoute === item.key ? "active" : ""}`}
              onClick={() => handleGo(item.href)}
            >
              <EditableText id={`nav.${item.key}`} />
            </button>
          ))}
        </div>
        <div className="search-wrap">
          <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
          <input
            className="search-input"
            value={searchQuery}
            onChange={(event) => onSearchInput(event.target.value)}
            placeholder={resolveUiText(state.uiText, "nav.searchPlaceholder")}
          />
        </div>
      </div>
    </div>
  );
}
