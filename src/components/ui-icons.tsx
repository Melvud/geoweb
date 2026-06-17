// Central re-exports of Lucide icons used across the admin/public UI.
// Import from here to keep lucide-react in one place.

export {
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  Sun,
  Moon,
  Folder,
  FolderOpen,
  File,
  FileText,
  Sheet,
  Archive,
  BookOpen,
  Paperclip,
  Download,
  Upload,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Plus,
  Bot,
  Image as ImageIcon,
  LayoutGrid,
  List,
} from "lucide-react";

import {
  FileText,
  Archive,
  File,
  Image as LucideImage,
  Sheet,
} from "lucide-react";

/** Icon for a file based on its extension. Size defaults to 16. */
export function FileIcon({ ext, size = 16 }: { ext: string; size?: number }) {
  const e = (ext ?? "").toLowerCase();
  if (e === "pdf") return <FileText size={size} strokeWidth={1.5} />;
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(e))
    return <LucideImage size={size} strokeWidth={1.5} />;
  if (["doc", "docx", "odt", "txt"].includes(e))
    return <FileText size={size} strokeWidth={1.5} />;
  if (["xls", "xlsx", "csv"].includes(e))
    return <Sheet size={size} strokeWidth={1.5} />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(e))
    return <Archive size={size} strokeWidth={1.5} />;
  return <File size={size} strokeWidth={1.5} />;
}
