import type {
  AboutPageContent,
  HomePageContent,
} from "@/lib/page-content";
import type { UiText } from "@/lib/ui-text";

export type ThemeMode = "light" | "dark";
export type AccessLevel =
  | "open"
  | "students"
  | "link"
  | "request"
  | "hidden"
  | "owner";
export type MaterialStatus = "published" | "draft" | "hidden";
export type AddType =
  | "learning"
  | "publication"
  | "photo"
  | "topic"
  | "archive";
export type AddLayout = "split" | "focus";

export type Material = {
  id: string;
  title: string;
  discipline: string;
  mtype: string;
  year: string;
  language: string;
  status: MaterialStatus;
  access: AccessLevel;
  tags: string[];
  desc: string;
  course: string;
  filePath: string | null;
  previewPath: string | null;
  attachments: Array<{ name: string; path: string; size?: number }>;
};

export type Publication = {
  id: string;
  year: string;
  authors: string;
  title: string;
  ptype: string;
  journal: string;
  doi: string;
  externalUrl: string;
  pdfPath: string | null;
  summary: string;
  topic: string;
  region: string;
  age: string;
  keywords: string[];
  language: string;
  featured: boolean;
  access: AccessLevel;
  attachments: Array<{ name: string; path: string; size?: number }>;
};

export type Photo = {
  id: string;
  title: string;
  year: string;
  imagePath: string | null;
  location: string;
  region: string;
  otype: string;
  age: string;
  desc: string;
  author: string;
  tags: string[];
  usagePolicy: string;
  group: string;
  access: AccessLevel;
  status: MaterialStatus;
  relatedPublicationIds: string[];
  relatedTopicIds: string[];
  tint: string;
};

export type Topic = {
  id: string;
  name: string;
  region: string;
  age: string;
  desc: string;
  body: string;
  coverPath: string | null;
  keywords: string[];
  access: AccessLevel;
  relatedPublicationIds: string[];
  relatedPhotoIds: string[];
  relatedArchiveIds: string[];
  pubs: number;
  photos: number;
  archive: number;
  attachments: Array<{ name: string; path: string; size?: number }>;
};

export type LibraryItem = {
  id: string;
  title: string;
  authors: string;
  year: string;
  category: string;
  source: string;
  pdfPath: string | null;
  notes: string;
  access: AccessLevel;
};

export type ArchiveItem = {
  id: string;
  title: string;
  atype: string;
  desc: string;
  filePath: string | null;
  year: string;
  region: string;
  topic: string;
  ownerComment: string;
  access: AccessLevel;
  statusLabel: string;
  relatedPublicationIds: string[];
  relatedPhotoIds: string[];
  dot: string;
  attachments: Array<{ name: string; path: string; size?: number }>;
};

export type MapPlace = {
  id: string;
  title: string;
  desc: string;
  lat: number;
  lng: number;
  year: string;
  yearEnd: string;
  era: "historic" | "modern";
  region: string;
  coverPath: string | null;
  relatedPublicationIds: string[];
  relatedPhotoIds: string[];
  relatedMaterialIds: string[];
  relatedTopicIds: string[];
  relatedArchiveIds: string[];
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export type SitePages = {
  home: HomePageContent;
  about: AboutPageContent;
};

export type DetailState =
  | { kind: "mat"; item: Material }
  | { kind: "pub"; item: Publication }
  | { kind: "photo"; item: Photo }
  | { kind: "topic"; item: Topic }
  | { kind: "archive"; item: ArchiveItem }
  | { kind: "library"; item: LibraryItem }
  | null;

export type FormState = {
  entityId: string | null;
  type: AddType;
  title: string;
  discipline: string;
  mtype: string;
  desc: string;
  course: string;
  year: string;
  lang: string;
  access: AccessLevel;
  status: MaterialStatus;
  filePath: string | null;
  previewPath: string | null;
  tags: string[];
  tagDraft: string;
  authors: string;
  journal: string;
  doi: string;
  externalUrl: string;
  pdfPath: string | null;
  ptype: string;
  summary: string;
  topic: string;
  region: string;
  age: string;
  otype: string;
  imagePath: string | null;
  location: string;
  author: string;
  usagePolicy: string;
  groupName: string;
  body: string;
  coverPath: string | null;
  relatedPublicationIds: string[];
  relatedPhotoIds: string[];
  relatedTopicIds: string[];
  relatedArchiveIds: string[];
  ownerComment: string;
  featured: boolean;
  attachments: Array<{ name: string; path: string; size?: number }>;
};

export type MaterialFilter = {
  q: string;
  type: string;
  discipline: string;
  status: string;
  year: string;
};

export type PortalState = {
  theme: ThemeMode;
  addType: AddType;
  addLayout: AddLayout;
  form: FormState;
  draftAt: number | null;
  filter: MaterialFilter;
  pubCollection: string;
  pubQuery: string;
  searchQuery: string;
  publicDiscipline: string | null;
  detail: DetailState;
  toast: string | null;
  materials: Material[];
  publications: Publication[];
  photos: Photo[];
  topics: Topic[];
  archiveItems: ArchiveItem[];
  libraryItems: LibraryItem[];
  mapPlaces: MapPlace[];
  pages: SitePages;
  uiText: UiText;
  editMode: boolean;
  loaded: boolean;
};
