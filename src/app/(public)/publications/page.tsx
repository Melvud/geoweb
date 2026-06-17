import { PublicPublicationsView } from "@/components/views/public-publications-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Публикации · Геопортал В. В. Силантьева",
  description: "Научные статьи, монографии и тезисы докладов профессора В. В. Силантьева.",
};

export default function PublicationsPage() {
  return <PublicPublicationsView />;
}
