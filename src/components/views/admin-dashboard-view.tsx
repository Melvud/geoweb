"use client";

import { usePortal } from "@/components/portal-provider";
import { useRouter } from "next/navigation";
import { typeShort, typeTint, statusMeta } from "@/lib/portal-utils";
import { photoGroups } from "@/lib/portal-seed";
import type { AddType } from "@/lib/portal-types";
import { AdminBackupCard } from "@/components/admin-backup-card";
import { AdminAnalyticsCard } from "@/components/admin-analytics-card";

function templatesForAdmin() {
  return [
    {
      name: "Лекция (PDF + слайды)",
      kind: "учебное",
      type: "learning" as AddType,
      values: {
        title: "Лекция по исторической геологии",
        discipline: "Историческая геология",
        mtype: "Лекция",
        year: "2026",
      },
    },
    {
      name: "Презентация для семинара",
      kind: "учебное",
      type: "learning" as AddType,
      values: {
        title: "Презентация по палеонтологии",
        discipline: "Палеонтология",
        mtype: "Презентация",
        year: "2026",
      },
    },
    {
      name: "Статья в журнал",
      kind: "публикация",
      type: "publication" as AddType,
      values: {
        title: "Новая статья по стратиграфии",
        ptype: "Статья",
        year: "2026",
      },
    },
  ];
}

export function AdminDashboardView() {
  const router = useRouter();
  const { state, setAddType, useTemplate, openDetail } = usePortal();

  const totalCount =
    state.materials.length +
    state.publications.length +
    state.photos.length +
    state.topics.length +
    state.archiveItems.length;
  const recentMaterials = state.materials.slice(0, 5);

  const photoGroupCounts = photoGroups
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
      <div className="dashboard-top">
        <div>
          <div className="section-kicker">Панель управления</div>
          <h1 className="page-title">Добрый день, Владимир Владимирович</h1>
          <p className="page-copy">
            В хранилище <b style={{ color: "var(--ink)" }}>{totalCount}</b> материалов.
            Публичная часть обновляется автоматически при публикации.
          </p>
        </div>
        <button className="primary-button" onClick={() => go("/admin/add")}>
          + Быстрое добавление
        </button>
      </div>

      <div className="stats-grid">
        {[
          {
            label: "Учебные материалы",
            value: state.materials.length,
            sub: `${state.materials.filter((item) => item.status === "published").length} опубликовано`,
            dot: "#c08a63",
            href: "/admin/materials",
          },
          {
            label: "Публикации",
            value: state.publications.length,
            sub: `${state.publications.filter((p) => p.featured).length} избранных`,
            dot: "#485548",
            href: "/admin/publications",
          },
          {
            label: "Фотографии",
            value: state.photos.length,
            sub: `${photoGroupCounts.length} коллекций`,
            dot: "#7f6a92",
            href: "/admin/photos",
          },
          {
            label: "Научные темы",
            value: state.topics.length,
            sub: "объединяют материалы",
            dot: "#3a6a44",
            href: "/admin/topics",
          },
          {
            label: "Архивные материалы",
            value: state.archiveItems.length,
            sub: `${state.archiveItems.filter((a) => a.access === "open").length} открытых`,
            dot: "#46566b",
            href: "/admin/archive",
          },
          {
            label: "Всего в хранилище",
            value: totalCount,
            sub: `${state.materials.filter((item) => item.status === "draft").length} черновиков`,
            dot: "#8c8678",
            href: "/admin",
          },
        ].map((item) => (
          <button
            key={item.label}
            className="stat-card"
            onClick={() => go(item.href)}
            style={{ textAlign: "left", cursor: "pointer" }}
          >
            <div className="stat-card-header">
              <span className="stat-label">{item.label}</span>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 2,
                  background: item.dot,
                }}
              />
            </div>
            <div className="stat-value">{item.value}</div>
            <div className="stat-sub">{item.sub}</div>
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Недавние материалы</h2>
            <button className="panel-link" onClick={() => go("/admin/materials")}>
              все →
            </button>
          </div>
          {recentMaterials.map((item) => {
            const tint = typeTint(item.mtype);
            const status = statusMeta(item.status);
            return (
              <button
                key={item.id}
                className="list-row"
                onClick={() => go(`/admin/add?edit=${item.id}&type=learning`)}
              >
                <span
                  className="type-chip"
                  style={{ background: tint[0], color: tint[1] }}
                >
                  {typeShort(item.mtype)}
                </span>
                <span className="list-row-body">
                  <span className="list-row-title">{item.title}</span>
                  <br />
                  <span className="list-row-meta">
                    {item.discipline} · {item.year}
                  </span>
                </span>
                <span
                  className="status-chip"
                  style={{ background: status[1], color: status[2] }}
                >
                  {status[0]}
                </span>
              </button>
            );
          })}
        </section>

        <div className="side-stack">
          <section className="panel template-list">
            <h3 className="panel-title" style={{ marginBottom: 14 }}>
              Шаблоны
            </h3>
            {templatesForAdmin().map((item) => (
              <button
                key={item.name}
                className="template-button"
                onClick={() => {
                  setAddType(item.type);
                  useTemplate(item.type, item.values);
                  go("/admin/add");
                }}
              >
                <span className="mono" style={{ fontSize: 11, color: "var(--clay)" }}>
                  ↳
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, textAlign: "left" }}>
                  {item.name}
                </span>
                <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                  {item.kind}
                </span>
              </button>
            ))}
          </section>

          <AdminAnalyticsCard />

          <AdminBackupCard />
        </div>
      </div>
    </div>
  );
}
