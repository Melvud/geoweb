"use client";

import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { MapPlace } from "@/lib/portal-types";

type Props = {
  places: MapPlace[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  editable?: boolean;
  draft?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  geologyEnabled?: boolean;
  geologySelection?: { lat: number; lng: number } | null;
  onGeologyPick?: (lat: number, lng: number) => void;
  height?: number | string;
};

function markerHtml(place: MapPlace, active: boolean) {
  return `<span class="exp-marker exp-${place.era}${active ? " active" : ""}"><span class="exp-marker-dot"></span></span>`;
}

export function ExpeditionMap({
  places,
  activeId,
  onSelect,
  editable = false,
  draft = null,
  onPick,
  geologyEnabled = false,
  geologySelection = null,
  onGeologyPick,
  height = 460,
}: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const draftRef = useRef<L.Marker | null>(null);
  const geologyLayerRef = useRef<L.TileLayer | null>(null);
  const geologySelectionRef = useRef<L.CircleMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  const onPickRef = useRef(onPick);
  const onGeologyPickRef = useRef(onGeologyPick);
  const geologyEnabledRef = useRef(geologyEnabled);
  onSelectRef.current = onSelect;
  onPickRef.current = onPick;
  onGeologyPickRef.current = onGeologyPick;
  geologyEnabledRef.current = geologyEnabled;

  // Инициализация карты (один раз)
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;

    const map = L.map(elRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      worldCopyJump: true,
      maxZoom: 11,
      minZoom: 3,
    }).setView([54.2, 49], 5);

    // Убираем стандартный префикс Leaflet (там флаг) — оставляем только нейтральный кредит тайлов
    map.attributionControl.setPrefix(false);

    // Векторный стиль OpenFreeMap позволяет убрать границы отдельными слоями,
    // сохранив дороги, города, рельеф и гидрографию.
    const baseLayer = L.maplibreGL({
      style: "https://tiles.openfreemap.org/styles/liberty",
      attributionControl: false,
    }).addTo(map);

    const vectorMap = baseLayer.getMaplibreMap();
    vectorMap.on("style.load", () => {
      ["boundary_3", "boundary_2", "boundary_disputed"].forEach((layerId) => {
        if (vectorMap.getLayer(layerId)) vectorMap.removeLayer(layerId);
      });
    });

    map.attributionControl.addAttribution(
      '<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    );

    map.createPane("geology-pane");
    const geologyPane = map.getPane("geology-pane");
    if (geologyPane) geologyPane.style.zIndex = "450";

    map.on("click", (event: L.LeafletMouseEvent) => {
      if (editable) {
        onPickRef.current?.(event.latlng.lat, event.latlng.lng);
      } else if (geologyEnabledRef.current) {
        onGeologyPickRef.current?.(event.latlng.lat, event.latlng.lng);
      }
    });

    mapRef.current = map;
    // Корректный размер после монтирования в гриде
    const resizeTimer = window.setTimeout(() => {
      if (mapRef.current === map && map.getContainer().isConnected && map.getPane("mapPane")) {
        map.invalidateSize({ pan: false });
      }
    }, 80);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      if (mapRef.current === map) mapRef.current = null;
      geologyLayerRef.current = null;
      markersRef.current.clear();
    };
  }, [editable]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (geologyEnabled && !geologyLayerRef.current) {
      geologyLayerRef.current = L.tileLayer("https://tiles.macrostrat.org/carto/{z}/{x}/{y}.png", {
        pane: "geology-pane",
        opacity: 0.7,
        maxZoom: 11,
        attribution: 'Geology: <a href="https://macrostrat.org/" target="_blank" rel="noopener noreferrer">Macrostrat</a>',
      }).addTo(map);
    } else if (!geologyEnabled && geologyLayerRef.current) {
      geologyLayerRef.current.remove();
      geologyLayerRef.current = null;
    }
  }, [geologyEnabled]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    geologySelectionRef.current?.remove();
    geologySelectionRef.current = null;

    if (geologyEnabled && geologySelection) {
      geologySelectionRef.current = L.circleMarker([geologySelection.lat, geologySelection.lng], {
        pane: "markerPane",
        radius: 7,
        color: "#fff",
        weight: 3,
        fillColor: "#536171",
        fillOpacity: 1,
        interactive: false,
      }).addTo(map);
    }
  }, [geologyEnabled, geologySelection?.lat, geologySelection?.lng]);

  // Маркеры мест
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    places.forEach((place) => {
      if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return;
      const marker = L.marker([place.lat, place.lng], {
        icon: L.divIcon({
          className: "exp-marker-wrap",
          html: markerHtml(place, place.id === activeId),
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
        title: place.title,
        riseOnHover: true,
      });
      marker.bindTooltip(place.title, {
        permanent: true,
        direction: "right",
        offset: [12, 0],
        className: "exp-tip",
      });
      marker.on("click", () => onSelectRef.current?.(place.id));
      marker.addTo(map);
      markersRef.current.set(place.id, marker);
    });

    // Подгоняем вид под все точки (только при первой отрисовке набора)
    if (places.length > 0 && !activeId) {
      const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds.pad(0.3), { animate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places.map((p) => `${p.id}:${p.lat}:${p.lng}:${p.era}`).join("|")]);

  // Подсветка активного места + плавный перелёт
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker, id) => {
      const place = places.find((p) => p.id === id);
      if (!place) return;
      marker.setIcon(
        L.divIcon({
          className: "exp-marker-wrap",
          html: markerHtml(place, id === activeId),
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
      );
    });

    if (activeId) {
      const place = places.find((p) => p.id === activeId);
      if (place) {
        map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 8), {
          duration: 1.1,
          easeLinearity: 0.25,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Черновой маркер (выбор координат в админке)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (draftRef.current) {
      draftRef.current.remove();
      draftRef.current = null;
    }
    if (draft && Number.isFinite(draft.lat) && Number.isFinite(draft.lng)) {
      draftRef.current = L.marker([draft.lat, draft.lng], {
        icon: L.divIcon({
          className: "exp-marker-wrap",
          html: `<span class="exp-marker exp-draft active"><span class="exp-marker-dot"></span></span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
      }).addTo(map);
    }
  }, [draft?.lat, draft?.lng]);

  return (
    <div
      ref={elRef}
      className={`exp-map${geologyEnabled ? " geology-active" : ""}`}
      style={{ height, width: "100%", borderRadius: 16, overflow: "hidden", border: "1px solid var(--line)" }}
    />
  );
}
