"use client";

import { usePortal } from "@/components/portal-provider";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";

export function AdminPhotosView() {
  const router = useRouter();
  const { state, setAddType, openDetail, deletePhoto } = usePortal();

  const photoGroupCounts = Array.from(new Set(state.photos.map((p) => p.group).filter(Boolean)))
    .map((group) => ({
      name: group,
      count: state.photos.filter((item) => item.group === group).length,
    }))
    .filter((item) => item.count > 0);

  function go(href: string) {
    router.push(href);
  }

  return (
    <div className="route">
      <div className="dashboard-top" style={{ alignItems: "center" }}>
        <div>
          <div className="section-kicker">Фотоархив · {state.photos.length} снимков</div>
          <h1 className="page-title">Фотоархив</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="primary-button"
            onClick={() => {
              setAddType("photo");
              go("/admin/add");
            }}
          >
            + Добавить фото
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {photoGroupCounts.map((item) => (
          <span key={item.name} className="tag-chip">
            {item.name} <span className="mono" style={{ marginLeft: 6 }}>{item.count}</span>
          </span>
        ))}
      </div>

      <div className="featured-grid">
        {state.photos.map((item) => (
          <div 
            key={item.id} 
            className="preview-card" 
            style={{ position: "relative", cursor: "default" }}
          >
            <div
              style={{
                aspectRatio: "4 / 3",
                background: item.imagePath 
                  ? `url(${item.imagePath}) center/cover no-repeat`
                  : `repeating-linear-gradient(135deg, ${item.tint}, ${item.tint} 13px, rgba(255,255,255,.16) 13px, rgba(255,255,255,.16) 26px)`,
                display: "flex",
                alignItems: "flex-end",
                padding: 10,
                cursor: "pointer",
                position: "relative"
              }}
              onClick={() => openDetail({ kind: "photo", item })}
            >
              <span
                className="type-chip"
                style={{ background: "rgba(20,18,16,.62)", color: "#fff" }}
              >
                {item.otype}
              </span>

              {/* Action buttons top right overlay */}
              <div 
                style={{ 
                  position: "absolute", 
                  top: 8, 
                  right: 8, 
                  display: "flex", 
                  gap: 6,
                  zIndex: 2
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="icon-button"
                  style={{ 
                    background: "rgba(255,255,255,0.9)", 
                    color: "var(--ink)", 
                    width: 28, 
                    height: 28, 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    border: "none",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                    cursor: "pointer"
                  }}
                  onClick={() => go(`/admin/add?edit=${item.id}&type=photo`)}
                  title="Редактировать"
                >
                  <Pencil size={13} strokeWidth={1.8} />
                </button>
                <button
                  className="icon-button"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    color: "var(--red)",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                    cursor: "pointer"
                  }}
                  onClick={async () => {
                    if (confirm("Вы уверены, что хотите удалить эту фотографию?")) {
                      await deletePhoto(item.id);
                    }
                  }}
                  title="Удалить"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
            <div 
              className="preview-body" 
              style={{ cursor: "pointer" }}
              onClick={() => openDetail({ kind: "photo", item })}
            >
              <div className="panel-title" style={{ fontSize: 19 }}>
                {item.title}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                {item.region} · {item.year}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
