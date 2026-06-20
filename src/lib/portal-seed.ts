import {
  defaultAboutPageContent,
  defaultHomePageContent,
} from "@/lib/page-content";
import { defaultUiText } from "@/lib/ui-text";
import type {
  AccessLevel,
  AddType,
  ArchiveItem,
  FormState,
  Material,
  Photo,
  PortalState,
  Publication,
  Topic,
} from "@/lib/portal-types";

export const disciplines = [
  "Общая геология",
  "Кристаллография",
  "Палеонтология",
  "Историческая геология",
  "Стратиграфия",
  "Методы изучения керна",
  "Полевая практика",
  "Региональная геология",
  "Нефтегазовая геология",
];

export const topicOptions = [
  "Пермские отложения Среднего Поволжья",
  "Неморские двустворчатые моллюски палеозоя",
  "Стратиграфия карбона и перми",
  "Доманиковые отложения",
  "Визейские отложения Волго-Уральской НГП",
  "Геологическое образование",
];

export const photoGroups = [
  "Экспедиции 1983-2026",
  "Геологические объекты",
  "Фотографии образцов",
  "Керн",
  "Палеонтологические коллекции",
  "Учебные фотографии",
];

export function blankForm(type: AddType): FormState {
  return {
    entityId: null,
    type,
    title: "",
    discipline: "Палеонтология",
    mtype: "Презентация",
    desc: "",
    course: "Бакалавриат, 2 курс",
    year: "2026",
    lang: "Русский",
    access: "open",
    status: "draft",
    filePath: null,
    previewPath: null,
    tags: [],
    tagDraft: "",
    authors: "Силантьев В. В.",
    journal: "",
    doi: "",
    externalUrl: "",
    pdfPath: null,
    pdfPublic: true,
    ptype: "Статья",
    summary: "",
    topic: "Пермские отложения Среднего Поволжья",
    region: "Среднее Поволжье",
    age: "Пермь",
    otype: "Экспедиция",
    imagePath: null,
    location: "",
    author: "В. В. Силантьев",
    usagePolicy: "Для сайта и учебных материалов",
    groupName: "Экспедиции 1983-2026",
    body: "",
    coverPath: null,
    relatedPublicationIds: [],
    relatedPhotoIds: [],
    relatedMaterialIds: [],
    relatedLibraryIds: [],
    relatedTopicIds: [],
    relatedArchiveIds: [],
    relatedMapPlaceIds: [],
    relationReplacements: {},
    ownerComment: "",
    featured: false,
    attachments: [],
  };
}

