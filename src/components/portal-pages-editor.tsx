"use client";

import { useEffect, useState } from "react";
import type {
  AboutPageContent,
  HomePageContent,
} from "@/lib/page-content";

export function PortalPagesEditor({
  home,
  about,
  onSavePage,
  onUploadFile,
}: {
  home: HomePageContent;
  about: AboutPageContent;
  onSavePage: (
    slug: "home" | "about",
    payload: HomePageContent | AboutPageContent,
  ) => Promise<void>;
  onUploadFile: (file: File) => Promise<{ path: string }>;
}) {
  const [homeDraft, setHomeDraft] = useState(home);
  const [aboutDraft, setAboutDraft] = useState(about);
  const [saving, setSaving] = useState<null | "home" | "about">(null);

  useEffect(() => {
    setHomeDraft(home);
  }, [home]);

  useEffect(() => {
    setAboutDraft(about);
  }, [about]);

  async function uploadImage(file: File, target: "home" | "about") {
    const result = await onUploadFile(file);
    if (target === "home") {
      setHomeDraft((current) => ({ ...current, heroImagePath: result.path }));
      return;
    }

    setAboutDraft((current) => ({ ...current, portraitPath: result.path }));
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div className="discipline-card" style={{ padding: 24 }}>
        <div className="dashboard-top" style={{ marginBottom: 18, alignItems: "center" }}>
          <div>
            <div className="section-kicker">Публичная страница</div>
            <h2 className="page-title" style={{ fontSize: 28 }}>
              Главная
            </h2>
          </div>
          <button
            className="primary-button"
            onClick={async () => {
              setSaving("home");
              try {
                await onSavePage("home", homeDraft);
              } finally {
                setSaving(null);
              }
            }}
          >
            {saving === "home" ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>

        <div className="form-grid" style={{ marginBottom: 16 }}>
          <div>
            <label className="field-label">Подзаголовок</label>
            <input
              className="text-input"
              value={homeDraft.eyebrow}
              onChange={(event) =>
                setHomeDraft((current) => ({ ...current, eyebrow: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="field-label">Имя в hero</label>
            <input
              className="text-input"
              value={homeDraft.heroTitle}
              onChange={(event) =>
                setHomeDraft((current) => ({ ...current, heroTitle: event.target.value }))
              }
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Описание</label>
          <textarea
            className="text-area"
            value={homeDraft.heroBody}
            onChange={(event) =>
              setHomeDraft((current) => ({ ...current, heroBody: event.target.value }))
            }
          />
        </div>

        <div className="form-grid" style={{ marginBottom: 16 }}>
          <div>
            <label className="field-label">Фото героя</label>
            <input
              className="text-input"
              value={homeDraft.heroImagePath}
              onChange={(event) =>
                setHomeDraft((current) => ({ ...current, heroImagePath: event.target.value }))
              }
              placeholder="/uploads/..."
            />
            <input
              type="file"
              style={{ marginTop: 10 }}
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadImage(file, "home");
                }
              }}
            />
          </div>
          <div>
            <label className="field-label">Подпись к фото</label>
            <input
              className="text-input"
              value={homeDraft.heroImageCaption}
              onChange={(event) =>
                setHomeDraft((current) => ({ ...current, heroImageCaption: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="form-grid-three">
          <div>
            <label className="field-label">Стаж в поле</label>
            <input
              className="text-input"
              value={homeDraft.statsYears}
              onChange={(event) =>
                setHomeDraft((current) => ({ ...current, statsYears: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="field-label">Заголовок публикаций</label>
            <input
              className="text-input"
              value={homeDraft.featuredTitle}
              onChange={(event) =>
                setHomeDraft((current) => ({ ...current, featuredTitle: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="field-label">Заголовок дисциплин</label>
            <input
              className="text-input"
              value={homeDraft.disciplinesTitle}
              onChange={(event) =>
                setHomeDraft((current) => ({
                  ...current,
                  disciplinesTitle: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="field-label">Заголовок фотоархива</label>
          <input
            className="text-input"
            value={homeDraft.photosTitle}
            onChange={(event) =>
              setHomeDraft((current) => ({ ...current, photosTitle: event.target.value }))
            }
          />
        </div>
      </div>

      <div className="discipline-card" style={{ padding: 24 }}>
        <div className="dashboard-top" style={{ marginBottom: 18, alignItems: "center" }}>
          <div>
            <div className="section-kicker">Публичная страница</div>
            <h2 className="page-title" style={{ fontSize: 28 }}>
              Обо мне
            </h2>
          </div>
          <button
            className="primary-button"
            onClick={async () => {
              setSaving("about");
              try {
                await onSavePage("about", aboutDraft);
              } finally {
                setSaving(null);
              }
            }}
          >
            {saving === "about" ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>

        <div className="form-grid" style={{ marginBottom: 16 }}>
          <div>
            <label className="field-label">Кикер</label>
            <input
              className="text-input"
              value={aboutDraft.kicker}
              onChange={(event) =>
                setAboutDraft((current) => ({ ...current, kicker: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="field-label">Заголовок</label>
            <input
              className="text-input"
              value={aboutDraft.title}
              onChange={(event) =>
                setAboutDraft((current) => ({ ...current, title: event.target.value }))
              }
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Первый абзац</label>
          <textarea
            className="text-area"
            value={aboutDraft.introOne}
            onChange={(event) =>
              setAboutDraft((current) => ({ ...current, introOne: event.target.value }))
            }
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Второй абзац</label>
          <textarea
            className="text-area"
            value={aboutDraft.introTwo}
            onChange={(event) =>
              setAboutDraft((current) => ({ ...current, introTwo: event.target.value }))
            }
          />
        </div>

        <div className="form-grid" style={{ marginBottom: 16 }}>
          <div>
            <label className="field-label">Портрет</label>
            <input
              className="text-input"
              value={aboutDraft.portraitPath}
              onChange={(event) =>
                setAboutDraft((current) => ({ ...current, portraitPath: event.target.value }))
              }
              placeholder="/uploads/..."
            />
            <input
              type="file"
              style={{ marginTop: 10 }}
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadImage(file, "about");
                }
              }}
            />
          </div>
          <div>
            <label className="field-label">Заголовок интересов</label>
            <input
              className="text-input"
              value={aboutDraft.interestsTitle}
              onChange={(event) =>
                setAboutDraft((current) => ({
                  ...current,
                  interestsTitle: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Научные интересы</label>
          <textarea
            className="text-area"
            value={aboutDraft.interests.join("\n")}
            onChange={(event) =>
              setAboutDraft((current) => ({
                ...current,
                interests: event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              }))
            }
          />
        </div>

        <div className="form-grid-three">
          <div>
            <label className="field-label">Заголовок контактов</label>
            <input
              className="text-input"
              value={aboutDraft.contactsTitle}
              onChange={(event) =>
                setAboutDraft((current) => ({
                  ...current,
                  contactsTitle: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input
              className="text-input"
              value={aboutDraft.email}
              onChange={(event) =>
                setAboutDraft((current) => ({ ...current, email: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="field-label">Телефон</label>
            <input
              className="text-input"
              value={aboutDraft.phone}
              onChange={(event) =>
                setAboutDraft((current) => ({ ...current, phone: event.target.value }))
              }
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="field-label">Кафедра / подразделение</label>
          <input
            className="text-input"
            value={aboutDraft.department}
            onChange={(event) =>
              setAboutDraft((current) => ({ ...current, department: event.target.value }))
            }
          />
        </div>
      </div>
    </div>
  );
}
