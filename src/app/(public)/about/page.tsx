import { PublicAboutView } from "@/components/views/public-about-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Обо мне · Геопортал В. В. Силантьева",
  description: "Биография, научные интересы и контакты профессора-геолога В. В. Силантьева.",
};

export default function AboutPage() {
  return <PublicAboutView />;
}
