"use client";

import { usePortal } from "@/components/portal-provider";
import { PortalDetailModal } from "@/components/portal-detail-modal";
import { Check } from "lucide-react";

export function PortalGlobalOverlay() {
  const { state, closeDetail } = usePortal();

  return (
    <>
      <PortalDetailModal detail={state.detail} onClose={closeDetail} />

      {state.toast ? (
        <div className="toast">
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "var(--clay2)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              flexShrink: 0,
            }}
          >
            <Check size={11} strokeWidth={2.5} />
          </span>
          {state.toast}
        </div>
      ) : null}
    </>
  );
}
