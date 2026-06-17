"use client";

import { usePortal } from "@/components/portal-provider";

export function PublicAboutView() {
  const { state } = usePortal();

  return (
    <section className="public-section slim">
      <div className="section-kicker" style={{ marginBottom: 16 }}>
        {state.pages.about.kicker}
      </div>
      <h1 className="page-title" style={{ marginBottom: 28 }}>
        {state.pages.about.title}
      </h1>
      {state.pages.about.portraitPath ? (
        <div
          className="hero-portrait"
          style={{
            marginBottom: 24,
            maxWidth: 360,
            backgroundImage: `url(${state.pages.about.portraitPath})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : null}
      <p className="hero-copy" style={{ marginBottom: 18, maxWidth: "none" }}>
        {state.pages.about.introOne}
      </p>
      <p className="hero-copy" style={{ marginBottom: 40, maxWidth: "none" }}>
        {state.pages.about.introTwo}
      </p>
      <div className="topics-grid">
        <div className="discipline-card">
          <h3 className="panel-title" style={{ marginBottom: 12 }}>
            {state.pages.about.interestsTitle}
          </h3>
          <div style={{ display: "grid", gap: 8, color: "var(--forest2)", fontSize: 14 }}>
            {state.pages.about.interests.map((item) => (
              <div key={item}>· {item}</div>
            ))}
          </div>
        </div>
        <div className="discipline-card">
          <h3 className="panel-title" style={{ marginBottom: 12 }}>
            {state.pages.about.contactsTitle}
          </h3>
          <div className="mono" style={{ display: "grid", gap: 8, fontSize: 14, color: "var(--forest2)" }}>
            <div>{state.pages.about.email}</div>
            <div>{state.pages.about.department}</div>
            <div>{state.pages.about.phone}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
