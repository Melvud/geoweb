import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Database as DatabaseType } from "better-sqlite3";
import {
  defaultAboutPageContent,
  defaultHomePageContent,
  type AboutPageContent,
  type HomePageContent,
} from "@/lib/page-content";
import {
  accessLabel,
  seedArchiveItems,
  seedMaterials,
  seedPhotos,
  seedPublications,
  seedTopics,
} from "@/lib/portal-seed";
import type {
  ArchiveItem,
  ContactMessage,
  LibraryItem,
  MapPlace,
  Material,
  Photo,
  Publication,
  SitePages,
  Topic,
} from "@/lib/portal-types";
import { defaultUiText, type UiText } from "@/lib/ui-text";
import { getDatabase, initializeDatabase } from "@/server/db";

type PortalSnapshot = {
  materials: Material[];
  publications: Publication[];
  photos: Photo[];
  topics: Topic[];
  archiveItems: ArchiveItem[];
  libraryItems: LibraryItem[];
  mapPlaces: MapPlace[];
  pages: SitePages;
  uiText: UiText;
};

function db() {
  initializeDatabase();
  return getDatabase();
}

function now() {
  return new Date().toISOString();
}

function toJson(value: unknown) {
  return JSON.stringify(value);
}

function fromJsonArray(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function fromJsonAttachments(value: string | null): Array<{ name: string; path: string; size?: number }> {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function fromJsonPage<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return { ...fallback, ...(JSON.parse(value) as Partial<T>) };
  } catch {
    return fallback;
  }
}

function mapMaterial(row: Record<string, unknown>): Material {
  return {
    id: String(row.id),
    title: String(row.title),
    discipline: String(row.discipline),
    mtype: String(row.mtype),
    year: String(row.year),
    language: String(row.language),
    status: row.status as Material["status"],
    access: row.access as Material["access"],
    tags: fromJsonArray(row.tags_json as string | null),
    desc: String(row.desc),
    course: String(row.course),
    filePath: (row.file_path as string | null) || null,
    previewPath: (row.preview_path as string | null) || null,
    attachments: fromJsonAttachments(row.attachments_json as string | null),
    relatedTopicIds: fromJsonArray(row.related_topic_ids_json as string | null),
  };
}

function mapPublication(row: Record<string, unknown>): Publication {
  return {
    id: String(row.id),
    year: String(row.year),
    authors: String(row.authors),
    title: String(row.title),
    ptype: String(row.ptype),
    journal: String(row.journal),
    doi: String(row.doi),
    externalUrl: String(row.external_url),
    pdfPath: (row.pdf_path as string | null) || null,
    pdfPublic: row.pdf_public === undefined ? true : Boolean(row.pdf_public),
    summary: String(row.summary),
    topic: String(row.topic),
    region: String(row.region),
    age: String(row.age),
    keywords: fromJsonArray(row.keywords_json as string | null),
    language: String(row.language),
    featured: Boolean(row.featured),
    access: row.access as Publication["access"],
    attachments: fromJsonAttachments(row.attachments_json as string | null),
    relatedTopicIds: fromJsonArray(row.related_topic_ids_json as string | null),
  };
}

function mapPhoto(row: Record<string, unknown>): Photo {
  return {
    id: String(row.id),
    title: String(row.title),
    year: String(row.year),
    imagePath: (row.image_path as string | null) || null,
    location: String(row.location),
    region: String(row.region),
    otype: String(row.otype),
    age: String(row.age),
    desc: String(row.desc),
    author: String(row.author),
    tags: fromJsonArray(row.tags_json as string | null),
    usagePolicy: String(row.usage_policy),
    group: String(row.group_name),
    access: row.access as Photo["access"],
    status: row.status as Photo["status"],
    relatedPublicationIds: fromJsonArray(
      row.related_publication_ids_json as string | null,
    ),
    relatedTopicIds: fromJsonArray(row.related_topic_ids_json as string | null),
    tint: String(row.tint),
  };
}

function mapTopic(row: Record<string, unknown>): Topic {
  const relatedPublicationIds = fromJsonArray(
    row.related_publication_ids_json as string | null,
  );
  const relatedPhotoIds = fromJsonArray(row.related_photo_ids_json as string | null);
  const relatedArchiveIds = fromJsonArray(
    row.related_archive_ids_json as string | null,
  );

  return {
    id: String(row.id),
    name: String(row.name),
    region: String(row.region),
    age: String(row.age),
    desc: String(row.desc),
    body: String(row.body),
    coverPath: (row.cover_path as string | null) || null,
    keywords: fromJsonArray(row.keywords_json as string | null),
    access: row.access as Topic["access"],
    relatedPublicationIds,
    relatedPhotoIds,
    relatedArchiveIds,
    pubs: relatedPublicationIds.length,
    photos: relatedPhotoIds.length,
    archive: relatedArchiveIds.length,
    attachments: fromJsonAttachments(row.attachments_json as string | null),
  };
}

function mapArchiveItem(row: Record<string, unknown>): ArchiveItem {
  return {
    id: String(row.id),
    title: String(row.title),
    atype: String(row.atype),
    desc: String(row.desc),
    filePath: (row.file_path as string | null) || null,
    year: String(row.year),
    region: String(row.region),
    topic: String(row.topic),
    ownerComment: String(row.owner_comment),
    access: row.access as ArchiveItem["access"],
    statusLabel: String(row.status_label),
    relatedPublicationIds: fromJsonArray(
      row.related_publication_ids_json as string | null,
    ),
    relatedPhotoIds: fromJsonArray(row.related_photo_ids_json as string | null),
    dot: String(row.dot),
    attachments: fromJsonAttachments(row.attachments_json as string | null),
    relatedTopicIds: fromJsonArray(row.related_topic_ids_json as string | null),
  };
}

function mapLibraryItem(row: Record<string, unknown>): LibraryItem {
  return {
    id: String(row.id),
    title: String(row.title),
    authors: String(row.authors),
    year: String(row.year),
    category: String(row.category),
    source: String(row.source),
    pdfPath: (row.pdf_path as string | null) || null,
    notes: String(row.notes),
    access: row.access as LibraryItem["access"],
    relatedTopicIds: fromJsonArray(row.related_topic_ids_json as string | null),
  };
}

