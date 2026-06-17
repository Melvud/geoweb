import { Suspense } from "react";
import { PublicStudentsView } from "@/components/views/public-students-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Студентам · Геопортал В. В. Силантьева",
  description: "Учебные материалы, лекции, презентации и задания по геологическим дисциплинам.",
};

export default function StudentsPage() {
  return (
    <Suspense fallback={null}>
      <PublicStudentsView />
    </Suspense>
  );
}
