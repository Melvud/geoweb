import { Suspense } from "react";
import { PublicSearchView } from "@/components/views/public-search-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Поиск по сайту · Геопортал В. В. Силантьева",
  description: "Результаты поиска по научным, учебным и архивным материалам.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <PublicSearchView />
    </Suspense>
  );
}
