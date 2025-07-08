export const partiesData = [
  {
    id: 1,
    title: "Neon Party",
    description:
      "Вечеринка в стиле неоновых 80-х с яркими огнями, музыкой и танцами до утра.",
    date: "14 февраля",
    location: "г.Алматы",
    price: 7000,
    type: "Тематические",
    category: "Вечеринка",
    stages: [
      {
        title: "Welcome Zone",
        desc: "Гости получают неоновые браслеты и welcome drink.",
      },
      {
        title: "DJ Set",
        desc: "Лучшие диджеи города играют хиты 80-х и современные треки.",
      },
      {
        title: "Танцевальный баттл",
        desc: "Участники соревнуются за звание лучшего танцора вечера.",
      },
    ],
    reward: 0,
    hasAchievement: false,
    organizer: "Neon Events",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 2,
    title: "White Party",
    description:
      "Элегантная вечеринка, где все гости одеты в белое. Живая музыка и фотозона.",
    date: "8 марта",
    location: "г.Нур-Султан",
    price: 9000,
    type: "Тематические",
    category: "Вечеринка",
    stages: [
      {
        title: "Фотосессия",
        desc: "Профессиональный фотограф делает снимки гостей.",
      },
      {
        title: "Живой концерт",
        desc: "Выступление кавер-группы с популярными хитами.",
      },
      {
        title: "Розыгрыш призов",
        desc: "Среди гостей разыгрываются подарки от партнеров.",
      },
    ],
    reward: 0,
    hasAchievement: false,
    organizer: "White Club",
    image:
      "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 3,
    title: "Retro Disco",
    description: "Вечеринка в стиле 90-х с тематическим дресс-кодом и ретро-музыкой.",
    date: "5 мая",
    location: "г.Караганда",
    price: 6000,
    type: "Тематические",
    category: "Вечеринка",
    stages: [
      {
        title: "Дресс-код",
        desc: "Лучший образ 90-х получает приз.",
      },
      {
        title: "Караоке",
        desc: "Гости поют любимые хиты прошлого.",
      },
      {
        title: "Танцы до утра",
        desc: "Дискотека с ретро-диджеем.",
      },
    ],
    reward: 1000,
    hasAchievement: true,
    organizer: "Retro Club",
    image:
      "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 4,
    title: "Masquerade Night",
    description: "Загадочная маскарадная ночь с конкурсом на лучший костюм.",
    date: "10 октября",
    location: "г.Шымкент",
    price: 8000,
    type: "Тематические",
    category: "Вечеринка",
    stages: [
      {
        title: "Вручение масок",
        desc: "Гости получают маски на входе.",
      },
      {
        title: "Парад костюмов",
        desc: "Дефиле участников в маскарадных костюмах.",
      },
      {
        title: "Танцы и конкурсы",
        desc: "Развлекательная программа и танцы.",
      },
    ],
    reward: 1500,
    hasAchievement: false,
    organizer: "Mask Club",
    image:
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 5,
    title: "Summer Beach Party",
    description: "Летняя вечеринка на пляже с коктейлями, музыкой и конкурсами.",
    date: "20 июня",
    location: "г.Актау",
    price: 12000,
    type: "Пляжные",
    category: "Вечеринка",
    stages: [
      {
        title: "Открытие",
        desc: "Встреча гостей и запуск бумажных фонариков.",
      },
      {
        title: "Пенная дискотека",
        desc: "Танцы в пене под открытым небом.",
      },
      {
        title: "Конкурсы",
        desc: "Весёлые пляжные конкурсы с призами.",
      },
    ],
    reward: 3000,
    hasAchievement: true,
    organizer: "BeachFun",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 6,
    title: "Sunset Chill",
    description: "Вечеринка на закате с лаунж-музыкой и коктейлями.",
    date: "15 июля",
    location: "г.Актау",
    price: 10000,
    type: "Пляжные",
    category: "Вечеринка",
    stages: [
      {
        title: "Лаунж-зона",
        desc: "Отдых на пуфах под музыку.",
      },
      {
        title: "Бармен-шоу",
        desc: "Показательные выступления барменов.",
      },
      {
        title: "Закатная фотосессия",
        desc: "Профессиональные фото на фоне заката.",
      },
    ],
    reward: 2000,
    hasAchievement: false,
    organizer: "Chill Events",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 7,
    title: "Foam Beach Fest",
    description: "Пенная вечеринка на пляже с конкурсами и призами.",
    date: "22 июля",
    location: "г.Актау",
    price: 11000,
    type: "Пляжные",
    category: "Вечеринка",
    stages: [
      {
        title: "Пенная зона",
        desc: "Танцы в пене для всех желающих.",
      },
      {
        title: "Музыкальный марафон",
        desc: "Выступления диджеев и музыкантов.",
      },
      {
        title: "Игры на пляже",
        desc: "Командные игры и эстафеты.",
      },
    ],
    reward: 2500,
    hasAchievement: true,
    organizer: "Foam Team",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 8,
    title: "Tropical Night",
    description: "Тропическая вечеринка с фруктами, коктейлями и танцами.",
    date: "29 июля",
    location: "г.Актау",
    price: 9500,
    type: "Пляжные",
    category: "Вечеринка",
    stages: [
      {
        title: "Фруктовый бар",
        desc: "Свежие фрукты и напитки для гостей.",
      },
      {
        title: "Танцы на песке",
        desc: "Танцевальная программа на пляже.",
      },
      {
        title: "Конкурс лимбо",
        desc: "Соревнование на гибкость и ловкость.",
      },
    ],
    reward: 1800,
    hasAchievement: false,
    organizer: "Tropic Events",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 9,
    title: "Night Club Fever",
    description: "Вечеринка в ночном клубе с лучшими диджеями города.",
    date: "3 марта",
    location: "г.Алматы",
    price: 13000,
    type: "Клубные",
    category: "Вечеринка",
    stages: [
      {
        title: "Открытие",
        desc: "Встреча гостей и welcome drink.",
      },
      {
        title: "DJ Battle",
        desc: "Соревнование диджеев за пультами.",
      },
      {
        title: "Afterparty",
        desc: "Танцы до утра.",
      },
    ],
    reward: 3500,
    hasAchievement: true,
    organizer: "ClubX",
    image:
      "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 10,
    title: "Electro Night",
    description: "Электронная вечеринка с лазерным шоу и спецэффектами.",
    date: "17 апреля",
    location: "г.Нур-Султан",
    price: 14000,
    type: "Клубные",
    category: "Вечеринка",
    stages: [
      {
        title: "Лазерное шоу",
        desc: "Захватывающее световое представление.",
      },
      {
        title: "Сет диджея",
        desc: "Электронная музыка всю ночь.",
      },
      {
        title: "Танцевальный флешмоб",
        desc: "Общий танец для всех гостей.",
      },
    ],
    reward: 4000,
    hasAchievement: false,
    organizer: "Electro Club",
    image:
      "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 11,
    title: "Hip-Hop Jam",
    description: "Вечеринка для любителей хип-хопа и уличной культуры.",
    date: "12 мая",
    location: "г.Алматы",
    price: 9000,
    type: "Клубные",
    category: "Вечеринка",
    stages: [
      {
        title: "Breakdance Battle",
        desc: "Соревнования по брейк-дансу.",
      },
      {
        title: "Rap Open Mic",
        desc: "Свободный микрофон для рэп-исполнителей.",
      },
      {
        title: "Graffiti Show",
        desc: "Показ граффити-арта.",
      },
    ],
    reward: 2000,
    hasAchievement: true,
    organizer: "HipHop Crew",
    image:
      "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 12,
    title: "Karaoke Star",
    description: "Караоке-вечеринка с конкурсом на лучший вокал.",
    date: "25 июня",
    location: "г.Караганда",
    price: 7000,
    type: "Клубные",
    category: "Вечеринка",
    stages: [
      {
        title: "Регистрация участников",
        desc: "Запись на конкурс караоке.",
      },
      {
        title: "Основной конкурс",
        desc: "Выступления участников на сцене.",
      },
      {
        title: "Награждение",
        desc: "Вручение призов лучшим исполнителям.",
      },
    ],
    reward: 1200,
    hasAchievement: false,
    organizer: "Karaoke Club",
    image:
      "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?w=88&h=88&fit=crop&crop=center",
  },
];