function mapMessage(row: Record<string, unknown>): ContactMessage {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    body: String(row.body),
    isRead: Boolean(row.is_read),
    createdAt: String(row.created_at),
  };
}

function mapMapPlace(row: Record<string, unknown>): MapPlace {
  return {
    id: String(row.id),
    title: String(row.title),
    desc: String(row.desc),
    lat: Number(row.lat),
    lng: Number(row.lng),
    year: String(row.year),
    yearEnd: String(row.year_end),
    era: (row.era as MapPlace["era"]) || "modern",
    region: String(row.region),
    coverPath: (row.cover_path as string | null) || null,
    relatedPublicationIds: fromJsonArray(row.related_publication_ids_json as string | null),
    relatedPhotoIds: fromJsonArray(row.related_photo_ids_json as string | null),
    relatedMaterialIds: fromJsonArray(row.related_material_ids_json as string | null),
    relatedTopicIds: fromJsonArray(row.related_topic_ids_json as string | null),
    relatedArchiveIds: fromJsonArray(row.related_archive_ids_json as string | null),
  };
}

const seedMapPlaces: Array<Omit<MapPlace, "id"> & { id: string }> = [
  {
    id: "place_kazan",
    title: "Казань · КФУ, кафедра",
    desc: "Базовая точка — Институт геологии и нефтегазовых технологий КФУ. Отсюда начинались все экспедиции по Волго-Уральскому региону.",
    lat: 55.7917,
    lng: 49.1221,
    year: "1984",
    yearEnd: "",
    era: "modern",
    region: "Республика Татарстан",
    coverPath: null,
    relatedPublicationIds: [],
    relatedPhotoIds: [],
    relatedMaterialIds: [],
    relatedTopicIds: [],
    relatedArchiveIds: [],
  },
  {
    id: "place_pechishchi",
    title: "Печищи · разрез верхней перми",
    desc: "Классический разрез верхнепермских отложений на правом берегу Волги. Эталонные слои казанского яруса.",
    lat: 55.715,
    lng: 48.96,
    year: "1987",
    yearEnd: "2019",
    era: "historic",
    region: "Волга, правый берег",
    coverPath: null,
    relatedPublicationIds: [],
    relatedPhotoIds: [],
    relatedMaterialIds: [],
    relatedTopicIds: [],
    relatedArchiveIds: [],
  },
  {
    id: "place_sokskie",
    title: "Сокские карьеры",
    desc: "Полевые работы по неморским двустворкам и стратиграфии карбона-перми.",
    lat: 53.4,
    lng: 50.15,
    year: "2003",
    yearEnd: "2012",
    era: "modern",
    region: "Самарская область",
    coverPath: null,
    relatedPublicationIds: [],
    relatedPhotoIds: [],
    relatedMaterialIds: [],
    relatedTopicIds: [],
    relatedArchiveIds: [],
  },
];

function ensureSeedPlaces() {
  const database = db();
  const row = database
    .prepare("SELECT COUNT(*) AS count FROM map_places")
    .get() as { count: number };
  if (row.count > 0) return;

  const insert = database.prepare(`
    INSERT INTO map_places (
      id, title, desc, lat, lng, year, year_end, era, region, cover_path,
      related_publication_ids_json, related_photo_ids_json, related_material_ids_json,
      related_topic_ids_json, related_archive_ids_json, created_at, updated_at
    ) VALUES (
      @id, @title, @desc, @lat, @lng, @year, @yearEnd, @era, @region, @cover_path,
      @related_publication_ids_json, @related_photo_ids_json, @related_material_ids_json,
      @related_topic_ids_json, @related_archive_ids_json, @created_at, @updated_at
    )
  `);

  const tx = database.transaction(() => {
    for (const place of seedMapPlaces) {
      const timestamp = now();
      insert.run({
        ...place,
        cover_path: place.coverPath,
        related_publication_ids_json: toJson(place.relatedPublicationIds),
        related_photo_ids_json: toJson(place.relatedPhotoIds),
        related_material_ids_json: toJson(place.relatedMaterialIds),
        related_topic_ids_json: toJson(place.relatedTopicIds),
        related_archive_ids_json: toJson(place.relatedArchiveIds),
        created_at: timestamp,
        updated_at: timestamp,
      });
    }
  });
  tx();
}

