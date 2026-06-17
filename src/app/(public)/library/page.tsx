import { PublicLibraryView } from "@/components/views/public-library-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Библиотека · Геопортал В. В. Силантьева",
  description: "Публикации других авторов, используемые в исследовательской работе.",
};

export default function LibraryPage() {
  return <PublicLibraryView />;
}
