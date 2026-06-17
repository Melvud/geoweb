"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePortal } from "@/components/portal-provider";
import { PortalTopbar } from "@/components/portal-topbar";
import { PortalAdminSidebar } from "@/components/portal-admin-sidebar";

type AdminRoute = "dashboard" | "materials" | "publications" | "photos" | "topics" | "archive" | "library" | "map" | "messages" | "files" | "pages" | "add";

function mapAdminRoute(pathname: string): AdminRoute {
  if (pathname === "/admin/materials") return "materials";
  if (pathname === "/admin/publications") return "publications";
  if (pathname === "/admin/photos") return "photos";
  if (pathname === "/admin/topics") return "topics";
  if (pathname === "/admin/archive") return "archive";
  if (pathname === "/admin/library") return "library";
  if (pathname === "/admin/map") return "map";
  if (pathname === "/admin/messages") return "messages";
  if (pathname === "/admin/files") return "files";
  if (pathname === "/admin/pages") return "pages";
  if (pathname === "/admin/add") return "add";
  return "dashboard";
}

function KeyReader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { unlockAdmin } = usePortal();

  useEffect(() => {
    const key = searchParams.get("key");
    if (key) {
      void unlockAdmin(key).then(() => {
        router.replace(pathname);
      });
    }
  }, []);

  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, setTheme } = usePortal();

  const adminRoute = mapAdminRoute(pathname);

  const adminLinks: Array<{ key: AdminRoute; label: string; href: string; code: string; count?: number }> = [
    { key: "dashboard",    label: "Дашборд",             href: "/admin",                code: "00" },
    { key: "materials",    label: "Учебные материалы",   href: "/admin/materials",      code: "01", count: state.materials.length },
    { key: "publications", label: "Публикации",           href: "/admin/publications",   code: "02", count: state.publications.length },
    { key: "photos",       label: "Фотографии",           href: "/admin/photos",         code: "03", count: state.photos.length },
    { key: "topics",       label: "Научные темы",         href: "/admin/topics",         code: "04", count: state.topics.length },
    { key: "archive",      label: "Архивные материалы",   href: "/admin/archive",        code: "05", count: state.archiveItems.length },
    { key: "library",      label: "Библиотека",           href: "/admin/library",        code: "06", count: state.libraryItems.length },
    { key: "map",          label: "Карта экспедиций",     href: "/admin/map",            code: "07", count: state.mapPlaces.length },
    { key: "messages",     label: "Сообщения",            href: "/admin/messages",       code: "08" },
    { key: "files",        label: "Файловый менеджер",    href: "/admin/files",          code: "09" },
    { key: "pages",        label: "Страницы сайта",       href: "/admin/pages",          code: "10" },
  ];

  function go(href: string) {
    router.push(href);
  }

  const savedLabel =
    adminRoute === "add"
      ? state.draftAt
        ? "Черновик · автосохранение"
        : "Новый материал"
      : "Все изменения сохранены";

  return (
    <div className="app-shell">
      <Suspense fallback={null}>
        <KeyReader />
      </Suspense>
      <PortalTopbar
        mode="admin"
        theme={state.theme}
        savedLabel={savedLabel}
        showModeToggle={true}
        onGo={go}
        onToggleTheme={setTheme}
      />

      <div className="admin-layout">
        <PortalAdminSidebar adminRoute={adminRoute} adminLinks={adminLinks} onGo={go} />
        <main className="main-scroll">{children}</main>
      </div>
    </div>
  );
}
