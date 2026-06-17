import { PublicArchiveView } from "@/components/views/public-archive-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Архив · Геопортал В. В. Силантьева",
  description: "Неопубликованные архивные материалы, полевые дневники и схемы.",
};

export default function ArchivePage() {
  return <PublicArchiveView />;
}
