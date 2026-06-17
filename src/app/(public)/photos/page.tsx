import { PublicPhotosView } from "@/components/views/public-photos-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Фотоархив · Геопортал В. В. Силантьева",
  description: "Фотографии из экспедиций, геологических разрезов, образцов и окаменелостей.",
};

export default function PhotosPage() {
  return <PublicPhotosView />;
}