function insertSeedRecords(database: DatabaseType) {
  const insertMaterial = database.prepare(`
    INSERT INTO materials (
      id, title, discipline, mtype, year, language, status, access, tags_json, desc, course,
      file_path, preview_path, created_at, updated_at, attachments_json
    ) VALUES (
      @id, @title, @discipline, @mtype, @year, @language, @status, @access, @tags_json, @desc, @course,
      @file_path, @preview_path, @created_at, @updated_at, @attachments_json
    )
  `);

  const insertPublication = database.prepare(`
    INSERT INTO publications (
      id, year, authors, title, ptype, journal, doi, external_url, pdf_path, pdf_public, summary, topic, region, age,
      keywords_json, language, featured, access, created_at, updated_at, attachments_json
    ) VALUES (
      @id, @year, @authors, @title, @ptype, @journal, @doi, @external_url, @pdf_path, @pdf_public, @summary, @topic, @region, @age,
      @keywords_json, @language, @featured, @access, @created_at, @updated_at, @attachments_json
    )
  `);

  const insertPhoto = database.prepare(`
    INSERT INTO photos (
      id, title, year, image_path, location, region, otype, age, desc, author, tags_json, usage_policy,
      group_name, access, status, related_publication_ids_json, related_topic_ids_json, tint, created_at, updated_at
    ) VALUES (
      @id, @title, @year, @image_path, @location, @region, @otype, @age, @desc, @author, @tags_json, @usage_policy,
      @group_name, @access, @status, @related_publication_ids_json, @related_topic_ids_json, @tint, @created_at, @updated_at
    )
  `);

  const insertTopic = database.prepare(`
    INSERT INTO topics (
      id, name, region, age, desc, body, cover_path, keywords_json, access,
      related_publication_ids_json, related_photo_ids_json, related_archive_ids_json, created_at, updated_at, attachments_json
    ) VALUES (
      @id, @name, @region, @age, @desc, @body, @cover_path, @keywords_json, @access,
      @related_publication_ids_json, @related_photo_ids_json, @related_archive_ids_json, @created_at, @updated_at, @attachments_json
    )
  `);

  const insertArchive = database.prepare(`
    INSERT INTO archive_items (
      id, title, atype, desc, file_path, year, region, topic, owner_comment, access, status_label,
      related_publication_ids_json, related_photo_ids_json, dot, created_at, updated_at, attachments_json
    ) VALUES (
      @id, @title, @atype, @desc, @file_path, @year, @region, @topic, @owner_comment, @access, @status_label,
      @related_publication_ids_json, @related_photo_ids_json, @dot, @created_at, @updated_at, @attachments_json
    )
  `);

  const insertPage = database.prepare(`
    INSERT INTO pages (slug, payload_json, updated_at)
    VALUES (@slug, @payload_json, @updated_at)
  `);

  const transaction = database.transaction(() => {
    for (const item of seedMaterials) {
      const timestamp = now();
      insertMaterial.run({
        ...item,
        tags_json: toJson(item.tags),
        file_path: item.filePath,
        preview_path: item.previewPath,
        created_at: timestamp,
        updated_at: timestamp,
        attachments_json: toJson((item as any).attachments || []),
      });
    }

    for (const item of seedPublications) {
      const timestamp = now();
      insertPublication.run({
        ...item,
        external_url: item.externalUrl,
        pdf_path: item.pdfPath,
        pdf_public: item.pdfPublic ? 1 : 0,
        summary: item.summary,
        keywords_json: toJson(item.keywords),
        featured: item.featured ? 1 : 0,
        created_at: timestamp,
        updated_at: timestamp,
        attachments_json: toJson((item as any).attachments || []),
      });
    }

    for (const item of seedPhotos) {
      const timestamp = now();
      insertPhoto.run({
        ...item,
        image_path: item.imagePath,
        tags_json: toJson(item.tags),
        usage_policy: item.usagePolicy,
        group_name: item.group,
        related_publication_ids_json: toJson(item.relatedPublicationIds),
        related_topic_ids_json: toJson(item.relatedTopicIds),
        created_at: timestamp,
        updated_at: timestamp,
      });
    }

    for (const item of seedTopics) {
      const timestamp = now();
      insertTopic.run({
        ...item,
        cover_path: item.coverPath,
        keywords_json: toJson(item.keywords),
        related_publication_ids_json: toJson(item.relatedPublicationIds),
        related_photo_ids_json: toJson(item.relatedPhotoIds),
        related_archive_ids_json: toJson(item.relatedArchiveIds),
        created_at: timestamp,
        updated_at: timestamp,
        attachments_json: toJson((item as any).attachments || []),
      });
    }

    for (const item of seedArchiveItems) {
      const timestamp = now();
      insertArchive.run({
        ...item,
        file_path: item.filePath,
        owner_comment: item.ownerComment,
        status_label: item.statusLabel || accessLabel(item.access),
        related_publication_ids_json: toJson(item.relatedPublicationIds),
        related_photo_ids_json: toJson(item.relatedPhotoIds),
        created_at: timestamp,
        updated_at: timestamp,
        attachments_json: toJson((item as any).attachments || []),
      });
    }

    insertPage.run({
      slug: "home",
      payload_json: toJson(defaultHomePageContent()),
      updated_at: now(),
    });
    insertPage.run({
      slug: "about",
      payload_json: toJson(defaultAboutPageContent()),
      updated_at: now(),
    });
  });

  transaction();
}

export function ensureSeedData() {
  const database = db();
  const row = database
    .prepare("SELECT COUNT(*) AS count FROM materials")
    .get() as { count: number };

  if (row.count > 0) {
    return;
  }

  insertSeedRecords(database);
}

function fetchRows<T>(query: string, mapper: (row: Record<string, unknown>) => T): T[] {
  const rows = db().prepare(query).all() as Record<string, unknown>[];
  return rows.map(mapper);
}

function backfillLegacyTopicLinks() {
  const database = db();
  const topics = database.prepare("SELECT id, name FROM topics").all() as Array<{ id: string; name: string }>;
  const updatePublication = database.prepare(`
    UPDATE publications SET related_topic_ids_json = @ids
    WHERE topic = @name AND (related_topic_ids_json IS NULL OR related_topic_ids_json = '[]')
  `);
  const updateArchive = database.prepare(`
    UPDATE archive_items SET related_topic_ids_json = @ids
    WHERE topic = @name AND (related_topic_ids_json IS NULL OR related_topic_ids_json = '[]')
  `);
  const transaction = database.transaction(() => {
    for (const topic of topics) {
      const ids = toJson([topic.id]);
      updatePublication.run({ ids, name: topic.name });
      updateArchive.run({ ids, name: topic.name });
    }
  });
  transaction();
}

export function getPortalSnapshot(): PortalSnapshot {
  ensureSeedData();
  backfillLegacyTopicLinks();

  const materials = fetchRows(
    "SELECT * FROM materials ORDER BY CAST(year AS INTEGER) DESC, updated_at DESC",
    mapMaterial,
  );
  const publications = fetchRows(
    "SELECT * FROM publications ORDER BY CAST(year AS INTEGER) DESC, updated_at DESC",
    mapPublication,
  );
  const photos = fetchRows(
    "SELECT * FROM photos ORDER BY CAST(year AS INTEGER) DESC, updated_at DESC",
    mapPhoto,
  );
  const topics = fetchRows("SELECT * FROM topics ORDER BY updated_at DESC", mapTopic);
  const archiveItems = fetchRows(
    "SELECT * FROM archive_items ORDER BY CAST(year AS INTEGER) DESC, updated_at DESC",
    mapArchiveItem,
  );
  const libraryItems = fetchRows(
    "SELECT * FROM library_items ORDER BY category ASC, CAST(year AS INTEGER) DESC, title ASC",
    mapLibraryItem,
  );
  for (const topic of topics) {
    topic.relatedPublicationIds = [...new Set([
      ...topic.relatedPublicationIds,
      ...publications.filter((item) => item.relatedTopicIds?.includes(topic.id)).map((item) => item.id),
    ])];
    topic.relatedPhotoIds = [...new Set([
      ...topic.relatedPhotoIds,
      ...photos.filter((item) => item.relatedTopicIds.includes(topic.id)).map((item) => item.id),
    ])];
    topic.relatedArchiveIds = [...new Set([
      ...topic.relatedArchiveIds,
      ...archiveItems.filter((item) => item.relatedTopicIds?.includes(topic.id)).map((item) => item.id),
    ])];
    topic.pubs = topic.relatedPublicationIds.length;
    topic.photos = topic.relatedPhotoIds.length;
    topic.archive = topic.relatedArchiveIds.length;
  }
  ensureSeedPlaces();
  const mapPlaces = fetchRows(
    "SELECT * FROM map_places ORDER BY CAST(year AS INTEGER) ASC, title ASC",
    mapMapPlace,
  );
  const pageRows = db()
    .prepare("SELECT slug, payload_json FROM pages")
    .all() as Array<{ slug: string; payload_json: string }>;

  const pageMap = Object.fromEntries(
    pageRows.map((item) => [item.slug, item.payload_json]),
  ) as Record<string, string>;

  return {
    materials,
    publications,
    photos,
    topics,
    archiveItems,
    libraryItems,
    mapPlaces,
    pages: {
      home: fromJsonPage<HomePageContent>(pageMap.home, defaultHomePageContent()),
      about: fromJsonPage<AboutPageContent>(pageMap.about, defaultAboutPageContent()),
    },
    uiText: getUiText(),
  };
}

