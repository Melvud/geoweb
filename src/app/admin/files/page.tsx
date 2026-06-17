import { AdminFilesView } from "@/components/views/admin-files-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Файлы · Админка",
};

export default function AdminFilesPage() {
  return <AdminFilesView />;
}
