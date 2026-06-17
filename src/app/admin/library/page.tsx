import { AdminLibraryView } from "@/components/views/admin-library-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Библиотека · Админка",
};

export default function AdminLibraryPage() {
  return <AdminLibraryView />;
}
