"use client";

import { useEffect, useState } from "react";
import { Mail, Trash2, Check } from "lucide-react";
import type { ContactMessage } from "@/lib/portal-types";

export function AdminMessagesView() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { messages: ContactMessage[] };
      setMessages(data.messages);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleRead(item: ContactMessage) {
    await fetch(`/api/messages/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: !item.isRead }),
    });
    setMessages((m) => m.map((x) => (x.id === item.id ? { ...x, isRead: !x.isRead } : x)));
  }

  async function remove(id: string) {
    if (!window.confirm("Удалить сообщение?")) return;
    await fetch(`/api/messages/${id}`, { method: "DELETE" });
    setMessages((m) => m.filter((x) => x.id !== id));
  }

  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div className="route">
      <div className="dashboard-top" style={{ alignItems: "center" }}>
        <div>
          <div className="section-kicker">Обратная связь</div>
          <h1 className="page-title" style={{ margin: 0 }}>Сообщения</h1>
        </div>
        <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
          {messages.length} всего · {unread} непрочитанных
        </div>
      </div>

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        {loading && <div className="empty-state">Загрузка...</div>}
        {error && <div className="empty-state">Не удалось загрузить сообщения.</div>}
        {!loading && !error && messages.length === 0 && (
          <div className="empty-state">
            <Mail size={28} strokeWidth={1.5} style={{ color: "var(--muted2)" }} />
            <div style={{ marginTop: 8 }}>Сообщений пока нет.</div>
          </div>
        )}

        {messages.map((item) => (
          <div
            key={item.id}
            className="discipline-card"
            style={{
              padding: "18px 22px",
              borderLeft: item.isRead ? "3px solid var(--line)" : "3px solid var(--clay)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {item.name}
                  {!item.isRead && (
                    <span className="mono" style={{ fontSize: 10, color: "var(--clay)", marginLeft: 8 }}>● новое</span>
                  )}
                </div>
                <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  {item.email || "без email"} · {new Date(item.createdAt).toLocaleString("ru-RU")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button className="icon-button" title={item.isRead ? "Отметить непрочитанным" : "Прочитано"} onClick={() => toggleRead(item)}>
                  <Check size={15} strokeWidth={2} />
                </button>
                <button className="icon-button" title="Удалить" onClick={() => remove(item.id)} style={{ color: "#c0392b" }}>
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--forest2)", margin: "12px 0 0", whiteSpace: "pre-wrap" }}>
              {item.body}
            </p>
            {item.email && (
              <a
                href={`mailto:${item.email}`}
                className="secondary-button"
                style={{ textDecoration: "none", display: "inline-block", marginTop: 12, fontSize: 13 }}
              >
                Ответить по email
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
