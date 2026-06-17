import { PublicResearchView } from "@/components/views/public-research-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Научная работа · Геопортал В. В. Силантьева",
  description: "Основные направления научных исследований, темы и проекты профессора В. В. Силантьева.",
};

export default function ResearchPage() {
  return <PublicResearchView />;
}
