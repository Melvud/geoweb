"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { usePortal } from "@/components/portal-provider";
import { EditableText } from "@/components/editable-text";

export function ContactForm() {
  const { state } = usePortal();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit() {
    if (state.editMode) return;
    if (!name.trim() || !body.trim()) {
      setError("Заполните имя и сообщение");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, body, website }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Ошибка отправки");
      setStatus("sent");
      setName("");
      setEmail("");
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="discipline-card" style={{ padding: "24px 28px" }}>
        <div className="panel-title" style={{ fontSize: 18, marginBottom: 6 }}>Спасибо!</div>
        <p style={{ fontSize: 14, color: "var(--forest2)", margin: 0 }}>
          Ваше сообщение отправлено. Я свяжусь с вами при необходимости.
        </p>
      </div>
    );
  }

  return (
    <div className="discipline-card" style={{ padding: "24px 28px" }}>
      <EditableText as="div" id="contacts.formTitle" className="section-kicker" style={{ marginBottom: 4 }} />
      <EditableText as="p" id="contacts.formNote" className="page-copy" style={{ margin: "0 0 16px", fontSize: 13 }} />

      <div className="form-grid" style={{ marginBottom: 12 }}>
        <div>
          <label className="field-label">Имя</label>
          <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Email (опц.)</label>
          <input className="text-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="field-label">Сообщение</label>
        <textarea className="text-area" value={body} onChange={(e) => setBody(e.target.value)} />
      </div>

      {/* Honeypot — скрыто от людей, видно ботам */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        aria-hidden
      />

      {status === "error" && (
        <div style={{ fontSize: 13, color: "#c0392b", marginBottom: 12 }}>{error}</div>
      )}

      <button
        className="primary-button"
        onClick={submit}
        disabled={status === "sending"}
        style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
      >
        <Send size={14} strokeWidth={2} />
        {status === "sending" ? "Отправляем..." : "Отправить"}
      </button>
    </div>
  );
}
