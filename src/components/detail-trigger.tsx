"use client";

import { usePortal } from "@/components/portal-provider";
import type { DetailState } from "@/lib/portal-types";
import React from "react";

type DetailTriggerProps = {
  detail: DetailState;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export function DetailTrigger({ detail, className, style, children }: DetailTriggerProps) {
  const { openDetail } = usePortal();
  
  return (
    <div 
      className={className} 
      style={{ cursor: "pointer", ...style }} 
      onClick={(e) => {
        // Prevent default if it's an anchor tag or wrapped in something, though it's a div
        // We only trigger if the user didn't click on a link or button inside
        const target = e.target as HTMLElement;
        if (target.closest("a") || target.closest("button")) {
          return;
        }
        openDetail(detail);
      }}
    >
      {children}
    </div>
  );
}
