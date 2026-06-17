import type { Metadata } from "next";
import { PortalProvider } from "@/components/portal-provider";
import { PortalGlobalOverlay } from "@/components/portal-global-overlay";
import "./globals.css";

export const metadata: Metadata = {
  title: "Геопортал · В. В. Силантьев",
  description: "Персональный научно-образовательный геопортал",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme="light">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js" defer></script>
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" defer></script>
        <script src="https://cdn.jsdelivr.net/npm/mermaid@10.4.0/dist/mermaid.min.js" defer></script>
        {/* Приватная аналитика (Plausible) — включается заданием NEXT_PUBLIC_ANALYTICS_DOMAIN */}
        {process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN ? (
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN}
            src={`${process.env.NEXT_PUBLIC_ANALYTICS_SRC || "https://plausible.io/js/script.js"}`}
          />
        ) : null}
      </head>
      <body>
        <PortalProvider>
          {children}
          <PortalGlobalOverlay />
        </PortalProvider>
      </body>
    </html>
  );
}
