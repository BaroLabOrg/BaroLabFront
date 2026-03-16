# BaroLabFront — Полный контекст проекта

Дата аудита: 2026-03-16

## 1. Назначение проекта

`BaroLabFront` — фронтенд SPA для сообщества модов (Barotrauma/Steam Workshop). Приложение покрывает:

- каталог модов;
- карточку конкретного мода;
- создание/просмотр/редактирование руководств (Markdown);
- комментарии к моду;
- каталог и создание тегов;
- административную панель модерации (пользователи, моды, руководства, комментарии).

Основной UX: пользователь аутентифицируется (обычно или Google OAuth), просматривает/создает контент, администраторы модерируют.

## 2. Технологический стек

- `React 19`
- `Vite 6`
- `react-router-dom 7` (используется API в стиле v6: `Routes`, `Route`, `Navigate`)
- `@react-oauth/google` для Google Sign-In
- `react-markdown + remark-gfm` для рендера Markdown-гайдов
- `Vitest + Testing Library + jsdom` для unit/integration тестов UI
- Чистый CSS (без Tailwind/SCSS), с общей системой CSS-переменных в `src/index.css`

Скрипты `package.json`:

- `npm run dev` — dev-сервер
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm test` — запуск тестов (`vitest run`)

## 3. Запуск и окружение

### Локальный запуск

```bash
npm install
npm run dev
```

Альтернатива для Windows: `start_frontend.bat`.

### Переменные окружения

Используется:

- `VITE_API_BASE_URL` (базовый URL backend API)
- `VITE_GOOGLE_CLIENT_ID` (Google OAuth client id)

Важно:

- `src/api/api.js` использует `VITE_API_BASE_URL` как обязательную переменную.
- при отсутствии `VITE_API_BASE_URL` запросы падают с ошибкой конфигурации (`VITE_API_BASE_URL is not configured`).

## 4. Структура репозитория

```text
src/
  api/                # HTTP слой и endpoint-обертки
  components/         # UI-компоненты
  context/            # AuthContext
  pages/              # роутовые страницы
  test/               # тестовый setup
  App.jsx             # маршрутизация приложения
  main.jsx            # bootstrap (Router + Auth + GoogleOAuthProvider)
  index.css           # дизайн-система/базовые стили
