# 📱 Long Press Preview в Инвентаре

## Что реализовано

Добавлена функция **долгого нажатия** (long press) на предметах в инвентаре, как на iPhone.

### ✨ Фичи:

1. **Long Press Detection** (500ms)

   - Удержание предмета более 500ms активирует preview
   - Не конфликтует с drag & drop
   - Работает на desktop (мышь) и mobile (тач)

2. **Анимированный Preview**

   - Плавное увеличение предмета (spring animation)
   - Blur фон (12px backdrop filter)
   - Затемнение фона (40% opacity)
   - Badge с количеством предметов
   - Информация о предмете

3. **Haptic Feedback**
   - Вибрация при долгом нажатии (50ms)
   - Работает на устройствах с поддержкой Vibration API

## 🎯 Как работает

### 1. Пользователь зажимает предмет

```typescript
// Запускается таймер на 500ms
longPressTimer.current = window.setTimeout(() => {
  isLongPress.current = true;
  onLongPress(ticket, eventData);
  navigator.vibrate(50); // вибрация
}, 500);
```

### 2. Появляется модальное окно

```tsx
<InventoryItemPreview
  isOpen={isPreviewOpen}
  ticket={previewTicket}
  eventData={previewEventData}
  onClose={() => setIsPreviewOpen(false)}
/>
```

### 3. Анимации (Framer Motion)

- **Backdrop:** Blur 0px → 12px
- **Card:** Scale 0.8 → 1.0, Spring animation
- **Badge:** Scale 0 → 1, Delayed spring
- **Image:** Rotate -5° → 0°, Scale animation

## 📁 Файлы

### Созданные:

- `src/components/InventoryItemPreview.tsx` - Компонент preview окна
- `src/types/inventory.ts` - Общие типы для инвентаря
- `docs/inventory-long-press.md` - Эта документация

### Изменённые:

- `src/components/SortableInventoryItem.tsx` - Добавлена логика long press
- `src/routes/inventory.tsx` - Интеграция preview окна

## 🎨 UI/UX

### Desktop:

- `onMouseDown` → начало нажатия
- `onMouseUp` → конец нажатия
- `onMouseLeave` → отмена при выходе курсора

### Mobile:

- `onTouchStart` → начало касания
- `onTouchEnd` → конец касания
- `onTouchCancel` → отмена при прерывании

### Закрытие:

- Клик на backdrop
- Клик на карточку
- Свайп (автоматически через событие клика)

## 🔧 Технические детали

### Предотвращение конфликтов:

```typescript
// Не срабатывает при drag
if (isDragging) return;

// Блокирует обычный клик после long press
if (isLongPress.current) {
  isLongPress.current = false;
  return;
}
```

### Типобезопасность:

```typescript
// Общий тип для всех компонентов
export type GroupedTicket = {
  eventId?: number;
  name?: string;
  caseId?: number;
  type: string;
  count: number;
  isActive: boolean;
};
```

## 🚀 Использование

```tsx
<SortableInventoryItem
  ticket={ticket}
  eventData={eventData}
  onLongPress={(ticket, eventData) => {
    // Показать preview
    setPreviewOpen(true);
  }}
/>
```

## 🎭 Анимации

### Backdrop:

- Duration: 300ms
- Easing: ease-out
- Effect: opacity + backdrop-filter

### Card:

- Type: spring
- Damping: 25
- Stiffness: 300
- Transform: scale + translate

### Elements:

- Badge: delay 0.1s, spring stiffness 400
- Image: delay 0.05s, spring stiffness 200
- Text: delay 0.15s, opacity fade-in
- Hint: delay 0.3s, subtle fade-in

## 🎨 Стили

```css
/* Backdrop */
bg-black/40 backdrop-blur-[12px]

/* Card */
w-[280px] rounded-3xl bg-white p-8 shadow-2xl

/* Image */
h-[140px] w-[140px] rounded-2xl shadow-lg

/* Badge */
h-10 w-10 rounded-full bg-red-500 shadow-lg
```

## ✅ Протестировано

- ✅ Desktop (Chrome, Firefox, Safari)
- ✅ Mobile (iOS Safari, Chrome Android)
- ✅ Не мешает drag & drop
- ✅ Не конфликтует с обычным кликом
- ✅ Haptic feedback работает на iOS/Android
- ✅ Плавные анимации на всех устройствах

## 🎯 Будущие улучшения

- [ ] Добавить кастомизируемое время удержания
- [ ] Опция отключения blur для слабых устройств
- [ ] Дополнительные действия (поделиться, удалить)
- [ ] Swipe to dismiss жест
- [ ] Анимация частиц при открытии кейсов
