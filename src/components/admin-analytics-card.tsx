"use client";

import { useEffect, useState } from "react";

type Analytics = {
  total: number;
  last30: number;
  last7: number;
  topPaths: Array<{ path: string; count: number }>;
  daily: Array<{ day: string; count: number }>;
};

const PATH_LABELS: Record<string, string> = {
  "/": "Главная",
  "/about": "Обо мне",
  "/students": "Студентам",
  "/research": "Научная работа",
  "/publications": "Публикации",
  "/photos": "Фотоархив",
  "/archive": "Архив материалов",
  "/library": "Библиотека",
  "/contacts": "Контакты",
  "/search": "Поиск",
};

function labelFor(path: string) {
  return PATH_LABELS[path] || path;
}

export function AdminAnalyticsCard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json: { analytics: Analytics }) => setData(json.analytics))
      .catch(() => setError(true));
  }, []);

  const maxDaily = data ? Math.max(1, ...data.daily.map((d) => d.count)) : 1;

  return (
    <section className="panel template-list">
      <h3 className="panel-title" style={{ marginBottom: 6 }}>
        Посещаемость
      </h3>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
        Просмотры публичных страниц. Данные собираются на самом сайте, без внешних сервисов и cookie.
      </p>

      {error && (
        <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Статистика пока недоступна.</div>
      )}

      {data && (
        <>
          <div style={{ display: "flex", gap: 18, marginBottom: 16 }}>
            <div>
              <div className="serif-title" style={{ fontSize: 26, fontWeight: 600 }}>{data.last7}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>за 7 дней</div>
            </div>
            <div>
              <div className="serif-title" style={{ fontSize: 26, fontWeight: 600 }}>{data.last30}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>за 30 дней</div>
            </div>
            <div>
              <div className="serif-title" style={{ fontSize: 26, fontWeight: 600 }}>{data.total}</div>
              <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>всего</div>
            </div>
          </div>

          {data.daily.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 44, marginBottom: 16 }}>
              {data.daily.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day}: ${d.count}`}
                  style={{
                    flex: 1,
                    height: `${(d.count / maxDaily) * 100}%`,
                    minHeight: 2,
                    background: "var(--clay2)",
                    borderRadius: 2,
                  }}
                />
              ))}
            </div>
          )}

          {data.topPaths.length > 0 && (
            <div>
              <div className="field-label" style={{ marginBottom: 8 }}>Популярные страницы</div>
              {data.topPaths.map((p) => (
                <div
                  key={p.path}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid var(--line2)" }}
                >
                  <span style={{ color: "var(--forest2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {labelFor(p.path)}
                  </span>
                  <span className="mono" style={{ color: "var(--muted)", flexShrink: 0, marginLeft: 10 }}>{p.count}</span>
                </div>
              ))}
            </div>
          )}

          {data.total === 0 && (
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
              Пока нет данных — статистика появится после первых посещений сайта.
            </div>
          )}
        </>
      )}
    </section>
  );
}
