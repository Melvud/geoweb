import type { Metadata } from "next";
import { PublicExpeditionsView } from "@/components/views/public-expeditions-view";

export const metadata: Metadata = {
  title: "Экспедиции на карте · Геопортал В. В. Силантьева",
  description:
    "Интерактивная карта и хронология полевых экспедиций: исторические и современные точки, привязанные к фотографиям, публикациям и материалам.",
};

export default function ExpeditionsPage() {
  return <PublicExpeditionsView />;
}
