import { AdminMaterialsView } from "@/components/views/admin-materials-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Все материалы · Админка",
};

export default function AdminMaterialsPage() {
  return <AdminMaterialsView />;
}
