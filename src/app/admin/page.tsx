import { AdminDashboardView } from "@/components/views/admin-dashboard-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Панель управления · Админка",
};

export default function AdminDashboardPage() {
  return <AdminDashboardView />;
}
