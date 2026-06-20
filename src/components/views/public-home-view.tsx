"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/components/portal-provider";
import { ArrowRight } from "lucide-react";
import { disciplines } from "@/lib/portal-seed";
import { isOpenMaterial, isListedPublic } from "@/lib/portal-utils";
import { EditableText } from "@/components/editable-text";
import { ExpeditionsExplorer } from "@/components/expeditions-explorer";

export function PublicHomeView() {
  const router = useRouter();
  const { state, openDetail } = usePortal();

  const publicMaterials = state.materials.filter(isOpenMaterial);
  const publicPublications = state.publications.filter((item) => isListedPublic(item.access));
  const publicTopics = state.topics.filter((item) => isListedPublic(item.access));
  const publicPhotos = state.photos.filter((item) => isListedPublic(item.access));
  const publicationIds = state.pages.home.featuredPublicationIds;
  const topicIds = state.pages.home.featuredTopicIds;
  const photoIds = state.pages.home.featuredPhotoIds;
  const featuredPublications = publicationIds === null
    ? publicPublications.filter((item) => item.featured)
    : publicationIds.map((id) => publicPublications.find((item) => item.id === id)).filter((item): item is (typeof publicPublications)[number] => Boolean(item));
  const featuredTopics = (topicIds ?? [])
    .map((id) => publicTopics.find((item) => item.id === id))
    .filter((item): item is (typeof publicTopics)[number] => Boolean(item));
  const featuredPhotos = (photoIds === null ? publicPhotos.slice(0, 6).map((item) => item.id) : photoIds)
    .map((id) => publicPhotos.find((item) => item.id === id))
    .filter((item): item is (typeof publicPhotos)[number] => Boolean(item));

  const homeDisciplines = disciplines
    .map((name) => ({
      name,
      count: publicMaterials.filter((item) => item.discipline === name).length,
    }))
    .filter((item) => item.count > 0);

  function go(href: string) {
    router.push(href);
  }

  return (
    <Fragment>
      <section className="public-section" style={{ paddingTop: 64 }}>
        <div className="hero-grid">
          <div>
            <div className="section-kicker" style={{ marginBottom: 18 }}>
              {state.pages.home.eyebrow}
            </div>
            <h1 className="hero-title">{state.pages.home.heroTitle}</h1>
            <p className="hero-copy">
              {state.pages.home.heroBody}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="primary-button" onClick={() => !state.editMode && go("/students")}>
                <EditableText id="home.ctaStudents" /> <ArrowRight size={14} strokeWidth={2} />
              </button>
              <button className="secondary-button" onClick={() => !state.editMode && go("/publications")}>
                <EditableText id="home.ctaPublications" />
              </button>
            </div>
          </div>
          <div
            className="hero-portrait"
            style={
              state.pages.home.heroImagePath
                ? {
                    backgroundImage: `url(${state.pages.home.heroImagePath})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--muted)",
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: 7,
                padding: "6px 11px",
              }}
            >
              {state.pages.home.heroImageCaption}
            </span>
          </div>
        </div>
        <div style={{ marginTop: 48 }}>
          <div className="dashboard-top" style={{ marginBottom: 18, alignItems: "baseline" }}>
            <EditableText as="h2" id="home.expeditionsTitle" className="page-title" style={{ fontSize: 28 }} />
            <button className="panel-link" onClick={() => !state.editMode && go("/expeditions")}>
              <EditableText id="home.expeditionsLink" /> <ArrowRight size={13} strokeWidth={2} />
            </button>
          </div>
          <ExpeditionsExplorer height={440} />
        </div>
      </section>

      {featuredPublications.length > 0 ? <section className="public-section" style={{ paddingTop: 30 }}>
        <div className="dashboard-top" style={{ marginBottom: 22, alignItems: "baseline" }}>
          <h2 className="page-title" style={{ fontSize: 30 }}>
            {state.pages.home.featuredTitle}
          </h2>
          <button className="panel-link" onClick={() => !state.editMode && go("/publications")}>
            <EditableText id="home.featuredLink" /> <ArrowRight size={13} strokeWidth={2} />
          </button>
        </div>
        <div className="featured-grid">
          {featuredPublications.map((item) => (
            <button
              key={item.id}
              className="item-card"
              style={{ height: "100%", textAlign: "left" }}
              onClick={() => router.push(`/publications/${item.id}`)}
            >
              <div className="mono" style={{ fontSize: 11, color: "var(--clay)", marginBottom: 10, flexShrink: 0 }}>
                {item.year} · {item.ptype}
              </div>
              <h3
                className="panel-title clamp-3"
                style={{ fontSize: 20, lineHeight: 1.25, flex: 1, marginBottom: 12 }}
              >
                {item.title}
              </h3>
              <div style={{ marginTop: "auto", flexShrink: 0 }}>
                <div className="clamp-1" style={{ fontSize: 13, color: "var(--forest2)", marginBottom: 4 }}>
                  {item.authors}
                </div>
                <div
                  className="clamp-1"
                  style={{ fontSize: 13, fontStyle: "italic", color: "var(--muted)" }}
                >
                  {item.journal}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section> : null}

      {featuredTopics.length > 0 ? (
        <section className="public-section" style={{ paddingTop: 30 }}>
          <div className="dashboard-top" style={{ marginBottom: 22, alignItems: "baseline" }}>
            <h2 className="page-title" style={{ fontSize: 30 }}>{state.pages.home.topicsTitle}</h2>
            <button className="panel-link" onClick={() => !state.editMode && go("/research")}>
              все темы <ArrowRight size={13} strokeWidth={2} />
            </button>
          </div>
          <div className="topics-grid">
            {featuredTopics.map((item) => (
              <button key={item.id} className="topic-card" style={{ textAlign: "left" }} onClick={() => go(`/research/${item.id}`)}>
                <div style={{ display: "flex", gap: 9, marginBottom: 13 }}>
                  {item.age ? <span className="mono" style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: "var(--sand)" }}>{item.age}</span> : null}
                  {item.region ? <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{item.region}</span> : null}
                </div>
                <h3 className="panel-title clamp-2" style={{ fontSize: 22, lineHeight: 1.2, marginBottom: 10 }}>{item.name}</h3>
                <p className="clamp-3" style={{ flex: 1, fontSize: 14, lineHeight: 1.55, color: "var(--forest2)", margin: "0 0 14px" }}>{item.desc}</p>
                <div className="mono" style={{ fontSize: 11, color: "var(--clay)", marginTop: "auto" }}>{item.pubs} публ. · {item.photos} фото · {item.archive} архив</div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="public-section" style={{ paddingTop: 30 }}>
        <h2 className="page-title" style={{ fontSize: 30, marginBottom: 22 }}>
          {state.pages.home.disciplinesTitle}
        </h2>
        <div className="disc-grid">
          {homeDisciplines.map((item) => (
            <button
              key={item.name}
              className="discipline-card"
              onClick={() =>
                go(`/students?discipline=${encodeURIComponent(item.name)}`)
              }
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span className="panel-title" style={{ fontSize: 18 }}>
                  {item.name}
                </span>
                <span className="mono" style={{ fontSize: 12, color: "var(--clay)" }}>
                  {item.count}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {featuredPhotos.length > 0 ? <section className="public-section" style={{ paddingTop: 30 }}>
        <div className="dashboard-top" style={{ marginBottom: 22, alignItems: "baseline" }}>
          <h2 className="page-title" style={{ fontSize: 30 }}>
            {state.pages.home.photosTitle}
          </h2>
          <button className="panel-link" onClick={() => !state.editMode && go("/photos")}>
            <EditableText id="home.photosLink" /> <ArrowRight size={13} strokeWidth={2} />
          </button>
        </div>
        <div className="photo-grid">
          {featuredPhotos.map((item) => (
            <button key={item.id} onClick={() => openDetail({ kind: "photo", item })}>
              <div
                style={{
                  aspectRatio: "1",
                  borderRadius: 12,
                  border: "1px solid var(--line)",
                  background: item.imagePath
                    ? `center / cover no-repeat url(${item.imagePath})`
                    : `repeating-linear-gradient(135deg, ${item.tint}, ${item.tint} 11px, rgba(255,255,255,.16) 11px, rgba(255,255,255,.16) 22px)`,
                  position: "relative",
                }}
              >
                <span
                  className="mono"
                  style={{
                    position: "absolute",
                    left: 8,
                    bottom: 8,
                    fontSize: 8.5,
                    fontWeight: 600,
                    padding: "3px 6px",
                    borderRadius: 5,
                    background: "rgba(20,18,16,.6)",
                    color: "#fff",
                  }}
                >
                  {item.year}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section> : null}
    </Fragment>
  );
}
