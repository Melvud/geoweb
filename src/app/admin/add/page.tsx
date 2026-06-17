import { AdminAddView } from "@/components/views/admin-add-view";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Добавить материал · Админка",
};

export default function AdminAddPage() {
  return (
    <Suspense fallback={<div className="route"><div className="empty-state">Загрузка редактора...</div></div>}>
      <AdminAddView />
    </Suspense>
  );
}
