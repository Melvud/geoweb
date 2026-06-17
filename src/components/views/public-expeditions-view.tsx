"use client";

import { EditableText } from "@/components/editable-text";
import { ExpeditionsExplorer } from "@/components/expeditions-explorer";

export function PublicExpeditionsView() {
  return (
    <section className="public-section">
      <EditableText as="div" id="expeditions.kicker" className="section-kicker" style={{ marginBottom: 14 }} />
      <EditableText as="h1" id="expeditions.title" className="page-title" style={{ marginBottom: 12 }} />
      <EditableText
        as="p"
        id="expeditions.subtitle"
        className="page-copy"
        multiline
        style={{ margin: "0 0 28px", maxWidth: 620 }}
      />
      <ExpeditionsExplorer height={520} />
    </section>
  );
}
