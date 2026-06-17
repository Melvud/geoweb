import { AdminTopicsView } from "@/components/views/admin-topics-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Научные темы · Админка",
};

export default function AdminTopicsPage() {
  return <AdminTopicsView />;
}
