export type HomePageContent = {
  eyebrow: string;
  heroTitle: string;
  heroBody: string;
  heroImagePath: string;
  heroImageCaption: string;
  statsYears: string;
  featuredTitle: string;
  topicsTitle: string;
  disciplinesTitle: string;
  photosTitle: string;
  featuredPublicationIds: string[] | null;
  featuredTopicIds: string[] | null;
  featuredPhotoIds: string[] | null;
};

export type AboutPageContent = {
  kicker: string;
  title: string;
  introOne: string;
  introTwo: string;
  interestsTitle: string;
  interests: string[];
  contactsTitle: string;
  email: string;
  department: string;
  phone: string;
  portraitPath: string;
};

export function defaultHomePageContent(): HomePageContent {
  return {
    eyebrow: "Геология · палеонтология · стратиграфия",
    heroTitle: "Владимир Силантьев",
    heroBody:
      "Доктор геолого-минералогических наук, профессор КФУ. Более сорока лет занимаюсь палеонтологией и стратиграфией карбона и перми Волго-Уральского региона. Здесь собраны учебные материалы для студентов, научные публикации и архив экспедиций.",
    heroImagePath: "",
    heroImageCaption: "портрет · фото профессора",
    statsYears: "40+",
    featuredTitle: "Избранные публикации",
    topicsTitle: "Избранные научные темы",
    disciplinesTitle: "Студентам — по дисциплинам",
    photosTitle: "Из фотоархива",
    featuredPublicationIds: null,
    featuredTopicIds: null,
    featuredPhotoIds: null,
  };
}

export function defaultAboutPageContent(): AboutPageContent {
  return {
    kicker: "Обо мне",
    title: "Владимир Владимирович Силантьев",
    introOne:
      "Доктор геолого-минералогических наук, профессор кафедры региональной геологии и полезных ископаемых Института геологии и нефтегазовых технологий КФУ. Основные направления — палеонтология, стратиграфия карбона и перми, геология полезных ископаемых.",
    introTwo:
      "С 1984 года — Казанский (Приволжский) федеральный университет, специальность «геология». Кандидат геолого-минералогических наук с 1995 года, доктор — с 2017-го. Звание профессора присвоено в 2024 году. Член Палеонтологического общества РАН (с 1992), Межведомственного стратиграфического комитета России (с 1998) и ProGeo — Европейской ассоциации охраны геологического наследия (с 2007).",
    interestsTitle: "Научные интересы",
    interests: [
      "Палеонтология неморских двустворчатых моллюсков палеозоя",
      "Стратиграфия карбона и перми",
      "Геология и полезные ископаемые Волго-Уральского региона",
      "Профилактика геологических опасностей",
    ],
    contactsTitle: "Контакты",
    email: "Vladimir.Silantiev@kpfu.ru",
    department: "Каф. региональной геологии и полезных ископаемых, ИГиНГТ КФУ",
    phone: "+7 (843) 206-54-61 (доб. 9061)",
    portraitPath: "",
  };
}
