import { AdminArchiveView } from "@/components/views/admin-archive-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Архивные материалы · Админка",
};

export default function AdminArchivePage() {
  return <AdminArchiveView />;
}
