export const fakeUsers = [
  {
    id: 1,
    referrerId: null,
    photoUrl:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    name: "Евгения",
    surname: "Воробьёва",
    login: "evgenia_v",
    birthday: "1999-05-12",
    city: "Караганда",
    interests: "кофе, спорт, шутки",
    email: "evgenia.v@example.com",
    phone: "+77011234567",
    bio: "Просто девушка, которая любит кофе, спорт и хорошие шутки. В поисках новых приключений и смыслов.",
    inventory: [],
    balance: 1200,
    sex: "female",
    photo:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    gallery: [
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face",
    ],
    meetings: [1], // Привязано к встрече с id 1 из meetingsConfig
  },
  {
    id: 2,
    referrerId: 1,
    photoUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    name: "Мария",
    surname: "Петрова",
    login: "maria_p",
    birthday: "1997-11-23",
    city: "Алматы",
    interests: "конференции, маркетинг, путешествия",
    email: "maria.p@example.com",
    phone: "+77021234567",
    bio: "Люблю посещать конференции и узнавать новое.",
    inventory: [],
    balance: 800,
    sex: "female",
    photo:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    gallery: [
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
    ],
    meetings: [2], // Привязано к встрече с id 2 из meetingsConfig
  },
  {
    id: 3,
    referrerId: null,
    photoUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Владимир",
    surname: "Баранов",
    login: "vlad_baranov",
    birthday: "1995-03-15",
    city: "Астана",
    interests: "концерты, музыка, гитара",
    email: "vladimir.b@example.com",
    phone: "+77031234567",
    bio: "Музыкант и меломан. Люблю живые концерты.",
    inventory: [],
    balance: 500,
    sex: "male",
    photo:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    gallery: [
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
    ],
    meetings: [3], // Привязано к встрече с id 3 из meetingsConfig
  },
  {
    id: 4,
    referrerId: 2,
    photoUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    name: "Анна",
    surname: "Яковлева",
    login: "anna_yak",
    birthday: "2000-07-08",
    city: "Шымкент",
    interests: "мастер-классы, искусство, дизайн",
    email: "anna.y@example.com",
    phone: "+77041234567",
    bio: "Творческая личность, люблю мастерить и создавать новое.",
    inventory: [],
    balance: 950,
    sex: "female",
    photo:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    gallery: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face",
    ],
    meetings: [4], // Привязано к встрече с id 4 из meetingsConfig
  },
  {
    id: 5,
    referrerId: null,
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    name: "Андрей",
    surname: "Григорьев",
    login: "andrey_g",
    birthday: "1998-09-30",
    city: "Павлодар",
    interests: "дизайн, нетворкинг, стартапы",
    email: "andrey.g@example.com",
    phone: "+77051234567",
    bio: "Дизайнер, ищу единомышленников для новых проектов.",
    inventory: [],
    balance: 1100,
    sex: "male",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    gallery: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
    ],
    meetings: [5], // Привязано к встрече с id 5 из meetingsConfig
  },
  {
    id: 6,
    referrerId: 3,
    photoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    name: "Анна",
    surname: "Морозова",
    login: "anna_morozova",
    birthday: "2001-01-19",
    city: "Костанай",
    interests: "концерты, путешествия, книги",
    email: "anna.m@example.com",
    phone: "+77061234567",
    bio: "Люблю концерты и новые знакомства.",
    inventory: [],
    balance: 700,
    sex: "female",
    photo:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    gallery: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face",
    ],
    meetings: [6], // Привязано к встрече с id 6 из meetingsConfig
  },
  {
    id: 7,
    referrerId: null,
    photoUrl:
      "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=150&h=150&fit=crop&crop=face",
    name: "Дмитрий",
    surname: "Смирнов",
    login: "dmitry_smirnov",
    birthday: "1996-04-22",
    city: "Усть-Каменогорск",
    interests: "спорт, программирование, киберспорт",
    email: "dmitry.s@example.com",
    phone: "+77071234567",
    bio: "Разработчик и фанат киберспорта. Люблю активный отдых.",
    inventory: [],
    balance: 600,
    sex: "male",
    photo:
      "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=150&h=150&fit=crop&crop=face",
    gallery: [
      "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=300&h=300&fit=crop&crop=face",
    ],
    meetings: [7], // Привязано к встрече с id 7 из meetingsConfig
  },
  {
    id: 8,
    referrerId: 5,
    photoUrl:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face",
    name: "Светлана",
    surname: "Ким",
    login: "svetlana_kim",
    birthday: "1994-12-05",
    city: "Семей",
    interests: "фотография, путешествия, природа",
    email: "svetlana.kim@example.com",
    phone: "+77081234567",
    bio: "Фотографирую всё, что вижу. Люблю природу и новые места.",
    inventory: [],
    balance: 1300,
    sex: "female",
    photo:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face",
    gallery: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop&crop=face",
    ],
    meetings: [8], // Привязано к встрече с id 8 из meetingsConfig
  },
  {
    id: 9,
    referrerId: null,
    photoUrl:
      "https://images.unsplash.com/photo-1519340333755-c8924e1b6e6b?w=150&h=150&fit=crop&crop=face",
    name: "Игорь",
    surname: "Кузнецов",
    login: "igor_kuznetsov",
    birthday: "1993-08-14",
    city: "Тараз",
    interests: "автомобили, технологии, стартапы",
    email: "igor.k@example.com",
    phone: "+77091234567",
    bio: "Инженер, люблю машины и всё, что связано с технологиями.",
    inventory: [],
    balance: 900,
    sex: "male",
    photo:
      "https://images.unsplash.com/photo-1519340333755-c8924e1b6e6b?w=150&h=150&fit=crop&crop=face",
    gallery: [
      "https://images.unsplash.com/photo-1519340333755-c8924e1b6e6b?w=300&h=300&fit=crop&crop=face",
    ],
    meetings: [9], // Привязано к встрече с id 9 из meetingsConfig
  },
  {
    id: 10,
    referrerId: 8,
    photoUrl:
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=150&h=150&fit=crop&crop=face",
    name: "Ольга",
    surname: "Романова",
    login: "olga_romanova",
    birthday: "1992-02-28",
    city: "Актобе",
    interests: "йога, психология, книги",
    email: "olga.r@example.com",
    phone: "+77101234567",
    bio: "Практикую йогу и изучаю психологию. Люблю читать и делиться знаниями.",
    inventory: [],
    balance: 1050,
    sex: "female",
    photo:
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=150&h=150&fit=crop&crop=face",
    gallery: [
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=300&h=300&fit=crop&crop=face",
    ],
    meetings: [10], // Привязано к встрече с id 10 из meetingsConfig
  },
];
