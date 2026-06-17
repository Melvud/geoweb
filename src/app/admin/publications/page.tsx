import { AdminPublicationsView } from "@/components/views/admin-publications-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Все публикации · Админка",
};

export default function AdminPublicationsPage() {
  return <AdminPublicationsView />;
}
