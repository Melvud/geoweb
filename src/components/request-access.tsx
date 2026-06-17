"use client";

import { useState } from "react";
import { Lock, Send } from "lucide-react";

// Кнопка/форма запроса доступа к материалу с уровнем «По запросу».
// Запрос уходит в инбокс «Сообщения» (через /api/contact).
export function RequestAccess({ itemTitle, compact = false }: { itemTitle: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) {
      setError("Укажите имя");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const body = `Запрос доступа к материалу: «${itemTitle}».${note.trim() ? ` Комментарий: ${note.trim()}` : ""}`;
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, body }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Ошибка");
      setStatus("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div style={{ padding: "14px 18px", borderRadius: 12, background: "var(--sand)", border: "1px solid var(--line)", fontSize: 14, color: "var(--forest2)" }}>
        Запрос отправлен. Профессор рассмотрит его и свяжется с вами.
      </div>
    );
  }

  return (
    <div style={{ padding: compact ? "14px 16px" : "18px 20px", borderRadius: 12, background: "var(--sand)", border: "1px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: open ? 14 : 0 }}>
        <Lock size={16} strokeWidth={1.9} style={{ color: "var(--clay)", flexShrink: 0 }} />
        <span style={{ fontSize: 14, color: "var(--forest2)", flex: 1 }}>
          Материал доступен по запросу.
        </span>
        {!open && (
          <button className="primary-button" style={{ padding: "9px 16px", fontSize: 13 }} onClick={() => setOpen(true)}>
            Запросить доступ
          </button>
        )}
      </div>

      {open && (
        <div style={{ display: "grid", gap: 10 }}>
          <div className="form-grid">
            <div>
              <label className="field-label">Имя</label>
              <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input className="text-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label">Комментарий (опц.)</label>
            <textarea className="text-area" style={{ minHeight: 60 }} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {status === "error" && <div style={{ fontSize: 13, color: "#c0392b" }}>{error}</div>}
          <div>
            <button className="primary-button" onClick={submit} disabled={status === "sending"} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <Send size={14} strokeWidth={2} />
              {status === "sending" ? "Отправляем..." : "Отправить запрос"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
