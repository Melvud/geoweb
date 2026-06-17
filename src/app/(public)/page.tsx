import { PublicHomeView } from "@/components/views/public-home-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Главная · Геопортал В. В. Силантьева",
  description: "Персональный научно-образовательный геопортал профессора-геолога В. В. Силантьева.",
};

export default function HomePage() {
  return <PublicHomeView />;
}
