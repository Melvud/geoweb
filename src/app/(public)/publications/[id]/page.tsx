import { getPortalSnapshot } from "@/server/portal-repository";
import { notFound } from "next/navigation";
import { parseMarkdown } from "@/lib/portal-utils";
import { MarkdownEffectsTrigger } from "@/lib/use-markdown-effects";
import { ReadingAids } from "@/components/reading-aids";
import { RequestAccess } from "@/components/request-access";
import { PdfEmbed } from "@/components/pdf-embed";
import { isAccessibleByLink, hasFullAccess } from "@/lib/portal-utils";
import Link from "next/link";
import type { Metadata } from "next";
import { Paperclip, ExternalLink } from "lucide-react";

type Params = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(context: Params): Promise<Metadata> {
  const { id } = await context.params;
  const snapshot = getPortalSnapshot();
  const publication = snapshot.publications.find((p) => p.id === id);

  if (!publication) {
    return {
      title: "Статья не найдена",
    };
  }

  return {
    title: `${publication.title} · Публикации В. В. Силантьева`,
    description: `${publication.authors} (${publication.year}). ${publication.summary.slice(0, 150)}...`,
  };
}

export default async function PublicationDetailPage(context: Params) {
  const { id } = await context.params;
  const snapshot = getPortalSnapshot();
  const publication = snapshot.publications.find((p) => p.id === id);

  if (!publication || !isAccessibleByLink(publication.access)) {
    notFound();
  }

  const publicationTopics = snapshot.topics.filter((topic) => publication.relatedTopicIds?.includes(topic.id));

  const parsedAbstract = parseMarkdown(publication.summary);
  const fullAccess = hasFullAccess(publication.access);
  let externalUrl = publication.externalUrl || "";
  if (externalUrl && !/^https?:\/\//i.test(externalUrl)) {
    externalUrl = "https://" + externalUrl;
  }

  return (
    <section className="public-section narrow">
      <MarkdownEffectsTrigger trigger={id} />
      <ReadingAids />
      <div style={{ marginBottom: 24 }}>
        <Link href="/publications" className="panel-link" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          ← все публикации
        </Link>
      </div>

      <div className="serif-title" style={{ fontSize: 28, color: "var(--clay)", marginBottom: 10 }}>
        {publication.year} · {publication.ptype}
      </div>

      <h1 className="page-title" style={{ fontSize: 36, lineHeight: 1.18, marginBottom: 20 }}>
        {publication.title}
      </h1>

      <div style={{ fontSize: 16, color: "var(--ink)", fontWeight: 500, marginBottom: 8 }}>
        {publication.authors}
      </div>

      <div className="serif-title" style={{ fontSize: 16, fontStyle: "italic", color: "var(--muted)", marginBottom: 30, display: "flex", flexWrap: "wrap", gap: "6px 12px", alignItems: "center" }}>
        <span>{publication.journal}</span>
        {publication.doi && (
          <a href={`https://doi.org/${publication.doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")}`} target="_blank" rel="noopener noreferrer" className="panel-link" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            DOI: {publication.doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")} <ExternalLink size={12} />
          </a>
        )}
        {externalUrl && externalUrl !== `https://doi.org/${publication.doi}` && (
          <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="panel-link" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            Внешний сайт <ExternalLink size={12} />
          </a>
        )}
      </div>

      {publication.pdfPath && publication.pdfPublic && fullAccess && (
        <div style={{ padding: "18px 0", margin: "-12px 0 28px", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <PdfEmbed path={publication.pdfPath} height={680} />
        </div>
      )}

      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: 20, 
          padding: "20px 24px", 
          background: "var(--sand)", 
          borderRadius: 12, 
          marginBottom: 36 
        }}
      >
        <div>
          <div className="field-label" style={{ marginBottom: 4 }}>Научные темы</div>
          <div style={{ color: "var(--forest2)", fontSize: 14 }}>
            {publicationTopics.length > 0
              ? publicationTopics.map((topic, index) => (
                  <span key={topic.id}>{index > 0 ? " · " : ""}<Link href={`/research/${topic.id}`} className="panel-link">{topic.name}</Link></span>
                ))
              : publication.topic || "—"}
          </div>
        </div>
        <div>
          <div className="field-label" style={{ marginBottom: 4 }}>Регион исследования</div>
          <div style={{ color: "var(--forest2)", fontSize: 14 }}>{publication.region || "—"}</div>
        </div>
        <div>
          <div className="field-label" style={{ marginBottom: 4 }}>Геологический возраст</div>
          <div style={{ color: "var(--forest2)", fontSize: 14 }}>{publication.age || "—"}</div>
        </div>
      </div>

      <div style={{ marginBottom: 36 }}>
        <h2 className="panel-title" style={{ fontSize: 24, marginBottom: 14 }}>Аннотация</h2>
        <div 
          className="page-copy markdown-body" 
          style={{ maxWidth: "none", fontSize: 15, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: parsedAbstract }}
        />
      </div>

      {publication.attachments && publication.attachments.length > 0 && (
        <div style={{ marginTop: 36, marginBottom: 36, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
          <h2 className="panel-title" style={{ fontSize: 24, marginBottom: 14 }}>Приложения</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {publication.attachments.map((file, index) => (
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

      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 24 }}>
        {publication.access === "request" ? (
          <RequestAccess itemTitle={publication.title} />
        ) : null}
        {externalUrl && externalUrl !== `https://doi.org/${publication.doi}` && (
          <a
            href={externalUrl}
            className="secondary-button"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", marginTop: publication.pdfPath ? 12 : 0 }}
          >
            Читать источник <ExternalLink size={13} strokeWidth={2} style={{ marginLeft: 4 }} />
          </a>
        )}
      </div>
    </section>
  );
}