export const seedMaterials: Material[] = [
  {
    id: "m1",
    title: "Введение в палеонтологию беспозвоночных",
    discipline: "Палеонтология",
    mtype: "Презентация",
    year: "2024",
    language: "Русский",
    status: "published",
    access: "open",
    tags: ["палеонтология", "беспозвоночные", "лекция"],
    desc: `# Введение в палеонтологию беспозвоночных

Данный учебный курс разработан для студентов 2 курса бакалавриата. Он охватывает основные вехи эволюции беспозвоночных организмов в геологической истории Земли.

---

### 1. Тематический план лекций

- **Раздел I:** Общие вопросы палеонтологии и тафономии.
- **Раздел II:** Одноклеточные эукариоты и низшие многоклеточные.
- **Раздел III:** Двусторонне-симметричные (Coelomata).
- **Раздел IV:** Палеоэкология и биостратиграфия.

### 2. Лабораторные занятия и образцы

Для успешного прохождения курса необходимо выполнить практические задания по определению ископаемых остатков.

| Модуль | Систематическая группа | Кол-во образцов | Сложность |
| :--- | :--- | :---: | :---: |
| Модуль 1 | *Foraminifera* (Простейшие) | 12 | Средняя |
| Модуль 2 | *Rugosa* (Кишечнополостные) | 8 | Высокая |
| Модуль 3 | *Bivalvia* (Моллюски) | 20 | Низкая |

---

### 3. Рекомендуемая литература и материалы

> **Важное замечание:** Пожалуйста, ознакомьтесь с техникой безопасности при работе с кислотами для препарирования раковин.

Более детальные инструкции и лабораторные карты вы можете скачать в разделе **Приложения** ниже.`,
    course: "Бакалавриат, 2 курс",
    filePath: null,
    previewPath: null,
    attachments: [
      { name: "Syllabus_Paleontology_2026.pdf", path: "/uploads/Syllabus_Paleontology_2026.pdf", size: 1048576 },
      { name: "Laboratory_Work_1.docx", path: "/uploads/Laboratory_Work_1.docx", size: 524288 }
    ],
  },
  {
    id: "m2",
    title: "Сингония и элементы симметрии кристаллов",
    discipline: "Кристаллография",
    mtype: "Лекция",
    year: "2023",
    language: "Русский",
    status: "published",
    access: "open",
    tags: ["кристаллография", "симметрия"],
    desc: "Семь сингоний, 32 класса симметрии, примеры.",
    course: "Бакалавриат, 1 курс",
    filePath: null,
    previewPath: null,
    attachments: [],
  },
  {
    id: "m3",
    title: "Определитель неморских двустворок палеозоя",
    discipline: "Палеонтология",
    mtype: "Методичка",
    year: "2025",
    language: "Русский",
    status: "draft",
    access: "students",
    tags: ["двустворки", "определитель", "палеозой"],
    desc: "Иллюстрированный ключ для лабораторных занятий.",
    course: "Магистратура",
    filePath: null,
    previewPath: null,
    attachments: [],
  },
  {
    id: "m4",
    title: "Полевой определитель типов обнажений",
    discipline: "Полевая практика",
    mtype: "Методичка",
    year: "2024",
    language: "Русский",
    status: "published",
    access: "open",
    tags: ["полевая практика", "обнажения"],
    desc: "Карманный справочник для летней практики.",
    course: "Бакалавриат, 3 курс",
    filePath: null,
    previewPath: null,
    attachments: [],
  },
  {
    id: "m5",
    title: "Стратиграфическая шкала карбона и перми",
    discipline: "Стратиграфия",
    mtype: "Таблица",
    year: "2024",
    language: "Русский",
    status: "hidden",
    access: "open",
    tags: ["стратиграфия", "карбон", "пермь"],
    desc: "Сводная корреляционная таблица региона.",
    course: "Магистратура",
    filePath: null,
    previewPath: null,
    attachments: [],
  },
  {
    id: "m6",
    title: "Анализ керна: базовый практикум",
    discipline: "Методы изучения керна",
    mtype: "Задание",
    year: "2025",
    language: "Русский",
    status: "published",
    access: "open",
    tags: ["керн", "практикум"],
    desc: "10 задач с реальными колонками описания.",
    course: "Бакалавриат, 4 курс",
    filePath: null,
    previewPath: null,
    attachments: [],
  },
];