// ── Места на карте экспедиций ──────────────────────────────────────

function placeWriteParams(item: MapPlace) {
  return {
    ...item,
    cover_path: item.coverPath,
    related_publication_ids_json: toJson(item.relatedPublicationIds),
    related_photo_ids_json: toJson(item.relatedPhotoIds),
    related_material_ids_json: toJson(item.relatedMaterialIds),
    related_topic_ids_json: toJson(item.relatedTopicIds),
    related_archive_ids_json: toJson(item.relatedArchiveIds),
  };
}

export function createMapPlace(input: Omit<MapPlace, "id"> & { id?: string | null }) {
  const item: MapPlace = { ...input, id: input.id || createId("place") };
  const timestamp = now();
  db()
    .prepare(`
      INSERT INTO map_places (
        id, title, desc, lat, lng, year, year_end, era, region, cover_path,
        related_publication_ids_json, related_photo_ids_json, related_material_ids_json,
        related_topic_ids_json, related_archive_ids_json, created_at, updated_at
      ) VALUES (
        @id, @title, @desc, @lat, @lng, @year, @yearEnd, @era, @region, @cover_path,
        @related_publication_ids_json, @related_photo_ids_json, @related_material_ids_json,
        @related_topic_ids_json, @related_archive_ids_json, @created_at, @updated_at
      )
    `)
    .run({ ...placeWriteParams(item), created_at: timestamp, updated_at: timestamp });
  return item;
}

export function updateMapPlace(id: string, patch: Partial<MapPlace>) {
  const current = getPortalSnapshot().mapPlaces.find((p) => p.id === id);
  if (!current) return null;
  const next = { ...current, ...patch, id };
  db()
    .prepare(`
      UPDATE map_places SET
        title = @title, desc = @desc, lat = @lat, lng = @lng, year = @year, year_end = @yearEnd,
        era = @era, region = @region, cover_path = @cover_path,
        related_publication_ids_json = @related_publication_ids_json,
        related_photo_ids_json = @related_photo_ids_json,
        related_material_ids_json = @related_material_ids_json,
        related_topic_ids_json = @related_topic_ids_json,
        related_archive_ids_json = @related_archive_ids_json,
        updated_at = @updated_at
      WHERE id = @id
    `)
    .run({ ...placeWriteParams(next), updated_at: now() });
  return next;
}

export function deleteMapPlace(id: string) {
  db().prepare("DELETE FROM map_places WHERE id = ?").run(id);
}

// ── Сообщения из формы обратной связи ──────────────────────────────

export function createMessage(input: { name: string; email: string; body: string }) {
  const item: ContactMessage = {
    id: createId("msg"),
    name: input.name.trim().slice(0, 120),
    email: input.email.trim().slice(0, 160),
    body: input.body.trim().slice(0, 4000),
    isRead: false,
    createdAt: now(),
  };
  db()
    .prepare(`
      INSERT INTO messages (id, name, email, body, is_read, created_at)
      VALUES (@id, @name, @email, @body, 0, @createdAt)
    `)
    .run(item);
  return item;
}

export function getMessages(): ContactMessage[] {
  return fetchRows("SELECT * FROM messages ORDER BY created_at DESC", mapMessage);
}

export function markMessageRead(id: string, isRead: boolean) {
  db().prepare("UPDATE messages SET is_read = ? WHERE id = ?").run(isRead ? 1 : 0, id);
}

export function deleteMessage(id: string) {
  db().prepare("DELETE FROM messages WHERE id = ?").run(id);
}

export function getUiText(): UiText {
  const rows = db()
    .prepare("SELECT key, value FROM ui_text")
    .all() as Array<{ key: string; value: string }>;

  const overrides = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  // Дефолты из кода + переопределения из БД
  return { ...defaultUiText, ...overrides };
}

