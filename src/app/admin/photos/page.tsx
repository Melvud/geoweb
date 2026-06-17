import { AdminPhotosView } from "@/components/views/admin-photos-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Фотоархив · Админка",
};

export default function AdminPhotosPage() {
  return <AdminPhotosView />;
}