export const seedPublications: Publication[] = [
  {
    id: "p1",
    year: "2019",
    authors: "Силантьев В. В.",
    title: "Двустворчатые моллюски пермских отложений Среднего Поволжья",
    ptype: "Монография",
    journal: "Изд-во Казанского ун-та",
    doi: "10.1234/perm.2019",
    externalUrl: "",
    pdfPath: null,
    pdfPublic: true,
    summary: "Монография по систематике и стратиграфии двустворчатых моллюсков.",
    topic: "Пермские отложения Среднего Поволжья",
    region: "Среднее Поволжье",
    age: "Пермь",
    keywords: ["двустворки", "пермь", "поволжье"],
    language: "Русский",
    featured: true,
    access: "open",
    attachments: [],
  },
  {
    id: "p2",
    year: "2021",
    authors: "Силантьев В. В., Снегирёва М. К.",
    title: "Стратиграфия визейских отложений Волго-Уральской НГП",
    ptype: "Статья",
    journal: "Стратиграфия. Геол. корреляция",
    doi: "10.1234/vise.2021",
    externalUrl: "",
    pdfPath: null,
    pdfPublic: true,
    summary: "Корреляция разрезов and уточнение стратиграфических границ.",
    topic: "Визейские отложения Волго-Уральской НГП",
    region: "Волго-Урал",
    age: "Карбон",
    keywords: ["визей", "стратиграфия", "НГП"],
    language: "Русский",
    featured: true,
    access: "open",
    attachments: [],
  },
  {
    id: "p3",
    year: "2023",
    authors: "Силантьев В. В.",
    title: "Неморские двустворки палеозоя: ревизия родов",
    ptype: "Статья",
    journal: "Палеонтологический журнал",
    doi: "10.1234/biv.2023",
    externalUrl: "",
    pdfPath: null,
    pdfPublic: true,
    summary: `# Ревизия состава родов неморских двустворчатых моллюсков палеозоя

В данной работе приводится подробный обзор систематики и эволюционного развития неморских Bivalvia палеозойской эры.

![Ископаемая раковина Bivalvia|right](/uploads/fossil_bivalve_sample.png)

### Основные разделы исследования:
1. **Морфология раковины** и структура замка.
2. **Палеоэкологические особенности** обитания в солоноватоводных и пресноводных бассейнах.
3. **Биостратиграфическое значение** для корреляции континентальных отложений.

> "Неморские двустворчатые моллюски являются ключевой группой для расчленения верхнепалеозойских толщ Ангариды и Восточно-Европейской платформы." — *В. В. Силантьев*

#### Сравнительная таблица исследованных родов:
| Род | Семейство | Стратиграфический интервал | Типичный регион |
| :--- | :--- | :--- | :--- |
| *Palaeomutela* | Palaeomutelidae | Upper Permian | Среднее Поволжье |
| *Anthraconauta* | Myalinidae | Upper Carboniferous | Кузбасс |
| *Microdontella* | Carbonicolidae | Lower Permian |  Волго-Урал |

### Математический анализ параметров

Для математической оценки изменчивости раковин Bivalvia используется индекс удлинения раковины $I_e$, рассчитываемый по следующей формуле:

$$I_e = \\frac{L}{H} \\cdot 100\\%$$

где $L$ - длина раковины, $H$ - высота раковины.

### Схема этапов исследования образцов

Ниже приведена диаграмма процесса подготовки и анализа геологических проб:

\`\`\`mermaid
graph TD
    A[Сбор образцов в поле] --> B[Препарирование в кислотах]
    B --> C[Измерения параметров L и H]
    C --> D[Расчет индекса I_e]
    D --> E[Классификация родов]
\`\`\`

Вы можете ознакомиться со схемами корреляции и оригинальными таблицами промеров в приложениях к статье.`,
    topic: "Неморские двустворчатые моллюски палеозоя",
    region: "Восточно-Европейская платформа",
    age: "Палеозой",
    keywords: ["bivalvia", "палеозой", "систематика"],
    language: "Русский",
    featured: false,
    access: "open",
    attachments: [
      { name: "Taxonomic_Revision_Table_2023.xlsx", path: "/uploads/Taxonomic_Revision_Table_2023.xlsx", size: 786432 },
      { name: "HighRes_Plates_Bivalvia.zip", path: "/uploads/HighRes_Plates_Bivalvia.zip", size: 12582912 }
    ],
  },
];

export const seedPhotos: Photo[] = [
  {
    id: "f1",
    title: "Экспедиция, Среднее Поволжье",
    year: "1987",
    imagePath: null,
    location: "",
    region: "Среднее Поволжье",
    otype: "Экспедиция",
    age: "Пермь",
    desc: "Полевая съемка в разрезах Среднего Поволжья.",
    author: "В. В. Силантьев",
    tags: ["экспедиция", "поволжье"],
    usagePolicy: "Для сайта и учебных материалов",
    group: "Экспедиции 1983-2026",
    access: "open",
    status: "published",
    relatedPublicationIds: ["p1"],
    relatedTopicIds: ["t1"],
    tint: "#b9a98b",
  },
  {
    id: "f2",
    title: "Обнажение пермских красноцветов",
    year: "2008",
    imagePath: null,
    location: "р. Сок",
    region: "Среднее Поволжье",
    otype: "Обнажение",
    age: "Пермь",
    desc: "Разрез красноцветной толщи в естественном выходе.",
    author: "В. В. Силантьев",
    tags: ["обнажение", "пермь"],
    usagePolicy: "Для сайта и лекций",
    group: "Геологические объекты",
    access: "open",
    status: "published",
    relatedPublicationIds: ["p1"],
    relatedTopicIds: ["t1"],
    tint: "#c08a63",
  },
  {
    id: "f3",
    title: "Керн скважины N14, доманик",
    year: "2015",
    imagePath: null,
    location: "",
    region: "Волго-Урал",
    otype: "Керн",
    age: "Девон",
    desc: "Фрагмент керна доманиковых отложений.",
    author: "В. В. Силантьев",
    tags: ["керн", "доманик"],
    usagePolicy: "По запросу",
    group: "Керн",
    access: "request",
    status: "published",
    relatedPublicationIds: [],
    relatedTopicIds: ["t4"],
    tint: "#8f7c63",
  },
];