export function updateUiText(key: string, value: string): UiText {
  db()
    .prepare(`
      INSERT INTO ui_text (key, value, updated_at)
      VALUES (@key, @value, @updated_at)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `)
    .run({ key, value, updated_at: now() });

  return getUiText();
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

// Collect all file paths used by records OTHER than excludeId
function collectOtherRefs(excludeId: string): Set<string> {
  const snap = getPortalSnapshot();
  const refs = new Set<string>();
  const add = (p: string | null | undefined) => { if (p) refs.add(p); };

  for (const m of snap.materials) {
    if (m.id === excludeId) continue;
    add(m.filePath); add(m.previewPath);
    m.attachments.forEach((a) => add(a.path));
  }
  for (const p of snap.publications) {
    if (p.id === excludeId) continue;
    add(p.pdfPath);
    p.attachments.forEach((a) => add(a.path));
  }
  for (const p of snap.photos) {
    if (p.id === excludeId) continue;
    add(p.imagePath);
  }
  for (const t of snap.topics) {
    if (t.id === excludeId) continue;
    add(t.coverPath);
    t.attachments.forEach((a) => add(a.path));
  }
  for (const a of snap.archiveItems) {
    if (a.id === excludeId) continue;
    add(a.filePath);
    a.attachments.forEach((att) => add(att.path));
  }
  for (const l of snap.libraryItems) {
    if (l.id === excludeId) continue;
    add(l.pdfPath);
  }
  return refs;
}

// Delete a file from disk only if no OTHER record references it
function deleteFileIfUnused(relativePath: string | null | undefined, otherRefs: Set<string>) {
  if (!relativePath || !relativePath.startsWith("/uploads/")) return;
  if (otherRefs.has(relativePath)) return; // used elsewhere — keep it
  try {
    const full = path.join(process.cwd(), "public", relativePath);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {
    // Ignore — file may already be gone
  }
}

function deleteFile(relativePath: string | null | undefined) {
  deleteFileIfUnused(relativePath, new Set());
}

function deleteFiles(paths: (string | null | undefined)[]) {
  for (const p of paths) deleteFile(p);
}

export function createMaterial(
  input: Omit<Material, "id"> & { id?: string | null },
) {
  const item: Material = { ...input, id: input.id || createId("m") };
  const timestamp = now();

  db()
    .prepare(`
      INSERT INTO materials (
        id, title, discipline, mtype, year, language, status, access, tags_json, desc, course,
        file_path, preview_path, created_at, updated_at, attachments_json, related_topic_ids_json
      ) VALUES (
        @id, @title, @discipline, @mtype, @year, @language, @status, @access, @tags_json, @desc, @course,
        @file_path, @preview_path, @created_at, @updated_at, @attachments_json, @related_topic_ids_json
      )
    `)
    .run({
      ...item,
      tags_json: toJson(item.tags),
      file_path: item.filePath,
      preview_path: item.previewPath,
      created_at: timestamp,
      updated_at: timestamp,
      attachments_json: toJson(item.attachments || []),
      related_topic_ids_json: toJson(item.relatedTopicIds || []),
    });

  return item;
}

export function updateMaterial(id: string, patch: Partial<Material>) {
  const current = getPortalSnapshot().materials.find((item) => item.id === id);
  if (!current) {
    return null;
  }

  const next = { ...current, ...patch, id };
  db()
    .prepare(`
      UPDATE materials
      SET title = @title, discipline = @discipline, mtype = @mtype, year = @year, language = @language,
          status = @status, access = @access, tags_json = @tags_json, desc = @desc, course = @course,
          file_path = @file_path, preview_path = @preview_path, updated_at = @updated_at,
          attachments_json = @attachments_json, related_topic_ids_json = @related_topic_ids_json
      WHERE id = @id
    `)
    .run({
      ...next,
      tags_json: toJson(next.tags),
      file_path: next.filePath,
      preview_path: next.previewPath,
      updated_at: now(),
      attachments_json: toJson(next.attachments || []),
      related_topic_ids_json: toJson(next.relatedTopicIds || []),
    });

  return next;
}

export function deleteMaterial(id: string) {
  const item = getPortalSnapshot().materials.find((m) => m.id === id);
  if (item) {
    const refs = collectOtherRefs(id);
    [item.filePath, item.previewPath, ...item.attachments.map((a) => a.path)]
      .forEach((p) => deleteFileIfUnused(p, refs));
  }
  db().prepare("DELETE FROM materials WHERE id = ?").run(id);
}

export function createPublication(
  input: Omit<Publication, "id"> & { id?: string | null },
) {
  const item: Publication = { ...input, id: input.id || createId("p") };
  const timestamp = now();

  db()
    .prepare(`
      INSERT INTO publications (
        id, year, authors, title, ptype, journal, doi, external_url, pdf_path, pdf_public, summary, topic, region, age,
        keywords_json, language, featured, access, created_at, updated_at, attachments_json, related_topic_ids_json
      ) VALUES (
        @id, @year, @authors, @title, @ptype, @journal, @doi, @external_url, @pdf_path, @pdf_public, @summary, @topic, @region, @age,
        @keywords_json, @language, @featured, @access, @created_at, @updated_at, @attachments_json, @related_topic_ids_json
      )
    `)
    .run({
      ...item,
      external_url: item.externalUrl,
      pdf_path: item.pdfPath,
      pdf_public: item.pdfPublic ? 1 : 0,
      keywords_json: toJson(item.keywords),
      featured: item.featured ? 1 : 0,
      created_at: timestamp,
      updated_at: timestamp,
      attachments_json: toJson(item.attachments || []),
      related_topic_ids_json: toJson(item.relatedTopicIds || []),
    });

  return item;
}

export function updatePublication(id: string, patch: Partial<Publication>) {
  const current = getPortalSnapshot().publications.find((item) => item.id === id);
  if (!current) {
    return null;
  }

  const next = { ...current, ...patch, id };
  db()
    .prepare(`
      UPDATE publications
      SET year = @year, authors = @authors, title = @title, ptype = @ptype, journal = @journal,
          doi = @doi, external_url = @external_url, pdf_path = @pdf_path, pdf_public = @pdf_public, summary = @summary,
          topic = @topic, region = @region, age = @age, keywords_json = @keywords_json,
          language = @language, featured = @featured, access = @access, updated_at = @updated_at,
          attachments_json = @attachments_json, related_topic_ids_json = @related_topic_ids_json
      WHERE id = @id
    `)
    .run({
      ...next,
      external_url: next.externalUrl,
      pdf_path: next.pdfPath,
      pdf_public: next.pdfPublic ? 1 : 0,
      keywords_json: toJson(next.keywords),
      featured: next.featured ? 1 : 0,
      updated_at: now(),
      attachments_json: toJson(next.attachments || []),
      related_topic_ids_json: toJson(next.relatedTopicIds || []),
    });

  return next;
}

export function deletePublication(id: string) {
  const item = getPortalSnapshot().publications.find((p) => p.id === id);
  if (item) {
    const refs = collectOtherRefs(id);
    [item.pdfPath, ...item.attachments.map((a) => a.path)]
      .forEach((p) => deleteFileIfUnused(p, refs));
  }
  db().prepare("DELETE FROM publications WHERE id = ?").run(id);
}

export function createPhoto(input: Omit<Photo, "id"> & { id?: string | null }) {
  const item: Photo = { ...input, id: input.id || createId("f") };
  const timestamp = now();

  db()
    .prepare(`
      INSERT INTO photos (
        id, title, year, image_path, location, region, otype, age, desc, author, tags_json, usage_policy,
        group_name, access, status, related_publication_ids_json, related_topic_ids_json, tint, created_at, updated_at
      ) VALUES (
        @id, @title, @year, @image_path, @location, @region, @otype, @age, @desc, @author, @tags_json, @usage_policy,
        @group_name, @access, @status, @related_publication_ids_json, @related_topic_ids_json, @tint, @created_at, @updated_at
      )
    `)
    .run({
      ...item,
      image_path: item.imagePath,
      tags_json: toJson(item.tags),
      usage_policy: item.usagePolicy,
      group_name: item.group,
      related_publication_ids_json: toJson(item.relatedPublicationIds),
      related_topic_ids_json: toJson(item.relatedTopicIds),
      created_at: timestamp,
      updated_at: timestamp,
    });

  return item;
}

export function updatePhoto(id: string, patch: Partial<Photo>) {
  const current = getPortalSnapshot().photos.find((item) => item.id === id);
  if (!current) {
    return null;
  }

  const next = { ...current, ...patch, id };
  db()
    .prepare(`
      UPDATE photos
      SET title = @title, year = @year, image_path = @image_path, location = @location, region = @region,
          otype = @otype, age = @age, desc = @desc, author = @author, tags_json = @tags_json,
          usage_policy = @usage_policy, group_name = @group_name, access = @access, status = @status,
          related_publication_ids_json = @related_publication_ids_json,
          related_topic_ids_json = @related_topic_ids_json, tint = @tint, updated_at = @updated_at
      WHERE id = @id
    `)
    .run({
      ...next,
      image_path: next.imagePath,
      tags_json: toJson(next.tags),
      usage_policy: next.usagePolicy,
      group_name: next.group,
      related_publication_ids_json: toJson(next.relatedPublicationIds),
      related_topic_ids_json: toJson(next.relatedTopicIds),
      updated_at: now(),
    });

  return next;
}

export function deletePhoto(id: string) {
  const item = getPortalSnapshot().photos.find((p) => p.id === id);
  if (item) deleteFileIfUnused(item.imagePath, collectOtherRefs(id));
  db().prepare("DELETE FROM photos WHERE id = ?").run(id);
}

export function createTopic(input: Omit<Topic, "id" | "pubs" | "photos" | "archive" | "attachments"> & { id?: string | null; attachments?: Array<{ name: string; path: string; size?: number }> }) {
  const item: Topic = {
    ...input,
    id: input.id || createId("t"),
    pubs: input.relatedPublicationIds.length,
    photos: input.relatedPhotoIds.length,
    archive: input.relatedArchiveIds.length,
    attachments: input.attachments || [],
  };
  const timestamp = now();

  db()
    .prepare(`
      INSERT INTO topics (
        id, name, region, age, desc, body, cover_path, keywords_json, access,
        related_publication_ids_json, related_photo_ids_json, related_archive_ids_json, created_at, updated_at, attachments_json
      ) VALUES (
        @id, @name, @region, @age, @desc, @body, @cover_path, @keywords_json, @access,
        @related_publication_ids_json, @related_photo_ids_json, @related_archive_ids_json, @created_at, @updated_at, @attachments_json
      )
    `)
    .run({
      ...item,
      cover_path: item.coverPath,
      keywords_json: toJson(item.keywords),
      related_publication_ids_json: toJson(item.relatedPublicationIds),
      related_photo_ids_json: toJson(item.relatedPhotoIds),
      related_archive_ids_json: toJson(item.relatedArchiveIds),
      created_at: timestamp,
      updated_at: timestamp,
      attachments_json: toJson(item.attachments || []),
    });

  return item;
}

export function updateTopic(id: string, patch: Partial<Topic>) {
  const current = getPortalSnapshot().topics.find((item) => item.id === id);
  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...patch,
    id,
  };
  next.pubs = next.relatedPublicationIds.length;
  next.photos = next.relatedPhotoIds.length;
  next.archive = next.relatedArchiveIds.length;

  db()
    .prepare(`
      UPDATE topics
      SET name = @name, region = @region, age = @age, desc = @desc, body = @body, cover_path = @cover_path,
          keywords_json = @keywords_json, access = @access,
          related_publication_ids_json = @related_publication_ids_json,
          related_photo_ids_json = @related_photo_ids_json,
          related_archive_ids_json = @related_archive_ids_json,
          updated_at = @updated_at, attachments_json = @attachments_json
      WHERE id = @id
    `)
    .run({
      ...next,
      cover_path: next.coverPath,
      keywords_json: toJson(next.keywords),
      related_publication_ids_json: toJson(next.relatedPublicationIds),
      related_photo_ids_json: toJson(next.relatedPhotoIds),
      related_archive_ids_json: toJson(next.relatedArchiveIds),
      updated_at: now(),
      attachments_json: toJson(next.attachments || []),
    });

  return next;
}

export type TopicRelationSelection = {
  materials: string[];
  publications: string[];
  photos: string[];
  archive: string[];
  library: string[];
  mapPlaces: string[];
};

const relationTables = {
  materials: "materials",
  publications: "publications",
  photos: "photos",
  archive: "archive_items",
  library: "library_items",
  mapPlaces: "map_places",
} as const;

export function syncTopicRelations(
  topicId: string,
  selections: TopicRelationSelection,
  replacements: Record<string, string> = {},
) {
  const database = db();
  const topicIds = new Set(
    (database.prepare("SELECT id FROM topics").all() as Array<{ id: string }>).map((row) => row.id),
  );
  if (!topicIds.has(topicId)) throw new Error("Научная тема не найдена");

  const transaction = database.transaction(() => {
    for (const [kind, table] of Object.entries(relationTables) as Array<[keyof TopicRelationSelection, string]>) {
      const desired = new Set(selections[kind] || []);
      const rows = database
        .prepare(`SELECT id, related_topic_ids_json FROM ${table}`)
        .all() as Array<{ id: string; related_topic_ids_json: string | null }>;
      const update = database.prepare(`UPDATE ${table} SET related_topic_ids_json = ?, updated_at = ? WHERE id = ?`);

      for (const row of rows) {
        const current = fromJsonArray(row.related_topic_ids_json);
        const linked = current.includes(topicId);
        const shouldLink = desired.has(row.id);
        const replacement = replacements[`${kind}:${row.id}`];
        if (!linked && !shouldLink && replacement) {
          if (replacement === topicId || !topicIds.has(replacement)) {
            throw new Error(`Для материала «${row.id}» выбрана некорректная научная тема`);
          }
          update.run(toJson([...new Set([...current, replacement])]), now(), row.id);
          continue;
        }
        if (linked === shouldLink) continue;

        let next = shouldLink
          ? [...new Set([...current, topicId])]
          : current.filter((id) => id !== topicId);

        if (!shouldLink && next.length === 0) {
          if (!replacement || replacement === topicId || !topicIds.has(replacement)) {
            throw new Error(`Материал «${row.id}» должен быть привязан хотя бы к одной научной теме`);
          }
          next = [replacement];
        }

        update.run(toJson(next), now(), row.id);
      }
    }

    database.prepare(`
      UPDATE topics SET
        related_publication_ids_json = ?, related_photo_ids_json = ?, related_archive_ids_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      toJson(selections.publications || []),
      toJson(selections.photos || []),
      toJson(selections.archive || []),
      now(),
      topicId,
    );
  });

  transaction();
  return { ok: true };
}

export function deleteTopic(id: string) {
  const item = getPortalSnapshot().topics.find((t) => t.id === id);
  if (item) {
    const refs = collectOtherRefs(id);
    [item.coverPath, ...item.attachments.map((a) => a.path)]
      .forEach((p) => deleteFileIfUnused(p, refs));
  }
  db().prepare("DELETE FROM topics WHERE id = ?").run(id);
}

export function createArchiveItem(
  input: Omit<ArchiveItem, "id" | "statusLabel" | "attachments"> & { id?: string | null; statusLabel?: string; attachments?: Array<{ name: string; path: string; size?: number }> },
) {
  const item: ArchiveItem = {
    ...input,
    id: input.id || createId("a"),
    statusLabel: input.statusLabel || accessLabel(input.access),
    attachments: input.attachments || [],
  };
  const timestamp = now();

  db()
    .prepare(`
      INSERT INTO archive_items (
        id, title, atype, desc, file_path, year, region, topic, owner_comment, access, status_label,
        related_publication_ids_json, related_photo_ids_json, dot, created_at, updated_at, attachments_json, related_topic_ids_json
      ) VALUES (
        @id, @title, @atype, @desc, @file_path, @year, @region, @topic, @owner_comment, @access, @status_label,
        @related_publication_ids_json, @related_photo_ids_json, @dot, @created_at, @updated_at, @attachments_json, @related_topic_ids_json
      )
    `)
    .run({
      ...item,
      file_path: item.filePath,
      owner_comment: item.ownerComment,
      status_label: item.statusLabel,
      related_publication_ids_json: toJson(item.relatedPublicationIds),
      related_photo_ids_json: toJson(item.relatedPhotoIds),
      created_at: timestamp,
      updated_at: timestamp,
      attachments_json: toJson(item.attachments || []),
      related_topic_ids_json: toJson(item.relatedTopicIds || []),
    });

  return item;
}

export function updateArchiveItem(id: string, patch: Partial<ArchiveItem>) {
  const current = getPortalSnapshot().archiveItems.find((item) => item.id === id);
  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...patch,
    id,
  };
  next.statusLabel = patch.statusLabel || accessLabel(next.access);

  db()
    .prepare(`
      UPDATE archive_items
      SET title = @title, atype = @atype, desc = @desc, file_path = @file_path, year = @year, region = @region,
          topic = @topic, owner_comment = @owner_comment, access = @access, status_label = @status_label,
          related_publication_ids_json = @related_publication_ids_json,
          related_photo_ids_json = @related_photo_ids_json, dot = @dot, updated_at = @updated_at,
          attachments_json = @attachments_json, related_topic_ids_json = @related_topic_ids_json
      WHERE id = @id
    `)
    .run({
      ...next,
      file_path: next.filePath,
      owner_comment: next.ownerComment,
      status_label: next.statusLabel,
      related_publication_ids_json: toJson(next.relatedPublicationIds),
      related_photo_ids_json: toJson(next.relatedPhotoIds),
      updated_at: now(),
      attachments_json: toJson(next.attachments || []),
      related_topic_ids_json: toJson(next.relatedTopicIds || []),
    });

  return next;
}

export function deleteArchiveItem(id: string) {
  const item = getPortalSnapshot().archiveItems.find((a) => a.id === id);
  if (item) {
    const refs = collectOtherRefs(id);
    [item.filePath, ...item.attachments.map((a) => a.path)]
      .forEach((p) => deleteFileIfUnused(p, refs));
  }
  db().prepare("DELETE FROM archive_items WHERE id = ?").run(id);
}

export function createLibraryItem(
  input: Omit<LibraryItem, "id"> & { id?: string | null },
) {
  const item: LibraryItem = { ...input, id: input.id || createId("lib") };
  const timestamp = now();

  db()
    .prepare(`
      INSERT INTO library_items (id, title, authors, year, category, source, pdf_path, notes, access, created_at, updated_at, related_topic_ids_json)
      VALUES (@id, @title, @authors, @year, @category, @source, @pdf_path, @notes, @access, @created_at, @updated_at, @related_topic_ids_json)
    `)
    .run({
      ...item,
      pdf_path: item.pdfPath,
      created_at: timestamp,
      updated_at: timestamp,
      related_topic_ids_json: toJson(item.relatedTopicIds || []),
    });

  return item;
}

export function updateLibraryItem(id: string, patch: Partial<LibraryItem>) {
  const current = getPortalSnapshot().libraryItems.find((item) => item.id === id);
  if (!current) return null;

  const next = { ...current, ...patch, id };
  db()
    .prepare(`
      UPDATE library_items
      SET title = @title, authors = @authors, year = @year, category = @category,
          source = @source, pdf_path = @pdf_path, notes = @notes, access = @access, updated_at = @updated_at,
          related_topic_ids_json = @related_topic_ids_json
      WHERE id = @id
    `)
    .run({ ...next, pdf_path: next.pdfPath, updated_at: now(), related_topic_ids_json: toJson(next.relatedTopicIds || []) });

  return next;
}

export function deleteLibraryItem(id: string) {
  const item = getPortalSnapshot().libraryItems.find((l) => l.id === id);
  if (item) {
    const refs = collectOtherRefs(id);
    deleteFileIfUnused(item.pdfPath, refs);
  }
  db().prepare("DELETE FROM library_items WHERE id = ?").run(id);
}

export function updatePage(slug: "home" | "about", payload: HomePageContent | AboutPageContent) {
  db()
    .prepare(`
      INSERT INTO pages (slug, payload_json, updated_at)
      VALUES (@slug, @payload_json, @updated_at)
      ON CONFLICT(slug) DO UPDATE SET
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `)
    .run({
      slug,
      payload_json: toJson(payload),
      updated_at: now(),
    });

  return payload;
}

// ── Аналитика посещаемости (встроенная, без внешних сервисов) ──────

export function recordPageView(path: string) {
  db()
    .prepare("INSERT INTO page_views (path, ts) VALUES (@path, @ts)")
    .run({ path, ts: now() });
}

export type AnalyticsSummary = {
  total: number;
  last30: number;
  last7: number;
  topPaths: Array<{ path: string; count: number }>;
  daily: Array<{ day: string; count: number }>;
};

export function getAnalytics(): AnalyticsSummary {
  const database = db();
  const cutoff = (days: number) =>
    new Date(Date.now() - days * 86400000).toISOString();

  const total =
    (database.prepare("SELECT COUNT(*) AS c FROM page_views").get() as { c: number }).c;
  const last30 = (
    database.prepare("SELECT COUNT(*) AS c FROM page_views WHERE ts >= ?").get(cutoff(30)) as {
      c: number;
    }
  ).c;
  const last7 = (
    database.prepare("SELECT COUNT(*) AS c FROM page_views WHERE ts >= ?").get(cutoff(7)) as {
      c: number;
    }
  ).c;
  const topPaths = database
    .prepare(
      "SELECT path, COUNT(*) AS count FROM page_views GROUP BY path ORDER BY count DESC LIMIT 8",
    )
    .all() as Array<{ path: string; count: number }>;
  const daily = database
    .prepare(
      `SELECT substr(ts, 1, 10) AS day, COUNT(*) AS count
       FROM page_views WHERE ts >= ?
       GROUP BY day ORDER BY day ASC`,
    )
    .all(cutoff(14)) as Array<{ day: string; count: number }>;

  return { total, last30, last7, topPaths, daily };
}

// ── Полнотекстовый поиск (SQLite FTS5) ─────────────────────────────

export type SearchHit = { kind: string; id: string };

function ensureSearchIndex() {
  db().exec(
    `CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
       kind UNINDEXED, ref_id UNINDEXED, title, body,
       tokenize = 'unicode61 remove_diacritics 2'
     );`,
  );
}

// Индекс маленький (десятки записей) — перестраиваем при каждом поиске,
// чтобы он всегда был синхронен с актуальными данными.
function rebuildSearchIndex() {
  const database = db();
  ensureSearchIndex();
  const snap = getPortalSnapshot();

  const insert = database.prepare(
    "INSERT INTO search_fts (kind, ref_id, title, body) VALUES (?, ?, ?, ?)",
  );

  // В поиск попадают только перечисляемые публично записи (open/students/request);
  // «по ссылке» (link) — нелистингуемые, в поиск не индексируются.
  const isPublic = (access: string, status?: string) =>
    (access === "open" || access === "students" || access === "request") &&
    status !== "draft";

  const tx = database.transaction(() => {
    database.exec("DELETE FROM search_fts");

    for (const m of snap.materials) {
      if (!isPublic(m.access, m.status)) continue;
      insert.run("material", m.id, m.title, `${m.desc} ${m.discipline} ${m.mtype} ${m.tags.join(" ")} ${m.year}`);
    }
    for (const p of snap.publications) {
      if (!isPublic(p.access)) continue;
      insert.run("publication", p.id, p.title, `${p.authors} ${p.journal} ${p.topic} ${p.region} ${p.age} ${p.summary} ${p.keywords.join(" ")} ${p.year}`);
    }
    for (const ph of snap.photos) {
      if (!isPublic(ph.access, ph.status)) continue;
      insert.run("photo", ph.id, ph.title, `${ph.desc} ${ph.region} ${ph.location} ${ph.otype} ${ph.age} ${ph.tags.join(" ")} ${ph.year}`);
    }
    for (const t of snap.topics) {
      if (!isPublic(t.access)) continue;
      insert.run("topic", t.id, t.name, `${t.desc} ${t.body} ${t.region} ${t.age} ${t.keywords.join(" ")}`);
    }
    for (const a of snap.archiveItems) {
      if (!isPublic(a.access)) continue;
      insert.run("archive", a.id, a.title, `${a.desc} ${a.atype} ${a.region} ${a.topic} ${a.year}`);
    }
    for (const l of snap.libraryItems) {
      if (!isPublic(l.access)) continue;
      insert.run("library", l.id, l.title, `${l.authors} ${l.source} ${l.category} ${l.notes} ${l.year}`);
    }
  });

  tx();
}

export function searchPortal(query: string): SearchHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  rebuildSearchIndex();

  // Каждое слово — префиксный поиск, объединяются по И.
  // Чистим спецсимволы FTS, оставляя буквы/цифры (в т.ч. кириллицу).
  const matchExpr = trimmed
    .split(/\s+/)
    .map((term) => term.replace(/[^\p{L}\p{N}]+/gu, ""))
    .filter(Boolean)
    .map((term) => `${term}*`)
    .join(" ");

  if (!matchExpr) return [];

  try {
    const rows = db()
      .prepare(
        `SELECT kind, ref_id AS id
         FROM search_fts
         WHERE search_fts MATCH ?
         ORDER BY bm25(search_fts)
         LIMIT 100`,
      )
      .all(matchExpr) as SearchHit[];
    return rows;
  } catch {
    return [];
  }
}

export function resetAllData() {
  const database = db();
  database.exec(`
    DELETE FROM materials;
    DELETE FROM publications;
    DELETE FROM photos;
    DELETE FROM topics;
    DELETE FROM archive_items;
    DELETE FROM library_items;
    DELETE FROM pages;
  `);
  insertSeedRecords(database);
}