```

Дополнительно:

- `GUIDE_INSTRUCTIONS.md` — инструкция по Markdown для редактора руководств;
- `dist/` — артефакты сборки;
- `.idea/` — IDE метаданные.

## 5. Архитектура приложения

### 5.1 Bootstrap

Точка входа: `src/main.jsx`.

Провайдеры оборачиваются в таком порядке:

1. `GoogleOAuthProvider`
2. `BrowserRouter`
3. `AuthProvider`
4. `App`

### 5.2 Маршрутизация (`src/App.jsx`)

Публичные:

- `/login`
- `/sign-up`
- `/mods` (фактически доступен всем)
- `/guides`
- `/tags`
- `/mod/:externalId`
- `/mod/:id/guides/:guideId`

Защищенные:

- `/admin` — только админ
- `/mod/:id/guides/new` — любой авторизованный
- `/mod/:id/guides/:guideId/edit` — любой авторизованный (дополнительная проверка прав есть в UI страниц/кнопок)

Редиректы:

- `/` -> `/mods`
- `*` -> `/mods` (если авторизован) иначе `/login`

### 5.3 Аутентификация и сессия

`src/context/AuthContext.jsx`:

- хранит JWT в `localStorage` (`barolab_token`);
- вручную декодирует JWT (`parseJwt`);
- проверяет `exp` на клиенте;
- формирует объект `user` (`id`, `role`, `username`);
- предоставляет `login`, `signUp`, `loginWithGoogle`, `logout`;
- вычисляет флаги:
  - `isAuthenticated`
  - `isAdmin` (`ADMIN` или `SUPER_ADMIN`)
  - `isSuperAdmin` (`SUPER_ADMIN`)

Защита роутов — `src/components/ProtectedRoute.jsx`.

## 6. Роли и доступ

Используемые роли в UI:

- `USER`
- `SUPERUSER` (есть в списке ролей в админке)
- `ADMIN`
- `SUPER_ADMIN`

Логика:

- вход в админ-панель (`/admin`) только для `isAdmin`;
- вкладка управления пользователями показывается только `SUPER_ADMIN`;
- управление тегами у конкретного мода (удаление) доступно админам;
- создание комментариев/гайдов/модов доступно авторизованным.

## 7. API слой и контракты

### 7.1 Базовые принципы

`src/api/api.js`:

- базовый `request()` над `fetch`;
- базовый URL берется из `VITE_API_BASE_URL`;
- автоподстановка Bearer токена;
- обработка query params;
- нормализация пагинации (`normalizePagedResponse`);
- единый класс ошибок `ApiRequestError`.

### 7.2 Endpoint-группы

Auth:

- `POST /login`
- `POST /sign-up`
- `POST /api/v1/auth/google`

Users:

- `GET /users`
- `GET /user/:id`
- `PUT /user/:id/activate`
- `PUT /user/:id/block`
- `PUT /user/:id/role`

Mods:

- `GET /mods`
- `GET /search/mods`
- `GET /mod/:externalId`
- `POST /mods`
- `PUT /mod/:externalId/activate`
- `PUT /mod/:externalId/block`
- `POST /mod/:externalId/transition` (subscribe/redirect to Steam)
- `POST /mod/:externalId/tags/:tagId`
- `DELETE /mod/:externalId/tags/:tagId`

Comments:

- `GET /mod/:externalId/comment`
- `GET /mod/:externalId/comment/:commentId`
- `POST /mod/:externalId/comment`
- `PUT /mod/:externalId/comment/:commentId/activate`
- `PUT /mod/:externalId/comment/:commentId/block`

Guides:

- `GET /mod/:modId/guide`
- `GET /mod/:modId/guide/:guideId`
- `POST /mod/:modId/guide`
- `PUT /mod/:modId/guide/:guideId`
- `DELETE /mod/:modId/guide/:guideId`
- `GET /guides`
- `PUT /guides/:guideId/activate`
- `PUT /guides/:guideId/block`

Tags:

- `GET /api/tags`
- `GET /api/tags/:tagId`
- `POST /api/tags`

### 7.3 Форматы данных

В проекте явно поддерживается смесь `snake_case` и `camelCase` от бэкенда:

- `created_at` / `createdAt`
- `total_pages` / `totalPages`
- `has_next` / `hasNext`

Это частично нормализуется вручную в UI и `normalizePagedResponse`.

## 8. Страницы и пользовательские сценарии

### `LoginPage` / `SignUpPage`

- классическая форма + Google OAuth;
- обработка сценария, когда аккаунт привязан к Google (403 в login);
- после успеха редирект на `/mods`.

### `ModsListPage`

- пагинация модов;
- поиск по названию (`q`) и фильтрация по тегам (`tags`) через URL query params;
- форма создания нового мода (только авторизованный);
- преобразование полей списков через CSV input (`additional_images`, `required_mods`, `mods_above`).

### `ModPage`

- загрузка деталей мода по `externalId`;
- hero-блок + кнопка `Download` (subscribe transition);
- галерея `additional_images` с превью и thumbnails;
- описание;
- блоки: `UsedInCollections`, `GuidesSection`, `CommentsSection`, `ModSidebar`;
- добавление/удаление тегов через sidebar.

### `GuidesListPage`

- общий каталог руководств с пагинацией;
- для авторизованных — модальное окно выбора мода перед созданием нового руководства;
- переход к чтению гайда и к карточке мода.

### `ModGuidePage`

- рендер Markdown (GFM);
- кастомные компоненты:
  - `blockquote` -> стилизованная цитата с автором (разбор по ` — `);
  - `table` -> infobox при заголовке `INFOBOX:`.

### `ModGuideEditor`

- режим создания и редактирования;
- сплит-панель: markdown source + live preview;
- подключает `GUIDE_INSTRUCTIONS.md` как встроенную справку (`?raw` import).

### `TagsPage`

- каталог тегов с сортировкой/направлением/размером страницы;
- параметры синхронизируются с URL query (`useSearchParams`);
- создание тега с маппингом ошибок (`mapCreateTagError`).

### `AdminPage`

Вкладки:

- `Users` (только `SUPER_ADMIN`)
- `Mods`
- `Guides`

Функции:

- активация/блокировка пользователей/модов/гайдов/комментариев;
- смена роли пользователя;
- просмотр комментариев внутри мода с отдельной пагинацией.

## 9. Компоненты и переиспользование

Ключевые общие компоненты:

- `Navbar`
- `Pagination`
- `StatusBadge`
- `TagChips`
- `ProtectedRoute`

Доменные:

- `ModCard`, `ModHero`, `ModSidebar`
- `CommentsSection`, `CommentItem`
- `GuidesSection`
- `UsedInCollections` (пока с mock-данными)

## 10. UI/стилизация

Система основана на `src/index.css`:

- CSS variables (цвета, размеры, тени, transition);
- общий glassmorphism-стиль (`.glass-card`);
- общие utility классы (`.container`, `.btn`, `.page`, `.fade-in`);
- responsive breakpoints (в основном 768px/1024px).

Особенность:

- часть экранов и компонентов использует токены из `index.css`;
- часть экранов использует inline styles и жестко заданные hex-цвета.

## 11. Тестирование и текущее состояние

### Что покрыто тестами

- `src/pages/TagsPage.test.jsx` (5 тестов)
- `src/pages/ModPage.test.jsx` (2 теста)
- `src/pages/ModsListPage.test.jsx` (9 тестов)

Всего: 16 тестов.

### Фактический статус на момент аудита

- `npm test` — успешно
- `npm run build` — успешно

Build-метрики:

- JS bundle: ~468.16 KB (до gzip)
- CSS: ~39.43 KB (до gzip)

## 12. Обнаруженные риски и техдолг

1. Дублирование API-методов между `src/api/api.js` и `src/api/mods.js` (например, `getMods`, `activateMod`, `blockMod`).
2. Неиспользуемые/legacy-файлы:
   - `src/components/PostCard.css`
   - `src/pages/PostDetailPage.css`
3. В `src/pages/GuidesListPage.css` используются неописанные CSS переменные:
   - `--primary`
   - `--primary-hover`
   - `--text`
4. Смешение подходов к стилям:
   - CSS variables + inline styles + hardcoded цвета.
5. Ошибки местами выводятся через `alert` и `console.error`, вместо единого UX-паттерна уведомлений.
6. Тестовое покрытие ограничено тремя страницами и не покрывает `AuthContext`/`ProtectedRoute`, админские сценарии и редактор гайдов.
7. Отсутствуют скрипты `lint`/`format` в `package.json`.
8. Ролевой список в админке включает `SUPERUSER`, но ключевая проверка `isAdmin` учитывает только `ADMIN`/`SUPER_ADMIN` (нужна явная бизнес-валидация, что это ожидаемое поведение).

## 13. Что важно знать новому разработчику

1. Источник истины по авторизации — `AuthContext` + JWT в `localStorage`.
2. Главная точка интеграции с бэкендом — `src/api/api.js`, но есть исторический слой `src/api/mods.js` с пересечениями.
3. Данные бэкенда неоднородны по неймингу полей (`snake_case`/`camelCase`) — это нормализуется вручную.
4. Гайды завязаны на Markdown и custom-styling (цитаты/infobox), плюс встроенная справка из `GUIDE_INSTRUCTIONS.md`.
5. Самые критичные функциональные модули для изменений:
   - `ModPage` (центр пользовательской активности),
   - `AdminPage` (модерация),
   - `TagsPage` (пример аккуратной работы с URL state и error mapping).

## 14. Рекомендуемый план стабилизации (короткий)

1. Завершить консолидацию API-слоя: `VITE_API_BASE_URL` уже вынесен, следующий шаг — убрать дубли API-оберток.
2. Удалить/архивировать неиспользуемые CSS и привести стили к единой системе токенов.
3. Добавить единый слой уведомлений (toast/snackbar) вместо `alert`.
4. Расширить тесты минимум на:
   - авторизацию/ProtectedRoute,
   - админские действия,
   - редактор гайдов.
5. Добавить `eslint` + `prettier` + CI-проверки.

---

Если нужно, следующим шагом могу сделать вторую версию этого документа в формате “для онбординга за 30 минут” (кратко + последовательность чтения файлов).