export const seedTopics: Topic[] = [
  {
    id: "t1",
    name: "Пермские отложения Среднего Поволжья",
    region: "Среднее Поволжье",
    age: "Пермь",
    desc: "Многолетние исследования разрезов, фаций и фауны пермской системы.",
    body: `# Исследование пермской системы Среднего Поволжья

Комплексные геологические изыскания ведутся на протяжении более чем 30 лет. Разрезы Среднего Поволжья представляют собой уникальный эталон для изучения пермского периода.

---

### 1. Ключевые направления исследований

- **Литостратиграфия:** Корреляция терригенно-карбонатных и красноцветных пачек.
- **Палеонтология:** Систематический анализ останков древних рыб, неморских двустворок и семенных папоротников.
- **Хемостратиграфия:** Изотопные маркеры углерода и кислорода для реконструкции древнего климата и биосферных перестроек.

### 2. Сравнительная характеристика разрезов

| Разрез | Стратиграфический объем | Главные литотипы | Палеонтологический комплекс |
| :--- | :--- | :--- | :--- |
| **Печищи** | Уржумский и казанский ярусы | Доломиты, известняки, гипсы | Двустворки, гастроподы, остракоды |
| **Монастырский овраг** | Вятский ярус | Красноцветные глины, песчаники | Флора семенных папоротников, кости рептилий |
| **Сокольи Горы** | Северодвинский ярус | Мергели, известняки, пески | Рыбы, раковины неморских Bivalvia |

> **Важный вывод:** Исследования фауны двустворчатых моллюсков подтверждают их ведущую роль в зональном расчленении континентальных отложений.

*Результаты работы опубликованы в серии монографий и отчетов полевых сезонов.*`,
    coverPath: null,
    keywords: ["пермь", "стратиграфия"],
    access: "open",
    relatedPublicationIds: ["p1"],
    relatedPhotoIds: ["f1", "f2"],
    relatedArchiveIds: ["a1", "a2"],
    pubs: 1,
    photos: 2,
    archive: 2,
    attachments: [
      { name: "Middle_Volga_Permian_Stratigraphy.pdf", path: "/uploads/Middle_Volga_Permian_Stratigraphy.pdf", size: 4194304 },
      { name: "Palaeontological_Atlas_Permian.pdf", path: "/uploads/Palaeontological_Atlas_Permian.pdf", size: 18874368 }
    ],
  },
  {
    id: "t2",
    name: "Неморские двустворчатые моллюски палеозоя",
    region: "Восточно-Европейская платформа",
    age: "Палеозой",
    desc: "Систематика, биостратиграфия и палеоэкология неморских Bivalvia.",
    body: "",
    coverPath: null,
    keywords: ["двустворки", "палеозой"],
    access: "open",
    relatedPublicationIds: ["p1", "p3"],
    relatedPhotoIds: [],
    relatedArchiveIds: ["a4"],
    pubs: 2,
    photos: 0,
    archive: 1,
    attachments: [],
  },
  {
    id: "t4",
    name: "Доманиковые отложения",
    region: "Среднее Поволжье",
    age: "Девон",
    desc: "Фации, геохимия и нефтематеринский потенциал доманика.",
    body: "",
    coverPath: null,
    keywords: ["доманик", "девон"],
    access: "open",
    relatedPublicationIds: [],
    relatedPhotoIds: ["f3"],
    relatedArchiveIds: ["a3"],
    pubs: 0,
    photos: 1,
    archive: 1,
    attachments: [],
  },
];

