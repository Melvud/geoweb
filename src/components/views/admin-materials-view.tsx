"use client";

import { usePortal } from "@/components/portal-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { disciplines } from "@/lib/portal-seed";
import { typeShort, typeTint, statusMeta, materialTypeOrder } from "@/lib/portal-utils";
import { Search, Pencil, X } from "lucide-react";

export function AdminMaterialsView() {
  const router = useRouter();
  const {
    state,
    setFilter,
    resetFilter,
    cycleStatus,
    deleteMaterial,
    editItem,
  } = usePortal();

  const filteredMaterials = state.materials.filter((item) => {
    const haystack = `${item.title} ${item.discipline} ${item.desc} ${item.tags.join(" ")}`.toLowerCase();
    if (state.filter.q && !haystack.includes(state.filter.q.toLowerCase())) return false;
    if (state.filter.type !== "all" && item.mtype !== state.filter.type) return false;
    if (state.filter.status !== "all" && item.status !== state.filter.status) return false;
    if (state.filter.year !== "all" && item.year !== state.filter.year) return false;
    return true;
  });

  function go(href: string) {
    router.push(href);
  }

  const distinctYears = [...new Set(state.materials.map((item) => item.year))];

  return (
    <div className="route">
      <div className="dashboard-top" style={{ alignItems: "center" }}>
        <div>
          <div className="section-kicker">Хранилище</div>
          <h1 className="page-title">Все материалы</h1>
        </div>
        <button className="primary-button" onClick={() => go("/admin/add")}>
          + Добавить
        </button>
      </div>

      <div className="form-grid" style={{ marginBottom: 18 }}>
        <div className="search-wrap-wide">
          <span className="search-icon"><Search size={15} strokeWidth={2} /></span>
          <input
            className="text-input"
            style={{ paddingLeft: 34 }}
            placeholder="Поиск по названию, дисциплине, тегам"
            value={state.filter.q}
            onChange={(event) => setFilter("q", event.target.value)}
          />
        </div>
        <div className="form-grid" style={{ gap: 10 }}>
          <select
            className="select-input"
            value={state.filter.type}
            onChange={(event) => setFilter("type", event.target.value)}
          >
            <option value="all">Все типы</option>
            {materialTypeOrder.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            className="select-input"
            value={state.filter.status}
            onChange={(event) => setFilter("status", event.target.value)}
          >
            <option value="all">Все статусы</option>
            <option value="published">Опубликовано</option>
            <option value="draft">Черновик</option>
            <option value="hidden">Скрыто</option>
          </select>
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: 24 }}>
        <select
          className="select-input"
          value={state.filter.discipline}
          onChange={(event) => setFilter("discipline", event.target.value)}
        >
          <option value="all">Все дисциплины</option>
          {disciplines.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 10 }}>
          <select
            className="select-input"
            value={state.filter.year}
            onChange={(event) => setFilter("year", event.target.value)}
          >
            <option value="all">Все годы</option>
            {distinctYears.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button className="secondary-button" onClick={resetFilter}>
            Сбросить <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <section className="panel" style={{ overflow: "visible" }}>
        {filteredMaterials.map((item) => {
          const tint = typeTint(item.mtype);
          const status = statusMeta(item.status);
          return (
            <div
              key={item.id}
              className="archive-row"
              style={{ gridTemplateColumns: "1fr 150px 70px 130px 96px" }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <span
                    className="type-chip"
                    style={{ background: tint[0], color: tint[1] }}
                  >
                    {typeShort(item.mtype)}
                  </span>
                  <strong>{item.title}</strong>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                  {item.discipline} · {item.tags.slice(0, 3).join(" · ")}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                {item.mtype}
              </div>
              <div className="mono" style={{ fontSize: 12 }}>{item.year}</div>
              <button
                className="status-chip"
                style={{ background: status[1], color: status[2], justifySelf: "start" }}
                onClick={() => cycleStatus(item.id)}
              >
                {status[0]}
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <Link
                  href={`/admin/add?edit=${item.id}&type=learning`}
                  className="icon-button"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Pencil size={13} strokeWidth={1.8} />
                </Link>
                <button className="icon-button" onClick={() => deleteMaterial(item.id)}>
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
