"use client";

import { usePortal } from "@/components/portal-provider";
import { EditableText } from "@/components/editable-text";
import { ContactForm } from "@/components/contact-form";

export default function ContactsPage() {
  const { state } = usePortal();
  const about = state.pages.about;

  return (
    <section className="public-section slim">
      <EditableText as="div" id="contacts.kicker" className="section-kicker" style={{ marginBottom: 14 }} />
      <EditableText as="h1" id="contacts.title" className="page-title" style={{ marginBottom: 36 }} />

      <div style={{ display: "grid", gap: 20, maxWidth: 560 }}>
        <div className="discipline-card" style={{ padding: "24px 28px" }}>
          <div className="section-kicker" style={{ marginBottom: 16 }}>
            {about.contactsTitle || "Контактная информация"}
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {about.email && (
              <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)", width: 90, flexShrink: 0 }}>
                  Email
                </span>
                <a
                  href={`mailto:${about.email}`}
                  style={{ color: "var(--clay)", textDecoration: "underline", fontWeight: 500, fontSize: 15 }}
                >
                  {about.email}
                </a>
              </div>
            )}
            {about.phone && (
              <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)", width: 90, flexShrink: 0 }}>
                  Телефон
                </span>
                <span style={{ fontSize: 15 }}>{about.phone}</span>
              </div>
            )}
            {about.department && (
              <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)", width: 90, flexShrink: 0 }}>
                  Подразделение
                </span>
                <span style={{ fontSize: 15, color: "var(--forest2)" }}>{about.department}</span>
              </div>
            )}
          </div>
        </div>

        <div className="discipline-card" style={{ padding: "24px 28px" }}>
          <div className="section-kicker" style={{ marginBottom: 16 }}>
            О странице
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--forest2)", margin: 0 }}>
            {about.title} — {about.introOne}
          </p>
        </div>

        <div
          style={{
            padding: "18px 24px",
            borderRadius: 12,
            border: "1px dashed var(--line)",
            fontSize: 13,
            color: "var(--muted)",
            lineHeight: 1.6,
          }}
        >
          По вопросам сотрудничества, рецензирования и научной экспертизы —
          обращайтесь по электронной почте или через форму ниже.
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