export const seedArchiveItems: ArchiveItem[] = [
  {
    id: "a1",
    title: "Полевой дневник, экспедиция 1987 г.",
    atype: "Полевой дневник",
    desc: `### Полевой дневник геологического отряда (1987 г.)

Оригинальные рукописные записи полевых наблюдений, выполненные в ходе экспедиции по Среднему Поволжью.

---

#### Основное содержание дневника:
1. Описания литологических слоев по маршруту *Тетюши — Камское Устье*.
2. Рисунки и зарисовки естественных обнажений, профилей и контактов пачек.
3. Точные географические координаты и привязки точек отбора палеонтологических и петрографических проб.

> **Примечание архивариуса:** Оригинал дневника написан синими чернилами в дерматиновой тетради. На страницах 45-48 имеются зарисовки отпечатков *Palaeomutela*.

| Маршрут | Количество точек (Tops) | Листы карты масштаба 1:100 000 | Период работ |
| :--- | :---: | :--- | :--- |
| Тетюши — Печищи | 24 | N-39-27, N-39-15 | 12.06.1987 — 25.06.1987 |
| Камское Устье | 18 | N-39-16 | 27.06.1987 — 05.07.1987 |

*Документ полностью оцифрован в высоком качестве и доступен для скачивания в формате PDF.*`,
    filePath: null,
    year: "1987",
    region: "Среднее Поволжье",
    topic: "Пермские отложения Среднего Поволжья",
    ownerComment: "",
    access: "link",
    statusLabel: "Доступ по ссылке",
    relatedPublicationIds: ["p1"],
    relatedPhotoIds: ["f1"],
    dot: "#c2643a",
    attachments: [
      { name: "Field_Diary_1987_Complete_Scan.pdf", path: "/uploads/Field_Diary_1987_Complete_Scan.pdf", size: 23068672 },
      { name: "Route_Map_1987.jpg", path: "/uploads/Route_Map_1987.jpg", size: 5242880 }
    ],
  },
  {
    id: "a2",
    title: "Корреляционная схема пермских разрезов",
    atype: "Схема",
    desc: "Сводная схема корреляции разрезов по опорным точкам.",
    filePath: null,
    year: "2004",
    region: "Волго-Урал",
    topic: "Пермские отложения Среднего Поволжья",
    ownerComment: "",
    access: "open",
    statusLabel: "Открыто",
    relatedPublicationIds: [],
    relatedPhotoIds: [],
    dot: "#3f7a4f",
    attachments: [],
  },
  {
    id: "a3",
    title: "Таблица замеров мощностей доманика",
    atype: "Таблица",
    desc: "Полевые и камеральные измерения по скважинам.",
    filePath: null,
    year: "2012",
    region: "Среднее Поволжье",
    topic: "Доманиковые отложения",
    ownerComment: "",
    access: "request",
    statusLabel: "По запросу",
    relatedPublicationIds: [],
    relatedPhotoIds: ["f3"],
    dot: "#9c7a3a",
    attachments: [],
  },
  {
    id: "a4",
    title: "Рукопись: ревизия рода Palaeomutela",
    atype: "Текст",
    desc: "Рабочая версия рукописи по двустворкам.",
    filePath: null,
    year: "2016",
    region: "",
    topic: "Неморские двустворчатые моллюски палеозоя",
    ownerComment: "",
    access: "students",
    statusLabel: "Только для студентов",
    relatedPublicationIds: ["p3"],
    relatedPhotoIds: [],
    dot: "#46566b",
    attachments: [],
  },
];

export function accessLabel(access: AccessLevel): string {
  const labels: Record<AccessLevel, string> = {
    open: "Открыто",
    students: "Студентам",
    link: "По ссылке",
    request: "По запросу",
    hidden: "Скрыто",
    owner: "Только владелец",
  };

  return labels[access];
}

export function makeSeedState(): PortalState {
  return {
    theme: "light",
    addType: "learning",
    addLayout: "split",
    form: blankForm("learning"),
    draftAt: null,
    filter: { q: "", type: "all", discipline: "all", status: "all", year: "all" },
    pubCollection: "all",
    pubQuery: "",
    searchQuery: "",
    publicDiscipline: null,
    detail: null,
    toast: null,
    materials: seedMaterials,
    publications: seedPublications,
    photos: seedPhotos,
    topics: seedTopics,
    archiveItems: seedArchiveItems,
    libraryItems: [],
    mapPlaces: [],
    pages: {
      home: defaultHomePageContent(),
      about: defaultAboutPageContent(),
    },
    uiText: { ...defaultUiText },
    editMode: false,
    loaded: false,
  };
}
