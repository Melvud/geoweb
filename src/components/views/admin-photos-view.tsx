"use client";

import { useState, useRef } from "react";
import { usePortal } from "@/components/portal-provider";
import { useRouter } from "next/navigation";
import { photoGroups } from "@/lib/portal-seed";
import { ComboInput } from "@/components/portal-combo-input";
import { Pencil, X } from "lucide-react";

export function AdminPhotosView() {
  const router = useRouter();
  const { state, setAddType, openDetail, deletePhoto, uploadFile, refreshData } = usePortal();

  // Bulk Upload states
  const [showBulk, setShowBulk] = useState(false);
  const [bulkGroup, setBulkGroup] = useState(photoGroups[0]);
  const [bulkOtype, setBulkOtype] = useState("Экспедиция");
  const [bulkYear, setBulkYear] = useState("2026");
  const [bulkRegion, setBulkRegion] = useState("Среднее Поволжье");
  const [bulkAge, setBulkAge] = useState("Пермь");
  const [bulkAuthor, setBulkAuthor] = useState("В. В. Силантьев");
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; filename: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoGroupCounts = Array.from(new Set(state.photos.map((p) => p.group).filter(Boolean)))
    .map((group) => ({
      name: group,
      count: state.photos.filter((item) => item.group === group).length,
    }))
    .filter((item) => item.count > 0);

  function go(href: string) {
    router.push(href);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  }

  async function handleBulkUpload() {
    if (selectedFiles.length === 0) {
      alert("Пожалуйста, сначала выберите файлы для загрузки.");
      return;
    }

    const finalGroup = bulkGroup.trim() || photoGroups[0];
    setUploadProgress({ current: 0, total: selectedFiles.length, filename: "" });

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress({ current: i + 1, total: selectedFiles.length, filename: file.name });
        
        // 1. Upload file
        const uploadRes = await uploadFile(file);

        // 2. Derive title from filename without extension
        const title = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;

        // 3. Save photo record
        const photoData = {
          title: title,
          year: bulkYear,
          imagePath: uploadRes.path,
          location: "",
          region: bulkRegion,
          otype: bulkOtype,
          age: bulkAge,
          desc: "",
          author: bulkAuthor,
          tags: ["пакетная загрузка"],
          usagePolicy: "Для сайта",
          group: finalGroup,
          access: "open",
          status: "published",
          relatedPublicationIds: [],
          relatedTopicIds: [],
          tint: "#b9a98b"
        };

        await fetch("/api/content/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(photoData)
        });
      }

      // Refresh global state & reset
      await refreshData();
      setSelectedFiles([]);
      setUploadProgress(null);
      setShowBulk(false);
      alert("Пакетная загрузка успешно завершена!");
    } catch (error) {
      console.error(error);
      alert("Произошла ошибка при загрузке. Загрузка приостановлена.");
      setUploadProgress(null);
    }
  }

  return (
    <div className="route">
      <div className="dashboard-top" style={{ alignItems: "center" }}>
        <div>
          <div className="section-kicker">Фотоархив · {state.photos.length} снимков</div>
          <h1 className="page-title">Фотоархив</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="secondary-button"
            onClick={() => setShowBulk(!showBulk)}
          >
            {showBulk ? "Скрыть панель" : "Пакетная загрузка"}
          </button>
          <button
            className="primary-button"
            onClick={() => {
              setAddType("photo");
              go("/admin/add");
            }}
          >
            + Добавить фото
          </button>
        </div>
      </div>

      {showBulk && (
        <div 
          style={{ 
            background: "var(--sand)", 
            padding: 20, 
            borderRadius: 12, 
            marginBottom: 24, 
            border: "1px solid var(--line)" 
          }}
        >
          <h2 className="panel-title" style={{ fontSize: 20, marginBottom: 14 }}>
            Настройки пакетной загрузки
          </h2>
          <div className="form-grid" style={{ marginBottom: 14 }}>
            <div>
              <label className="field-label">Папка / альбом</label>
              <ComboInput
                value={bulkGroup}
                onChange={setBulkGroup}
                suggestions={[...new Set([
                  ...photoGroups,
                  ...state.photos.map((p) => p.group ?? "").filter(Boolean),
                ])]}
                placeholder="Выберите или создайте новую..."
              />
            </div>
          </div>

          <div className="form-grid-three" style={{ marginBottom: 14 }}>
            <div>
              <label className="field-label">Тип объектов</label>
              <ComboInput
                value={bulkOtype}
                onChange={setBulkOtype}
                suggestions={[...new Set([
                  "Экспедиция",
                  "Обнажение",
                  "Керн",
                  "Образец",
                  "Ископаемое",
                  "Шлиф",
                  ...state.photos.map((p) => p.otype),
                ])]}
                placeholder="Выберите или введите новый..."
              />
            </div>
            <div>
              <label className="field-label">Год съемки</label>
              <input
                className="text-input"
                value={bulkYear}
                onChange={(e) => setBulkYear(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Регион</label>
              <input
                className="text-input"
                value={bulkRegion}
                onChange={(e) => setBulkRegion(e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: 18 }}>
            <div>
              <label className="field-label">Геологический возраст</label>
              <input
                className="text-input"
                value={bulkAge}
                onChange={(e) => setBulkAge(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Автор фотографий</label>
              <input
                className="text-input"
                value={bulkAuthor}
                onChange={(e) => setBulkAuthor(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="field-label">Выберите файлы изображений</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="text-input"
              style={{ padding: "8px 12px" }}
              onChange={handleFileSelect}
              ref={fileInputRef}
            />
            {selectedFiles.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 13, color: "var(--forest2)" }}>
                Выбрано файлов: {selectedFiles.length}
              </div>
            )}
          </div>

          {uploadProgress && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>Загрузка файлов...</span>
                <span>{uploadProgress.current} из {uploadProgress.total}</span>
              </div>
              <div style={{ background: "var(--line2)", height: 8, borderRadius: 4, overflow: "hidden" }}>
                <div 
                  style={{ 
                    background: "var(--clay)", 
                    height: "100%", 
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                    transition: "width 0.2s ease"
                  }} 
                />
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Обработка: {uploadProgress.filename}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button 
              className="primary-button" 
              onClick={handleBulkUpload}
              disabled={uploadProgress !== null || selectedFiles.length === 0}
            >
              Начать загрузку
            </button>
            <button 
              className="secondary-button" 
              onClick={() => {
                setSelectedFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={uploadProgress !== null}
            >
              Сбросить выбор
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {photoGroupCounts.map((item) => (
          <span key={item.name} className="tag-chip">
            {item.name} <span className="mono" style={{ marginLeft: 6 }}>{item.count}</span>
          </span>
        ))}
      </div>

      <div className="featured-grid">
        {state.photos.map((item) => (
          <div 
            key={item.id} 
            className="preview-card" 
            style={{ position: "relative", cursor: "default" }}
          >
            <div
              style={{
                aspectRatio: "4 / 3",
                background: item.imagePath 
                  ? `url(${item.imagePath}) center/cover no-repeat`
                  : `repeating-linear-gradient(135deg, ${item.tint}, ${item.tint} 13px, rgba(255,255,255,.16) 13px, rgba(255,255,255,.16) 26px)`,
                display: "flex",
                alignItems: "flex-end",
                padding: 10,
                cursor: "pointer",
                position: "relative"
              }}
              onClick={() => openDetail({ kind: "photo", item })}
            >
              <span
                className="type-chip"
                style={{ background: "rgba(20,18,16,.62)", color: "#fff" }}
              >
                {item.otype}
              </span>

              {/* Action buttons top right overlay */}
              <div 
                style={{ 
                  position: "absolute", 
                  top: 8, 
                  right: 8, 
                  display: "flex", 
                  gap: 6,
                  zIndex: 2
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="icon-button"
                  style={{ 
                    background: "rgba(255,255,255,0.9)", 
                    color: "var(--ink)", 
                    width: 28, 
                    height: 28, 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    border: "none",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                    cursor: "pointer"
                  }}
                  onClick={() => go(`/admin/add?edit=${item.id}&type=photo`)}
                  title="Редактировать"
                >
                  <Pencil size={13} strokeWidth={1.8} />
                </button>
                <button
                  className="icon-button"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    color: "var(--red)",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                    cursor: "pointer"
                  }}
                  onClick={async () => {
                    if (confirm("Вы уверены, что хотите удалить эту фотографию?")) {
                      await deletePhoto(item.id);
                    }
                  }}
                  title="Удалить"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
            <div 
              className="preview-body" 
              style={{ cursor: "pointer" }}
              onClick={() => openDetail({ kind: "photo", item })}
            >
              <div className="panel-title" style={{ fontSize: 19 }}>
                {item.title}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                {item.region} · {item.year}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
