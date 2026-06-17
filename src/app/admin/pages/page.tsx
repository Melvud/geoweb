"use client";

import { usePortal } from "@/components/portal-provider";
import { PortalPagesEditor } from "@/components/portal-pages-editor";

export default function AdminPagesPage() {
  const { state, savePage, uploadFile, askUploadFolder } = usePortal();

  async function uploadWithPrompt(file: File) {
    const folder = await askUploadFolder();
    if (folder === null) throw new Error("cancelled");
    return uploadFile(file, folder);
  }

  return (
    <div className="route">
      <div className="dashboard-top" style={{ alignItems: "center" }}>
        <div>
          <div className="section-kicker">Главная и Обо мне</div>
          <h1 className="page-title" style={{ margin: 0 }}>Редактирование страниц</h1>
        </div>
      </div>
      <div
        className="preview-note"
        style={{ marginTop: 0, marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}
      >
        <span style={{ fontSize: 20, lineHeight: 1 }}>✏️</span>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          <strong>Редактирование текстов прямо на сайте.</strong> Откройте публичную часть сайта
          и нажмите кнопку с карандашом в правом верхнем углу. Все заголовки, пункты меню,
          подписи и тексты кнопок станут редактируемыми — кликните по тексту, измените его и
          нажмите Enter. Изменения сохраняются автоматически. Ниже редактируются крупные блоки
          страниц «Главная» и «Обо мне».
        </div>
      </div>

      <PortalPagesEditor
        home={state.pages.home}
        about={state.pages.about}
        onSavePage={savePage}
        onUploadFile={uploadWithPrompt}
      />
    </div>
  );
}
