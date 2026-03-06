# Хранилище фотографий — Cloudflare R2 (S3-совместимое)

Полная документация по реализации загрузки, хранения и отображения фотографий в проекте Point-TMA. Используется как руководство для имплементации в другом проекте.

---

## Оглавление

1. [Стек и зависимости](#1-стек-и-зависимости)
2. [Переменные окружения](#2-переменные-окружения)
3. [Архитектура потока данных](#3-архитектура-потока-данных)
4. [Бэкенд: S3-клиент и загрузка](#4-бэкенд-s3-клиент-и-загрузка)
5. [Бэкенд: TRPC-эндпоинты](#5-бэкенд-trpc-эндпоинты)
6. [Фронтенд: обработка изображений](#6-фронтенд-обработка-изображений)
7. [Фронтенд: UI-компоненты загрузки](#7-фронтенд-ui-компоненты-загрузки)
8. [Получение и отображение фото](#8-получение-и-отображение-фото)
9. [Схема базы данных](#9-схема-базы-данных)
10. [Список всех задействованных файлов](#10-список-всех-задействованных-файлов)
11. [Пошаговый план имплементации](#11-пошаговый-план-имплементации)
12. [Важные ограничения и нюансы](#12-важные-ограничения-и-нюансы)

---

## 1. Стек и зависимости

### npm-пакеты

```json
{
  "@aws-sdk/client-s3": "^3.842.0",
  "browser-image-compression": "^2.0.2",
  "heic-convert": "^2.1.0",
  "@types/heic-convert": "^2.1.0",
  "uuid": "^11.1.0"
}
```

| Пакет | Назначение |
|-------|-----------|
| `@aws-sdk/client-s3` | S3-совместимый клиент для загрузки файлов в Cloudflare R2 |
| `browser-image-compression` | Сжатие изображений на клиенте перед отправкой |
| `heic-convert` | Конвертация HEIC/HEIF (фото с iPhone) в PNG |
| `uuid` | Генерация уникальных ключей для файлов в бакете |

### Провайдер хранения

**Cloudflare R2** — S3-совместимое объектное хранилище. Работает через стандартный `@aws-sdk/client-s3`, отличие только в `endpoint` и `region: "auto"`.

---

## 2. Переменные окружения

```env
# Cloudflare R2 (S3-совместимое хранилище)
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=fruit-game
R2_ACCESS_KEY_ID=<access-key>
R2_SECRET_ACCESS_KEY=<secret-key>
R2_PUBLIC_URL=https://pub-<id>.r2.dev

# Для фронтенда (Vite)
VITE_BUCKET_PUBLIC_URL=https://pub-<id>.r2.dev
```

| Переменная | Описание |
|-----------|----------|
| `R2_ENDPOINT` | URL эндпоинта R2 (аналог S3 endpoint) |
| `R2_BUCKET_NAME` | Имя бакета |
| `R2_ACCESS_KEY_ID` | Ключ доступа (аналог AWS Access Key) |
| `R2_SECRET_ACCESS_KEY` | Секретный ключ (аналог AWS Secret Key) |
| `R2_PUBLIC_URL` | Публичный URL бакета для чтения файлов |
| `VITE_BUCKET_PUBLIC_URL` | То же, но доступно на фронтенде через Vite |

---

## 3. Архитектура потока данных

```
┌─────────────────────────────────────────────────────────────┐
│                        ФРОНТЕНД                            │
│                                                             │
│  1. <input type="file" accept="image/*">                    │
│  2. Проверка HEIC → convertHeicToPng() (если нужно)         │
│  3. Сжатие → browser-image-compression (1MB, 1920px)        │
│  4. Конвертация → convertToBase64()                         │
│  5. Отправка base64-строки через TRPC-мутацию               │
└───────────────────────┬─────────────────────────────────────┘
                        │ base64 string
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                        БЭКЕНД                               │
│                                                             │
│  6. Валидация base64 (regex)                                │
│  7. Генерация UUID для ключа файла                          │
│  8. PutObjectCommand → Cloudflare R2 (ACL: public-read)     │
│  9. Сохранение UUID в базу данных (НЕ полный URL)           │
└───────────────────────┬─────────────────────────────────────┘
                        │ UUID
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     ОТОБРАЖЕНИЕ                             │
│                                                             │
│  10. getImageUrl(uuid) → `${VITE_BUCKET_PUBLIC_URL}/${uuid}`│
│  11. <img src={publicUrl} />                                │
└─────────────────────────────────────────────────────────────┘
```

**Ключевой принцип:** В БД хранится только UUID (ключ файла в бакете), а полный URL собирается на лету через `getImageUrl()`.

---

## 4. Бэкенд: S3-клиент и загрузка

### Файл: `src/lib/s3/uploadBase64.ts`

```typescript
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: "auto",                        // Для R2 всегда "auto"
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadBase64Image(data: string): Promise<string> {
  // Валидация формата data:image/png;base64,iVBOR...
  const match = data.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid Base64 image - regex pattern failed");
  }
  const [, mime, b64] = match;
  const id = uuidv4();

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: id,                           // UUID как имя файла
      Body: Buffer.from(b64, "base64"),  // Декодирование base64 в бинарные данные
      ContentType: mime,                 // image/png, image/jpeg и т.д.
      ACL: "public-read",               // Публичный доступ на чтение
    }),
  );

  return id;                             // Возвращаем UUID
}
```

**Что делает:**
1. Парсит Data URL (`data:image/png;base64,...`) регулярным выражением
2. Извлекает MIME-тип и base64-данные
3. Генерирует UUID v4 как ключ файла
4. Загружает в R2/S3 бакет с публичным доступом
5. Возвращает UUID (НЕ полный URL)

---

## 5. Бэкенд: TRPC-эндпоинты

### 5.1. Онбординг (первичная загрузка фото)

**Файл:** `src/trpc/main.ts` — процедура `getOnBoarding`

```typescript
getOnBoarding: procedure
  .input(z.object({
    name: z.string(),
    surname: z.string(),
    login: z.string(),
    birthday: z.string(),
    city: z.string(),
    bio: z.string(),
    sex: z.string(),
    photo: z.string(),       // base64
    isOnboarded: z.boolean(),
  }))
  .mutation(async ({ ctx, input }) => {
    const imageUUID = await uploadBase64Image(input.photo);

    await db.update(usersTable).set({
      ...input,
      photo: imageUUID,      // Сохраняем UUID в БД
    }).where(eq(usersTable.id, ctx.userId));
  }),
```

### 5.2. Обновление профиля (фото + галерея)

**Файл:** `src/trpc/main.ts` — процедура `updateProfile`

```typescript
updateProfile: procedure
  .input(z.object({
    email: z.string(),
    phone: z.string(),
    bio: z.string(),
    photo: z.string(),               // base64, UUID или пустая строка
    gallery: z.array(z.string()),    // массив base64 или UUID
    name: z.string(),
    surname: z.string(),
    birthday: z.string(),
    city: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Логика обработки основного фото:
    if (input.photo.startsWith("data:image/")) {
      // Новое фото — загрузить
      const imageUUID = await uploadBase64Image(input.photo);
      await db.update(usersTable)
        .set({ photo: imageUUID })
        .where(eq(usersTable.id, ctx.userId));
    } else if (input.photo !== "") {
      // Существующий UUID — сохранить как есть
      await db.update(usersTable)
        .set({ photo: input.photo })
        .where(eq(usersTable.id, ctx.userId));
    } else {
      // Пустая строка — удалить фото
      await db.update(usersTable)
        .set({ photo: null })
        .where(eq(usersTable.id, ctx.userId));
    }

    // Обработка галереи: загрузить новые, оставить существующие UUID
    if (input.gallery.length > 7) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Gallery must be less than 7 images" });
    }

    const galleryUUIDs = await Promise.all(
      input.gallery.map(async (image) => {
        if (typeof image === "string" && image.startsWith("data:image/")) {
          return await uploadBase64Image(image);
        }
        return image; // Уже UUID — оставить
      }),
    );
    await db.update(usersTable)
      .set({ gallery: galleryUUIDs })
      .where(eq(usersTable.id, ctx.userId));
  }),
```

**Ключевая логика различения нового фото от существующего:**
- Начинается с `data:image/` → новое фото, загрузить
- Непустая строка → существующий UUID, сохранить
- Пустая строка → удалить фото из БД

### 5.3. Удаление фото

**Файл:** `src/trpc/main.ts` — процедура `deletePhoto`

```typescript
deletePhoto: procedure
  .input(z.object({ photo: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
    });

    if (user.photo === input.photo) {
      // Удалить основное фото
      await db.update(usersTable)
        .set({ photo: null })
        .where(eq(usersTable.id, ctx.userId));
    } else if (user.gallery?.includes(input.photo)) {
      // Удалить из галереи
      const updatedGallery = user.gallery.filter(
        (galleryPhoto) => galleryPhoto !== input.photo,
      );
      await db.update(usersTable)
        .set({ gallery: updatedGallery })
        .where(eq(usersTable.id, ctx.userId));
    }
  }),
```

**Примечание:** Фото удаляется только из БД, файл из R2/S3 НЕ удаляется. Если нужна очистка — реализовать отдельно через `DeleteObjectCommand`.

### 5.4. Создание встречи/события с фото

**Файл:** `src/trpc/meetings.ts` — процедура `createMeet`

```typescript
createMeet: procedure
  .input(z.object({
    name: z.string(),
    image: z.string().optional(),                  // base64
    gallery: z.array(z.string()).optional(),        // массив base64
    // ... другие поля
  }))
  .mutation(async ({ ctx, input }) => {
    let imageUrl = null;
    if (input.image) {
      imageUrl = await uploadBase64Image(input.image);
    }

    const [meet] = await db.insert(meetTable).values({
      image: imageUrl,
      gallery: input.gallery,
      // ...
    }).returning();
  }),
```

### 5.5. Обновление встречи

**Файл:** `src/trpc/meetings.ts` — процедура `updateMeet`

```typescript
// Загружать только если фото изменилось
let imageUrl = existingMeet.image;
if (image && image !== existingMeet.image) {
  imageUrl = await uploadBase64Image(image);
}
```

### 5.6. CRM: создание пользователя

**Файл:** `src/trpc/crm.ts` — процедура `createUserBot`

```typescript
const photoUrl = await uploadBase64Image(input.photo);
const galleryUrls = await Promise.all(
  input.gallery.map(async (gallery) => await uploadBase64Image(gallery)),
);
```

---

## 6. Фронтенд: обработка изображений

### 6.1. Конвертация HEIC в PNG

**Файл:** `src/lib/utils/isHeicFile.ts`

```typescript
export const isHeicFile = (file: File): boolean => {
  const ext = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return (
    ext.endsWith(".heic") ||
    ext.endsWith(".heif") ||
    mime === "image/heic" ||
    mime === "image/heif"
  );
};
```

**Файл:** `src/lib/utils/convertHeicToPng.tsx`

```typescript
import convert from "heic-convert/browser";

export const convertHeicToPng = async (file: File): Promise<File> => {
  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = new Uint8Array(arrayBuffer);
  const outputBuffer = await convert({
    buffer: inputBuffer as unknown as ArrayBufferLike,
    format: "PNG",
    quality: 0.2,          // Качество 20%
  });
  const blob = new Blob([outputBuffer], { type: "image/png" });
  const newFileName = file.name.replace(/\.heic$/i, ".png");
  return new File([blob], newFileName, { type: "image/png" });
};
```

### 6.2. Сжатие изображений

Используется `browser-image-compression` с параметрами:

```typescript
import imageCompression from "browser-image-compression";

const compressedFile = await imageCompression(fileToProcess, {
  maxSizeMB: 1,             // Максимум 1 МБ
  maxWidthOrHeight: 1920,   // Максимум 1920px по большей стороне
  useWebWorker: true,       // В отдельном потоке
});
```

### 6.3. Конвертация в Base64

**Файл:** `src/lib/utils/convertToBase64.ts`

```typescript
export const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);  // "data:image/png;base64,iVBOR..."
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};
```

### 6.4. Полный пайплайн обработки (копируй как есть)

```typescript
import imageCompression from "browser-image-compression";
import { isHeicFile } from "~/lib/utils/isHeicFile";
import { convertHeicToPng } from "~/lib/utils/convertHeicToPng";
import { convertToBase64 } from "~/lib/utils/convertToBase64";

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  let fileToProcess: File = file;

  // Шаг 1: Конвертация HEIC (iPhone)
  if (isHeicFile(fileToProcess)) {
    fileToProcess = await convertHeicToPng(fileToProcess);
  }

  // Шаг 2: Сжатие
  const compressedFile = await imageCompression(fileToProcess, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
  fileToProcess = compressedFile;

  // Шаг 3: Конвертация в Base64
  const base64str = await convertToBase64(fileToProcess);
  setBase64(base64str);
};
```

---

## 7. Фронтенд: UI-компоненты загрузки

### 7.1. Загрузка основного фото

```tsx
<label htmlFor="profile-photo-upload" className="group relative flex w-full cursor-pointer">
  {base64 ? (
    <img src={base64} alt="Аватар" className="h-96 w-full object-cover" />
  ) : (
    <div className="flex h-96 w-full flex-col items-center justify-center bg-gray-50">
      <ImagePlus className="h-10 w-10 text-violet-600" />
      <span className="text-base font-semibold text-gray-900">Добавить фото</span>
      <span className="mt-1 text-sm text-gray-500">Рекомендуемый размер 1080x1080</span>
    </div>
  )}
  <input
    id="profile-photo-upload"
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleFileChange}
  />
</label>
```

### 7.2. Добавление в галерею

```tsx
const handleAddGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // ... тот же пайплайн: HEIC → сжатие → base64 ...

  setGallery((prev) => [...prev, base64str]);  // Добавляем в массив
};
```

---

## 8. Получение и отображение фото

### 8.1. Формирование URL по UUID

**Файл:** `src/lib/utils/getImageURL.ts`

```typescript
export function getImageUrl(imageId: string) {
  const bucketUrl = import.meta.env.VITE_BUCKET_PUBLIC_URL;
  return `${bucketUrl}/${imageId}`;
}
// Пример: getImageUrl("a1b2c3d4-...") → "https://pub-xxx.r2.dev/a1b2c3d4-..."
```

### 8.2. Умный выбор фото с фоллбэками

**Файл:** `src/lib/utils/getImage.ts`

```typescript
import { User } from "~/db/schema";
import { getImageUrl } from "./getImageURL";

export const getImage = (user: User, mainPhoto: string) => {
  const hasValidMainPhoto = mainPhoto && mainPhoto.trim() !== "";
  const hasValidUserPhoto = user?.photo && user?.photo.trim() !== "";

  let img: string;

  if (hasValidMainPhoto) {
    img = getImageUrl(mainPhoto.trim());           // 1. Переданное фото
  } else if (hasValidUserPhoto) {
    img = getImageUrl(user?.photo!.trim());         // 2. Фото из профиля (R2)
  } else if (user?.photoUrl && user.photoUrl.trim() !== "") {
    img = user.photoUrl.trim();                      // 3. Аватар из Telegram
  } else {
    img = user?.sex === "male" ? "/men.jpeg" : "/women.jpeg"; // 4. Дефолт по полу
  }

  return img;
};
```

### 8.3. Обработка ошибок загрузки (onError)

```tsx
<img
  src={getImage(user, imageToShow)}
  onError={(e) => {
    // Если R2 URL не загрузился — пробуем Telegram аватар
    if (user?.photoUrl && e.currentTarget.src !== user.photoUrl) {
      e.currentTarget.src = user.photoUrl.trim();
    } else {
      // Последний фоллбэк — дефолтное изображение
      e.currentTarget.src = user?.sex === "male" ? "/men.jpeg" : "/women.jpeg";
    }
  }}
/>
```

### 8.4. Отображение галереи

```tsx
{allPhotos.map((img, idx) => (
  <img
    key={idx}
    src={img.startsWith("data:image/") ? img : getImageUrl(img)}
    alt=""
    className="h-20 w-20 cursor-pointer rounded-lg object-cover"
  />
))}
```

**Примечание:** Проверка `startsWith("data:image/")` нужна для превью ещё не загруженных фото (base64 в стейте).

---

## 9. Схема базы данных

### Таблица `users`

```typescript
export const usersTable = pgTable("users", {
  // ...
  photoUrl: varchar("photoUrl", { length: 255 }),   // URL аватара из Telegram
  photo:    varchar("photo", { length: 255 }),       // UUID файла в R2
  gallery:  jsonb("gallery").$type<string[]>(),      // Массив UUID файлов в R2
  // ...
});
```

### Таблица `meets`

```typescript
export const meetTable = pgTable("meets", {
  // ...
  image:   varchar("image", { length: 255 }),       // UUID файла в R2
  gallery: jsonb("gallery").$type<string[]>(),      // Массив UUID
  // ...
});
```

### Таблица `events`

```typescript
export const eventsTable = pgTable("events", {
  // ...
  image: varchar("image", { length: 255 }),         // UUID файла в R2
  // ...
});
```

### Другие таблицы с фото

| Таблица | Поле | Тип |
|---------|------|-----|
| `cases` | `photo` | `varchar(255)` — UUID |
| `keys` | `photo` | `varchar(255)` — UUID |
| `favorites` | `photo` | `varchar(255)` — UUID |

---

## 10. Список всех задействованных файлов

### Ядро (копировать в первую очередь)

| Файл | Назначение |
|------|-----------|
| `src/lib/s3/uploadBase64.ts` | S3-клиент и функция загрузки |
| `src/lib/utils/getImageURL.ts` | Формирование публичного URL |
| `src/lib/utils/getImage.ts` | Выбор фото с цепочкой фоллбэков |
| `src/lib/utils/convertToBase64.ts` | File → Base64 |
| `src/lib/utils/convertHeicToPng.tsx` | HEIC → PNG |
| `src/lib/utils/isHeicFile.ts` | Определение HEIC-формата |

### Бэкенд-эндпоинты

| Файл | Процедуры |
|------|----------|
| `src/trpc/main.ts` | `getOnBoarding`, `updateProfile`, `deletePhoto` |
| `src/trpc/meetings.ts` | `createMeet`, `updateMeet` |
| `src/trpc/crm.ts` | `createUserBot`, `editUser` |

### Фронтенд-компоненты

| Файл | Назначение |
|------|-----------|
| `src/components/OnboardingPage.tsx` | Загрузка фото при регистрации |
| `src/routes/profile-sett.tsx` | Редактирование фото и галереи |
| `src/components/createMeet/Step1.tsx` | Фото при создании встречи |
| `src/components/people/UserPhoto.tsx` | Отображение фото пользователя (свайп) |
| `src/components/FullScreenPhoto.tsx` | Полноэкранный просмотр |
| `src/components/ProfileMore.tsx` | Профиль с галереей |
| `src/components/MeetInfo.tsx` | Фото организатора встречи |

### Конфигурация

| Файл | Назначение |
|------|-----------|
| `.env` / `.env.example` | Переменные R2 |
| `src/db/schema.ts` | Поля `photo`, `gallery`, `photoUrl`, `image` |
| `package.json` | Зависимости |

---

## 11. Пошаговый план имплементации

### Шаг 1: Настройка Cloudflare R2

1. Создать аккаунт Cloudflare (если нет)
2. Перейти в R2 Object Storage → Create Bucket
3. Включить публичный доступ для бакета (Settings → Public Access → Allow)
4. Создать API-токен: R2 → Manage R2 API Tokens → Create API Token
5. Записать `endpoint`, `access_key_id`, `secret_access_key`
6. Скопировать публичный URL бакета (вкладка Settings → Public Bucket URL)

### Шаг 2: Установка зависимостей

```bash
# Бэкенд
npm install @aws-sdk/client-s3 uuid
npm install -D @types/uuid

# Фронтенд
npm install browser-image-compression heic-convert
npm install -D @types/heic-convert
```

### Шаг 3: Переменные окружения

Добавить в `.env`:

```env
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=<bucket-name>
R2_ACCESS_KEY_ID=<key>
R2_SECRET_ACCESS_KEY=<secret>
R2_PUBLIC_URL=https://pub-<id>.r2.dev
VITE_BUCKET_PUBLIC_URL=https://pub-<id>.r2.dev
```

### Шаг 4: Бэкенд — создать загрузчик

Скопировать `src/lib/s3/uploadBase64.ts` (см. раздел 4).

### Шаг 5: Бэкенд — добавить поля в БД

Добавить в таблицу пользователей:

```sql
ALTER TABLE users ADD COLUMN photo VARCHAR(255);
ALTER TABLE users ADD COLUMN gallery JSONB DEFAULT '[]';
```

### Шаг 6: Бэкенд — создать эндпоинты

Минимальный набор:
- Загрузка фото (принимает base64, возвращает UUID)
- Обновление профиля (различает base64 / UUID / пустая строка)
- Удаление фото (убирает UUID из БД)

### Шаг 7: Фронтенд — утилиты обработки

Скопировать файлы:
- `convertToBase64.ts`
- `convertHeicToPng.tsx`
- `isHeicFile.ts`
- `getImageURL.ts`
- `getImage.ts`

### Шаг 8: Фронтенд — UI загрузки

Реализовать `<input type="file" accept="image/*">` + пайплайн обработки (раздел 6.4).

### Шаг 9: Фронтенд — отображение

Использовать `getImageUrl(uuid)` для `<img src>` с `onError` фоллбэком.

---

## 12. Важные ограничения и нюансы

| Аспект | Деталь |
|--------|--------|
| **Presigned URL** | НЕ используются. Загрузка идёт напрямую через серверный S3-клиент |
| **Максимум галереи** | 7 фото на пользователя/встречу |
| **Сжатие** | 1 МБ макс., 1920px макс. сторона |
| **HEIC** | Конвертируется в PNG с quality 0.2 |
| **ACL** | Все файлы `public-read` — доступны по прямой ссылке |
| **Удаление из R2** | НЕ реализовано — файлы остаются в бакете при удалении из БД |
| **Без middleware** | Нет multer/formidable — всё через base64 в JSON body TRPC |
| **Дефолтные аватары** | `/public/men.jpeg` и `/public/women.jpeg` |
| **Telegram fallback** | Поле `photoUrl` хранит URL аватара из Telegram как запасной вариант |
| **Region** | Для Cloudflare R2 всегда `"auto"` |
| **Формат ключа** | UUID v4 без расширения файла |
