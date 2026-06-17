"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePortal } from "@/components/portal-provider";
import { PortalTopbar } from "@/components/portal-topbar";
import { PortalPublicNav } from "@/components/portal-public-nav";
import { PortalPublicFooter } from "@/components/portal-public-footer";
import { PageViewTracker } from "@/components/page-view-tracker";

type PublicRoute =
  | "home"
  | "about"
  | "students"
  | "research"
  | "publications"
  | "photos"
  | "expeditions"
  | "archive"
  | "library"
  | "contacts"
  | "search";

function mapPublicRoute(pathname: string): PublicRoute {
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/students")) return "students";
  if (pathname.startsWith("/research")) return "research";
  if (pathname.startsWith("/publications")) return "publications";
  if (pathname.startsWith("/photos")) return "photos";
  if (pathname.startsWith("/expeditions")) return "expeditions";
  if (pathname.startsWith("/archive")) return "archive";
  if (pathname.startsWith("/library")) return "library";
  if (pathname.startsWith("/contacts")) return "contacts";
  if (pathname.startsWith("/search")) return "search";
  return "home";
}

function PublicNavWrapper() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const publicRoute = mapPublicRoute(pathname);
  const searchQuery = publicRoute === "search" ? searchParams.get("q") ?? "" : "";

  const publicLinks: Array<{ key: PublicRoute; href: string }> = [
    { key: "home",         href: "/" },
    { key: "about",        href: "/about" },
    { key: "students",     href: "/students" },
    { key: "research",     href: "/research" },
    { key: "publications", href: "/publications" },
    { key: "photos",       href: "/photos" },
    { key: "archive",      href: "/archive" },
    { key: "library",      href: "/library" },
    { key: "contacts",     href: "/contacts" },
  ];

  function go(href: string) {
    router.push(href);
  }

  function onSearchInput(value: string) {
    router.replace(value.trim() ? `/search?q=${encodeURIComponent(value)}` : "/");
  }

  return (
    <PortalPublicNav
      publicLinks={publicLinks}
      publicRoute={publicRoute}
      searchQuery={searchQuery}
      onGo={go}
      onSearchInput={onSearchInput}
    />
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { state, setTheme, isAdminUnlocked } = usePortal();

  function go(href: string) {
    router.push(href);
  }

  return (
    <div className="app-shell">
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <PortalTopbar
        mode="public"
        theme={state.theme}
        savedLabel="Все изменения сохранены"
        showModeToggle={isAdminUnlocked}
        onGo={go}
        onToggleTheme={setTheme}
      />

      <Suspense fallback={null}>
        <PublicNavWrapper />
      </Suspense>

      {children}

      <PortalPublicFooter />
    </div>
  );
}
