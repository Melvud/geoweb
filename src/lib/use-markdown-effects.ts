"use client";

import { useEffect } from "react";

export function useMarkdownEffects(trigger: any) {
  useEffect(() => {
    let intervalId: any;
    let attempts = 0;

    const runRenderers = () => {
      let allDone = true;

      // 1. KaTeX Math Auto-render
      if (typeof window !== "undefined" && (window as any).renderMathInElement) {
        const elements = document.querySelectorAll(".markdown-body");
        elements.forEach((el) => {
          (window as any).renderMathInElement(el, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false },
              { left: "\\(", right: "\\)", display: false },
              { left: "\\[", right: "\\]", display: true }
            ],
            throwOnError: false
          });
        });
      } else {
        allDone = false;
      }

      // 2. Mermaid Diagrams
      if (typeof window !== "undefined" && (window as any).mermaid) {
        const mermaid = (window as any).mermaid;
        try {
          // Only initialize once; guard with a flag on the mermaid object
          if (!(window as any).__mermaidInitialized) {
            mermaid.initialize({
              startOnLoad: false,
              theme: "neutral",
              securityLevel: "loose",
            });
            (window as any).__mermaidInitialized = true;
          }
          // Only process elements not yet rendered (no data-processed attribute)
          const nodes = Array.from(
            document.querySelectorAll<HTMLElement>("pre.mermaid:not([data-processed])")
          );
          if (nodes.length > 0) {
            mermaid.run({ nodes }).catch(() => {});
          }
        } catch (e) {
          // Silence initialization errors
        }
      } else {
        allDone = false;
      }

      // If both are loaded and run, or we reached max attempts (3 seconds), stop polling
      if (allDone || attempts > 10) {
        clearInterval(intervalId);
      }
      attempts++;
    };

    // Run immediately
    runRenderers();

    // Poll to wait for CDN scripts if they are loading deferred
    intervalId = setInterval(runRenderers, 300);

    return () => clearInterval(intervalId);
  }, [trigger]);
}

export function MarkdownEffectsTrigger({ trigger }: { trigger?: any }) {
  useMarkdownEffects(trigger);
  return null;
}
