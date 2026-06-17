import { getPortalSnapshot } from "@/server/portal-repository";
import { notFound } from "next/navigation";
import { parseMarkdown } from "@/lib/portal-utils";
import { MarkdownEffectsTrigger } from "@/lib/use-markdown-effects";
import { ReadingAids } from "@/components/reading-aids";
import { isAccessibleByLink } from "@/lib/portal-utils";
import Link from "next/link";
import type { Metadata } from "next";
import { Paperclip } from "lucide-react";

type Params = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(context: Params): Promise<Metadata> {
  const { id } = await context.params;
  const snapshot = getPortalSnapshot();
  const topic = snapshot.topics.find((t) => t.id === id);

  if (!topic) {
    return {
      title: "Тема не найдена",
    };
  }

  return {
    title: `${topic.name} · Научные исследования В. В. Силантьева`,
    description: topic.desc,
  };
}

export default async function TopicDetailPage(context: Params) {
  const { id } = await context.params;
  const snapshot = getPortalSnapshot();
  const topic = snapshot.topics.find((t) => t.id === id);

  if (!topic || !isAccessibleByLink(topic.access)) {
    notFound();
  }

  const parsedBody = parseMarkdown(topic.body || topic.desc);

  // Link related content
  const relatedPublications = snapshot.publications.filter(
    (p) => topic.relatedPublicationIds.includes(p.id) || p.topic === topic.name,
  );
  
  const relatedPhotos = snapshot.photos.filter(
    (ph) => topic.relatedPhotoIds.includes(ph.id) || ph.group === topic.name,
  );

  const relatedArchiveItems = snapshot.archiveItems.filter(
    (a) => topic.relatedArchiveIds.includes(a.id) || a.topic === topic.name,
  );

  return (
    <section className="public-section narrow">
      <MarkdownEffectsTrigger trigger={id} />
      <ReadingAids />
      <div style={{ marginBottom: 24 }}>
        <Link href="/research" className="panel-link" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          ← все научные темы
        </Link>
      </div>

      <div className="section-kicker" style={{ marginBottom: 10 }}>
        Научное направление
      </div>

      <h1 className="page-title" style={{ fontSize: 38, lineHeight: 1.15, marginBottom: 20 }}>
        {topic.name}
      </h1>

      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
          gap: 20, 
          padding: "20px 24px", 
          background: "var(--sand)", 
          borderRadius: 12, 
          marginBottom: 36 
        }}
      >
        <div>
          <div className="field-label" style={{ marginBottom: 4 }}>Регион исследований</div>
          <div style={{ color: "var(--forest2)", fontSize: 14, fontWeight: 500 }}>{topic.region || "—"}</div>
        </div>
        <div>
          <div className="field-label" style={{ marginBottom: 4 }}>Геологический возраст</div>
          <div style={{ color: "var(--forest2)", fontSize: 14, fontWeight: 500 }}>{topic.age || "—"}</div>
        </div>
        <div>
          <div className="field-label" style={{ marginBottom: 4 }}>Связанные ресурсы</div>
          <div style={{ color: "var(--forest2)", fontSize: 14, fontWeight: 500 }}>
            {relatedPublications.length} публ. · {relatedPhotos.length} фото · {relatedArchiveItems.length} док.
          </div>
        </div>
      </div>

      {topic.coverPath && (
        <div 
          style={{ 
            width: "100%", 
            aspectRatio: "16 / 7", 
            borderRadius: 18, 
            border: "1px solid var(--line)", 
            backgroundImage: `url(${topic.coverPath})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            marginBottom: 36
          }} 
        />
      )}

      <div style={{ marginBottom: 48 }}>
        <h2 className="panel-title" style={{ fontSize: 24, marginBottom: 14 }}>Описание направления</h2>
        <div 
          className="page-copy markdown-body" 
          style={{ maxWidth: "none", fontSize: 15, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: parsedBody }}
        />
      </div>

      {topic.attachments && topic.attachments.length > 0 && (
        <div style={{ marginTop: 36, marginBottom: 48, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
          <h2 className="panel-title" style={{ fontSize: 24, marginBottom: 14 }}>Приложения</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topic.attachments.map((file, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--sand)",
                  borderRadius: 8,
                  border: "1px solid var(--line2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Paperclip size={16} strokeWidth={1.8} style={{ color: "var(--muted)", flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, fontSize: 14, color: "var(--ink)" }}>{file.name}</span>
                </div>
                <a
                  href={file.path}
                  className="secondary-button"
                  download
                  style={{ textDecoration: "none", padding: "6px 12px", fontSize: 13 }}
                >
                  Скачать
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publications Section */}
      {relatedPublications.length > 0 && (
        <div style={{ marginBottom: 48, borderTop: "1px solid var(--line)", paddingTop: 30 }}>
          <h2 className="panel-title" style={{ fontSize: 24, marginBottom: 18 }}>Связанные публикации ({relatedPublications.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {relatedPublications.map((item) => (
              <Link
                key={item.id}
                href={`/publications/${item.id}`}
                className="list-row"
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "50px 1fr auto", 
                  gap: 14, 
                  alignItems: "center", 
                  background: "var(--paper)", 
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  padding: "14px 18px",
                  marginBottom: 8,
                  textDecoration: "none",
                  color: "inherit"
                }}
              >
                <span className="serif-title" style={{ fontSize: 17, fontWeight: 600, color: "var(--clay)" }}>
                  {item.year}
                </span>
                <span className="list-row-body">
                  <span style={{ fontWeight: 500 }}>{item.title}</span>
                  <br />
                  <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                    {item.authors} {item.journal ? `· ${item.journal}` : ""}
                  </span>
                </span>
                <span style={{ color: "var(--clay)" }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Photos Section */}
      {relatedPhotos.length > 0 && (
        <div style={{ marginBottom: 48, borderTop: "1px solid var(--line)", paddingTop: 30 }}>
          <h2 className="panel-title" style={{ fontSize: 24, marginBottom: 18 }}>Фотогалерея темы ({relatedPhotos.length})</h2>
          <div className="disc-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
            {relatedPhotos.map((item) => (
              <div 
                key={item.id} 
                className="preview-card"
                style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}
              >
                <div
                  style={{
                    aspectRatio: "4 / 3",
                    backgroundImage: item.imagePath ? `url(${item.imagePath})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    background: !item.imagePath ? `repeating-linear-gradient(135deg, ${item.tint}, ${item.tint} 13px, rgba(255,255,255,.16) 13px, rgba(255,255,255,.16) 26px)` : undefined,
                    display: "flex",
                    alignItems: "flex-end",
                    padding: 10,
                  }}
                >
                  <span className="type-chip" style={{ background: "rgba(20,18,16,.62)", color: "#fff" }}>
                    {item.otype}
                  </span>
                </div>
                <div className="preview-body" style={{ padding: "14px 16px" }}>
                  <div className="panel-title" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>
                    {item.title}
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
                    {item.location || item.region} · {item.year}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archive Items Section */}
      {relatedArchiveItems.length > 0 && (
        <div style={{ marginBottom: 36, borderTop: "1px solid var(--line)", paddingTop: 30 }}>
          <h2 className="panel-title" style={{ fontSize: 24, marginBottom: 18 }}>Архивные материалы ({relatedArchiveItems.length})</h2>
          <div className="archive-table" style={{ border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
            {relatedArchiveItems.map((item) => (
              <div 
                key={item.id} 
                className="archive-row"
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 140px 80px", 
                  gap: 16, 
                  alignItems: "center",
                  padding: "14px 18px",
                  background: "var(--paper)",
                  borderBottom: "1px solid var(--line2)"
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14.5 }}>{item.title}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{item.desc}</div>
                </div>
                <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{item.atype}</div>
                <div className="mono" style={{ fontSize: 12, textAlign: "right" }}>{item.year}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
