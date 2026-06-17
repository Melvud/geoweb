"use client";

type AdminRoute = "dashboard" | "materials" | "publications" | "photos" | "topics" | "archive" | "library" | "map" | "messages" | "files" | "pages" | "add";

export function PortalAdminSidebar({
  adminRoute,
  adminLinks,
  onGo,
}: {
  adminRoute: AdminRoute;
  adminLinks: Array<{ key: AdminRoute; label: string; href: string; code: string; count?: number }>;
  onGo: (href: string) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-label">Управление</div>
      {adminLinks.map((item) => (
        <button
          key={item.key}
          className={`sidebar-link ${adminRoute === item.key ? "active" : ""}`}
          onClick={() => onGo(item.href)}
        >
          <span className="sidebar-link-index mono">{item.code}</span>
          <span className="sidebar-link-label">{item.label}</span>
          {typeof item.count === "number" ? (
            <span className="sidebar-link-count">{item.count}</span>
          ) : null}
        </button>
      ))}
      <button className="sidebar-cta" onClick={() => onGo("/admin/add")}>
        <span style={{ fontSize: 17, lineHeight: 0 }}>+</span>
        Добавить материал
      </button>
    </aside>
  );
}
