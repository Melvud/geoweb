import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type CrossrefAuthor = { given?: string; family?: string; name?: string };
type CrossrefWork = {
  title?: string[];
  author?: CrossrefAuthor[];
  issued?: { "date-parts"?: number[][] };
  published?: { "date-parts"?: number[][] };
  "container-title"?: string[];
  type?: string;
  DOI?: string;
  URL?: string;
  resource?: { primary?: { URL?: string } };
  abstract?: string;
  subject?: string[];
  language?: string;
};

type OpenAlexWork = {
  title?: string;
  publication_year?: number;
  abstract_inverted_index?: Record<string, number[]> | null;
  primary_location?: { source?: { display_name?: string }; landing_page_url?: string };
  authorships?: Array<{ author?: { display_name?: string } }>;
  keywords?: Array<{ display_name?: string }>;
};

const TYPE_LABELS: Record<string, string> = {
  "journal-article": "Статья",
  "book-chapter": "Глава в книге",
  book: "Монография",
  monograph: "Монография",
  proceedings: "Материалы конференции",
  "proceedings-article": "Тезисы",
  dissertation: "Диссертация",
  report: "Отчёт",
};

function normalizeDoi(value: string) {
  return value.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "").trim();
}

function decodeEntities(value: string) {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (_, code: string) => {
    if (code[0] === "#") {
      const hex = code[1].toLowerCase() === "x";
      const point = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    }
    return named[code.toLowerCase()] ?? "";
  });
}

function cleanAbstract(value?: string) {
  if (!value) return "";
  return decodeEntities(
    value
      .replace(/<\/?(?:jats:)?p\b[^>]*>/gi, "\n\n")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  ).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function initials(given = "") {
  return given.split(/[\s-]+/).filter(Boolean).map((part) => `${part[0].toUpperCase()}.`).join(" ");
}

function formatAuthors(authors: CrossrefAuthor[] = []) {
  return authors.map((author) => {
    if (author.name) return author.name;
    return [author.family, initials(author.given)].filter(Boolean).join(" ");
  }).filter(Boolean).join(", ");
}

function restoreAbstract(index?: Record<string, number[]> | null) {
  if (!index) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) words[position] = word;
  }
  return words.filter(Boolean).join(" ");
}

export async function GET(request: Request) {
  const secret = process.env.ADMIN_SECRET ?? "";
  const session = (await cookies()).get("admin_session")?.value;
  if (!secret || session !== secret) {
    return NextResponse.json({ error: "Требуется доступ администратора" }, { status: 401 });
  }

  const doi = normalizeDoi(new URL(request.url).searchParams.get("doi") ?? "");
  if (!/^10\.\d{4,9}\/\S+$/i.test(doi)) {
    return NextResponse.json({ error: "Введите корректный DOI, например 10.1000/example" }, { status: 400 });
  }

  const headers = { "User-Agent": "GEOweb/1.0 (DOI metadata importer)" };
  const encodedDoi = encodeURIComponent(doi);

  try {
    const [crossrefResult, openAlexResult] = await Promise.allSettled([
      fetch(`https://api.crossref.org/works/${encodedDoi}`, { headers, signal: AbortSignal.timeout(12_000) }),
      fetch(`https://api.openalex.org/works/https://doi.org/${encodedDoi}`, { headers, signal: AbortSignal.timeout(12_000) }),
    ]);

    if (crossrefResult.status !== "fulfilled" || !crossrefResult.value.ok) {
      const status = crossrefResult.status === "fulfilled" ? crossrefResult.value.status : 502;
      return NextResponse.json(
        { error: status === 404 ? "Публикация с таким DOI не найдена" : "Реестр DOI временно недоступен" },
        { status: status === 404 ? 404 : 502 },
      );
    }

    const crossref = (await crossrefResult.value.json()) as { message: CrossrefWork };
    const work = crossref.message;
    let openAlex: OpenAlexWork | null = null;
    if (openAlexResult.status === "fulfilled" && openAlexResult.value.ok) {
      openAlex = await openAlexResult.value.json() as OpenAlexWork;
    }

    const dateParts = work.issued?.["date-parts"]?.[0] ?? work.published?.["date-parts"]?.[0];
    const abstract = cleanAbstract(work.abstract) || restoreAbstract(openAlex?.abstract_inverted_index);
    const authors = formatAuthors(work.author) || openAlex?.authorships?.map((item) => item.author?.display_name).filter(Boolean).join(", ") || "";
    const externalUrl = work.resource?.primary?.URL || openAlex?.primary_location?.landing_page_url || work.URL || `https://doi.org/${doi}`;
    const keywords = Array.from(new Set([
      ...(work.subject ?? []),
      ...(openAlex?.keywords?.map((item) => item.display_name ?? "") ?? []),
    ].map((item) => item.trim()).filter(Boolean))).slice(0, 12);

    return NextResponse.json({
      title: work.title?.[0] || openAlex?.title || "",
      authors,
      year: String(dateParts?.[0] || openAlex?.publication_year || ""),
      journal: work["container-title"]?.[0] || openAlex?.primary_location?.source?.display_name || "",
      ptype: TYPE_LABELS[work.type ?? ""] || "Статья",
      doi: work.DOI || doi,
      doiUrl: `https://doi.org/${work.DOI || doi}`,
      externalUrl,
      summary: abstract,
      keywords,
      language: work.language === "ru" ? "Русский" : work.language === "en" ? "English" : "",
      missing: abstract ? [] : ["аннотация или полный текст"],
      source: "Crossref + OpenAlex",
    });
  } catch (error) {
    console.error("DOI import failed", error);
    return NextResponse.json({ error: "Не удалось получить данные публикации" }, { status: 502 });
  }
}
