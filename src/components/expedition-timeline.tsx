"use client";

import { useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";
import type { MapPlace } from "@/lib/portal-types";

type Props = {
  places: MapPlace[];
  activeId: string | null;
  onSelect: (id: string) => void;
  playing: boolean;
  onTogglePlay: () => void;
};

function placeYear(p: MapPlace) {
  return parseInt(p.year, 10) || 0;
}

export function ExpeditionTimeline({ places, activeId, onSelect, playing, onTogglePlay }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  const sorted = [...places].sort((a, b) => placeYear(a) - placeYear(b));

  // Прокрутка к активному узлу
  useEffect(() => {
    if (!activeId || !trackRef.current) return;
    const node = trackRef.current.querySelector<HTMLElement>(`[data-place="${activeId}"]`);
    node?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeId]);

  if (sorted.length === 0) return null;

  const activeIndex = sorted.findIndex((p) => p.id === activeId);
  const progress = activeIndex >= 0 ? (activeIndex / Math.max(1, sorted.length - 1)) * 100 : 0;

  return (
    <div className="exp-timeline">
      <div className="exp-timeline-head">
        <button
          className="exp-play"
          onClick={onTogglePlay}
          aria-label={playing ? "Пауза" : "Проиграть маршрут"}
        >
          {playing ? <Pause size={16} strokeWidth={2.2} /> : <Play size={16} strokeWidth={2.2} />}
          <span>{playing ? "Пауза" : "Проиграть маршрут"}</span>
        </button>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          {sorted.length} точек · {placeYear(sorted[0])}–{placeYear(sorted[sorted.length - 1])}
        </div>
      </div>

      <div className="exp-timeline-track" ref={trackRef}>
        <div className="exp-timeline-line">
          <div className="exp-timeline-line-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="exp-timeline-nodes">
          {sorted.map((place) => {
            const active = place.id === activeId;
            return (
              <button
                key={place.id}
                data-place={place.id}
                className={`exp-node ${active ? "active" : ""} exp-node-${place.era}`}
                onClick={() => onSelect(place.id)}
              >
                <span className="exp-node-year">
                  {place.year}
                  {place.yearEnd ? `–${place.yearEnd}` : ""}
                </span>
                <span className="exp-node-dot" />
                <span className="exp-node-title">{place.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
