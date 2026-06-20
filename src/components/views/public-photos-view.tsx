"use client";

import { useState, useEffect } from "react";
import { usePortal } from "@/components/portal-provider";
import { EditableText } from "@/components/editable-text";
import { isListedPublic } from "@/lib/portal-utils";

export function PublicPhotosView() {
  const { state } = usePortal();

  // Selected folder and topic filters
  const [selectedGroup, setSelectedGroup] = useState<string>("Все");
  const [selectedTopic, setSelectedTopic] = useState<string>("Все");

  // Lightbox slideshow state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Dynamic lists — только публично видимые фото
  const publicPhotos = state.photos.filter((p) => isListedPublic(p.access) && p.status !== "draft");
  const allGroups = ["Все", ...Array.from(new Set(publicPhotos.map((p) => p.group).filter(Boolean)))];

  const filteredPhotos = publicPhotos.filter((p) => {
    const matchesGroup = selectedGroup === "Все" || p.group === selectedGroup;
    const matchesTopic = selectedTopic === "Все" || p.relatedTopicIds?.includes(selectedTopic);
    return matchesGroup && matchesTopic;
  });

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        navigateLightbox(-1);
      } else if (e.key === "ArrowRight") {
        navigateLightbox(1);
      } else if (e.key === "Escape") {
        setLightboxIndex(null);
        setIsPlaying(false);
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredPhotos.length]);

  // Slideshow autoplay
  useEffect(() => {
    if (!isPlaying || lightboxIndex === null) return;

    const timer = setInterval(() => {
      navigateLightbox(1);
    }, 3000);

    return () => clearInterval(timer);
  }, [isPlaying, lightboxIndex, filteredPhotos.length]);

  function navigateLightbox(direction: number) {
    if (lightboxIndex === null || filteredPhotos.length === 0) return;
    setLightboxIndex((prev) => {
      if (prev === null) return null;
      let next = prev + direction;
      if (next < 0) next = filteredPhotos.length - 1;
      if (next >= filteredPhotos.length) next = 0;
      return next;
    });
  }

  const activePhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  return (
    <section className="public-section">
      <EditableText as="div" id="photos.kicker" className="section-kicker" style={{ marginBottom: 14 }} />
      <EditableText as="h1" id="photos.title" className="page-title" style={{ marginBottom: 24 }} />

      {/* Folders (Groups) Navigation Tabs */}
      <div style={{ marginBottom: 16 }}>
        <div className="field-label" style={{ marginBottom: 8 }}>Папки / Альбомы</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {allGroups.map((group) => {
            const count = group === "Все" 
              ? publicPhotos.length
              : publicPhotos.filter((p) => p.group === group).length;
            return (
              <button
                key={group}
                className={`tag-chip ${selectedGroup === group ? "active" : ""}`}
                style={{
                  background: selectedGroup === group ? "var(--clay)" : "var(--sand)",
                  color: selectedGroup === group ? "#fff" : "var(--ink)",
                  cursor: "pointer",
                  border: "1px solid var(--line2)",
                  padding: "6px 12px",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 13,
                  transition: "all 0.2s ease"
                }}
                onClick={() => {
                  setSelectedGroup(group);
                  setLightboxIndex(null);
                }}
              >
                {group}
                <span 
                  className="mono" 
                  style={{ 
                    fontSize: 10, 
                    opacity: 0.7, 
                    marginLeft: 6,
                    color: selectedGroup === group ? "#fff" : "var(--muted)"
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scientific Topics Filter */}
      {state.topics.length > 0 && (
        <div style={{ marginBottom: 26 }}>
          <div className="field-label" style={{ marginBottom: 8 }}>Научные темы</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button
              className={`tag-chip ${selectedTopic === "Все" ? "active" : ""}`}
              style={{
                background: selectedTopic === "Все" ? "var(--forest)" : "var(--sand)",
                color: selectedTopic === "Все" ? "#fff" : "var(--ink)",
                cursor: "pointer",
                border: "1px solid var(--line2)",
                padding: "4px 10px",
                borderRadius: 12,
                fontSize: 12,
                transition: "all 0.2s ease"
              }}
              onClick={() => setSelectedTopic("Все")}
            >
              Все темы
            </button>
            {state.topics.map((topic) => {
              const topicPhotos = publicPhotos.filter((p) => p.relatedTopicIds?.includes(topic.id));
              if (topicPhotos.length === 0) return null; // Only show topics that have photos

              return (
                <button
                  key={topic.id}
                  className={`tag-chip ${selectedTopic === topic.id ? "active" : ""}`}
                  style={{
                    background: selectedTopic === topic.id ? "var(--forest)" : "var(--sand)",
                    color: selectedTopic === topic.id ? "#fff" : "var(--ink)",
                    cursor: "pointer",
                    border: "1px solid var(--line2)",
                    padding: "4px 10px",
                    borderRadius: 12,
                    fontSize: 12,
                    transition: "all 0.2s ease"
                  }}
                  onClick={() => setSelectedTopic(topic.id)}
                >
                  {topic.name}
                  <span style={{ fontSize: 9.5, marginLeft: 4, opacity: 0.7 }}>({topicPhotos.length})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>
          Нет фотографий, соответствующих выбранным фильтрам
        </div>
      ) : (
        <div className="disc-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
          {filteredPhotos.map((item, index) => (
            <button
              key={item.id}
              className="preview-card"
              onClick={() => setLightboxIndex(index)}
              style={{
                textAlign: "left",
                width: "100%",
                border: "1px solid var(--line)",
                background: "var(--paper)",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              {/* Фото / заглушка — фиксированное соотношение сторон */}
              <div
                className="photo-card-hover"
                style={{
                  aspectRatio: "4 / 3",
                  flexShrink: 0,
                  background: item.imagePath
                    ? `url(${item.imagePath}) center/cover no-repeat`
                    : `repeating-linear-gradient(135deg, ${item.tint}, ${item.tint} 13px, rgba(255,255,255,.16) 13px, rgba(255,255,255,.16) 26px)`,
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 10,
                  overflow: "hidden",
                }}
              >
                <span className="type-chip" style={{ background: "rgba(20,18,16,.62)", color: "#fff" }}>
                  {item.otype}
                </span>
              </div>

              {/* Текстовый блок — занимает оставшуюся высоту */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  padding: "12px 14px 14px",
                }}
              >
                <div
                  className="panel-title clamp-2"
                  style={{ fontSize: 16, lineHeight: 1.35, marginBottom: "auto", paddingBottom: 8 }}
                >
                  {item.title}
                </div>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 8 }}>
                  {[item.region, item.year].filter(Boolean).join(" · ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Slideshow Modal Overlay */}
      {lightboxIndex !== null && activePhoto && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10, 8, 6, 0.97)",
            backdropFilter: "blur(10px)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff"
          }}
          onClick={() => {
            setLightboxIndex(null);
            setIsPlaying(false);
          }}
        >
          {/* Close control top right */}
          <button
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 44,
              height: 44,
              fontSize: 24,
              fontWeight: 300,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1010,
              transition: "background 0.2s"
            }}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
              setIsPlaying(false);
            }}
            title="Закрыть (Esc)"
          >
            ×
          </button>

          {/* Slideshow and indicator controls top left */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              display: "flex",
              alignItems: "center",
              gap: 12,
              zIndex: 1010
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span style={{ fontSize: 14, fontFamily: "monospace", opacity: 0.8 }}>
              {lightboxIndex + 1} / {filteredPhotos.length}
            </span>
            <button
              style={{
                background: isPlaying ? "var(--clay)" : "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "none",
                borderRadius: 16,
                padding: "6px 14px",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "background 0.2s"
              }}
              onClick={() => setIsPlaying(!isPlaying)}
              title="Слайдшоу (Пробел)"
            >
              <span>{isPlaying ? "⏸ Пауза" : "▶ Слайдшоу"}</span>
            </button>
          </div>

          {/* Left Arrow */}
          <button
            style={{
              position: "absolute",
              left: 20,
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 50,
              height: 50,
              fontSize: 22,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1010,
              transition: "background 0.2s"
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigateLightbox(-1);
            }}
            title="Назад (←)"
          >
            ‹
          </button>

          {/* Central image or fallback */}
          <div
            style={{
              maxWidth: "85%",
              maxHeight: "70vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {activePhoto.imagePath ? (
              <img
                src={activePhoto.imagePath}
                alt={activePhoto.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                  borderRadius: 6,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)"
                }}
              />
            ) : (
              <div
                style={{
                  width: 500,
                  maxWidth: "100%",
                  aspectRatio: "4 / 3",
                  borderRadius: 8,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: `repeating-linear-gradient(135deg, ${activePhoto.tint}, ${activePhoto.tint} 14px, rgba(255,255,255,.16) 14px, rgba(255,255,255,.16) 28px)`
                }}
              />
            )}
          </div>

          {/* Right Arrow */}
          <button
            style={{
              position: "absolute",
              right: 20,
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 50,
              height: 50,
              fontSize: 22,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1010,
              transition: "background 0.2s"
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigateLightbox(1);
            }}
            title="Вперед (→)"
          >
            ›
          </button>

          {/* Translucent bottom info sheet */}
          <div
            style={{
              position: "absolute",
              bottom: 30,
              maxWidth: "600px",
              width: "90%",
              background: "rgba(30, 26, 22, 0.8)",
              backdropFilter: "blur(12px)",
              padding: "16px 24px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              textAlign: "center",
              zIndex: 1010
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, margin: "0 0 6px 0", fontWeight: 400, color: "#fff" }}>
              {activePhoto.title}
            </h3>
            <div 
              style={{ 
                fontSize: 13, 
                color: "rgba(255,255,255,0.7)", 
                fontFamily: "monospace",
                display: "flex",
                flexWrap: "wrap",
                gap: "8px 14px",
                justifyContent: "center"
              }}
            >
              {activePhoto.otype && <span>Тип: <b>{activePhoto.otype}</b></span>}
              {activePhoto.year && <span>Год: <b>{activePhoto.year}</b></span>}
              {activePhoto.region && <span>Регион: <b>{activePhoto.region}</b></span>}
              {activePhoto.author && <span>Автор: <b>{activePhoto.author}</b></span>}
              {activePhoto.group && <span>Альбом: <b>{activePhoto.group}</b></span>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
