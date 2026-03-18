# BaroLabFront — Полный контекст проекта

Дата аудита: 2026-03-18

## 1. Назначение проекта

`BaroLabFront` — SPA-фронтенд для сообщества Barotrauma (Steam Workshop). Приложение покрывает:

- каталог модов и карточки модов;
- каталог подлодок и карточки подлодок;
- создание/просмотр/редактирование руководств (Markdown);
- комментарии к модам;
- каталог и создание тегов;
- административную модерацию (пользователи, моды, руководства, комментарии);
- административный контроль синхронизации Steam Workshop (start/stop/reset/status).

Основной сценарий: пользователь авторизуется (обычно или через Google OAuth), работает с контентом; администраторы модерируют сущности.

## 2. Технологический стек

- `React 19`
- `Vite 6`
- `react-router-dom 7` (используется API `Routes`/`Route`/`Navigate`)
- `@react-oauth/google` для Google Sign-In
- `react-markdown + remark-gfm` для гайдов
- `Vitest + Testing Library + jsdom` для UI-тестов
- CSS (без Tailwind/SCSS), базовые токены в `src/index.css`

Скрипты:

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm test`

## 3. Запуск и окружение

### Локально

```bash
npm install
npm run dev
```

Windows-альтернатива: `start_frontend.bat`.

### Переменные окружения

- `VITE_API_BASE_URL` — обязательная базовая точка API.
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth Client ID.

Важно:

- `src/api/api.js` выбрасывает ошибку конфигурации при отсутствии `VITE_API_BASE_URL`.
- в репозитории есть `DEPLOY_ENV.md` с инструкцией по cloud-переменным.

## 4. Структура репозитория

```text
src/
  api/
    api.js             # базовый request + auth/users/comments/mods(admin)
    mods.js            # mod-domain API (search/create/subscribe/tags)
    modGuides.js       # guides API
    steamSync.js       # admin steam-sync API
    submarines.js      # submarine-domain API + нормализация
    tags.js            # tags API
    tagErrorMapper.js
  components/
    ...                # общие и доменные UI-компоненты
  context/
    AuthContext.jsx
  pages/
    ...                # auth/mods/submarines/guides/tags/admin pages
  test/
    setup.js
  App.jsx
  main.jsx
  index.css
```

Дополнительно:

- `GUIDE_INSTRUCTIONS.md` — встроенная справка редактора гайдов;
- `DEPLOY_ENV.md` — окружение для деплоя;
- `dist/` — артефакты сборки.

## 5. Архитектура приложения

### 5.1 Bootstrap

`src/main.jsx` оборачивает `App` в:

1. `GoogleOAuthProvider`
2. `BrowserRouter`
3. `AuthProvider`

### 5.2 Маршрутизация (`src/App.jsx`)

Публичные:

- `/login`
- `/sign-up`
- `/mods`
- `/submarines`
- `/submarines/:externalId`
- `/guides`
- `/tags`
- `/mod/:externalId`
- `/mod/:id/guides/:guideId`

Защищенные:

- `/admin` (только админ)
- `/mod/:id/guides/new` (авторизованный)
- `/mod/:id/guides/:guideId/edit` (авторизованный)

Редиректы:

- `/` -> `/mods`
- `*` -> `/mods` (если авторизован) иначе `/login`

### 5.3 Авторизация и сессия

`src/context/AuthContext.jsx`:

- хранит JWT в `localStorage` (`barolab_token`);
- декодирует JWT на клиенте и проверяет `exp`;
- формирует `user` (`id`, `role`, `username`);
- предоставляет `login`, `signUp`, `loginWithGoogle`, `logout`;
- вычисляет:
  - `isAuthenticated`
  - `isAdmin` (`ADMIN` или `SUPER_ADMIN`)
  - `isSuperAdmin` (`SUPER_ADMIN`)

Проверка роутов: `src/components/ProtectedRoute.jsx`.

## 6. Роли и доступ

Роли, используемые в UI:

- `USER`
- `SUPERUSER`
- `ADMIN`
- `SUPER_ADMIN`

Ключевая логика:

- вход в `/admin` разрешен только `isAdmin`;
- вкладка управления пользователями в админке — только для `SUPER_ADMIN`;
- вкладка `Steam Sync` в админке доступна ролям `ADMIN` и `SUPER_ADMIN`;
- теги модов: добавление для авторизованных, удаление для админа;
- теги подлодок: добавление/удаление для админа или автора подлодки;
- создание модов, подлодок, комментариев, гайдов — для авторизованных.

## 7. API-слой и контракты

### 7.1 Базовые принципы

`src/api/api.js`:

- базовый `request()` над `fetch`;
- base URL из `VITE_API_BASE_URL`;
- Bearer token из `localStorage`;
- query-params;
- нормализация пагинации (`normalizePagedResponse`);
- унифицированная ошибка `ApiRequestError`;
- маппер ошибок пагинации (`mapPaginationError`).

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
- `POST /mod/:externalId/transition`
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

Submarines:

- `GET /api/submarines`
- `GET /search/submarines`
- `GET /api/submarines/:externalId`
- `POST /api/submarines`
- `POST /api/submarines/:externalId/tags/:tagId`
- `DELETE /api/submarines/:externalId/tags/:tagId`

Tags:

- `GET /api/tags`
- `GET /api/tags/:tagId`
- `POST /api/tags`

Steam Sync (admin):

- `POST /api/admin/steam-sync/start`
- `POST /api/admin/steam-sync/stop`
- `POST /api/admin/steam-sync/reset`
- `GET /api/admin/steam-sync/status`

### 7.3 Нормализация данных

- В проекте активно смешаны `snake_case` и `camelCase`.
- `src/api/submarines.js` содержит расширенную нормализацию (включая теги, статусы, диапазоны экипажа, оружие).
- `src/api/mods.js` и UI-слой также вручную учитывают оба формата полей.

## 8. Страницы и сценарии

`LoginPage` / `SignUpPage`:

- формы + Google OAuth;
- обработка ошибки привязки аккаунта к Google в логине (403);
- редирект на `/mods`.

`ModsListPage`:

- поиск `q`, фильтр по тегам, синхронизация с URL;
- пагинация;
- форма создания мода (для авторизованных).

`ModPage`:

- загрузка по `externalId`;
- подписка/переход в Steam (`transition`);
- галерея `additional_images`;
- блоки `UsedInCollections`, `GuidesSection`, `CommentsSection`, `ModSidebar`.

`SubmarinesListPage`:

- отдельный каталог подлодок с пагинацией;
- базовый поиск + расширенный фильтр (класс, tier, цена, экипаж, скорости, реактор, размеры, слоты, fabrication type, теги);
- полный URL-state фильтров/сортировки/страницы;
- форма создания подлодки для авторизованных;
- валидация формы (обязательные поля, числовые ограничения, проверка `crewMin <= crewMax`, контроль количества выбранного оружия по слотам);
- после успешного создания — переход в карточку подлодки.

`SubmarinePage`:

- детальная карточка подлодки;
- лениво загружаемая галерея изображений (`SubmarineGallery`);
- метрики, вооружение, теги, метаданные, статус.
- управление тегами (для админа/автора подлодки).

`GuidesListPage`:

- общий каталог гайдов с пагинацией;
- создание через модал выбора мода (для авторизованных).

`ModGuidePage`:

- Markdown + GFM;
- кастомные рендеры `blockquote` и `table` (infobox-режим при `INFOBOX:`).

`ModGuideEditor`:

- create/edit режим;
- split pane: markdown source + live preview;
- встроенная справка из `GUIDE_INSTRUCTIONS.md`.

`TagsPage`:

- каталог тегов с пагинацией/сортировкой;
- URL-state (`sortBy`, `direction`, `page`, `size`);
- создание тега с `mapCreateTagError`.

`AdminPage`:

- вкладки `Users` (только `SUPER_ADMIN`), `Mods`, `Guides`, `Steam Sync`;
- активация/блокировка пользователей, модов, комментариев, гайдов;
- смена роли пользователя;
- отдельная пагинация комментариев внутри карточки мода;
- управление steam-синхронизацией: start/resume, graceful stop, reset progress + polling статуса (`IDLE`/`RUNNING`/`STOPPING`) и вывод последних parser errors.

## 9. Компоненты

Общие:

- `Navbar`
- `Pagination`
- `TagChips`
- `StatusBadge`
- `ProtectedRoute`

Доменные (моды):

- `ModCard`, `ModHero`, `ModSidebar`
- `CommentsSection`, `CommentItem`
- `GuidesSection`
- `UsedInCollections`

Доменные (подлодки):

- `SubmarineCard`
- `SubmarineGallery`

## 10. UI и стили

- Глобальные токены и базовые utility-классы находятся в `src/index.css`.
- Используется glassmorphism-стиль (`.glass-card`), общая кнопочная система (`.btn`) и базовые анимации.
- В проекте всё ещё смешаны подходы: CSS variables + inline styles + hardcoded цвета.
- В `src/pages/GuidesListPage.css` остаются переменные `--primary`, `--primary-hover`, `--text`, которые не объявлены в `src/index.css`.

## 11. Тестирование и текущий статус

Тесты (Vitest):

- `src/pages/ModsListPage.test.jsx` — 9
- `src/pages/ModPage.test.jsx` — 2
- `src/pages/TagsPage.test.jsx` — 5
- `src/pages/SubmarinesListPage.test.jsx` — 11
- `src/pages/SubmarinePage.test.jsx` — 3

Итого: **30 тестов**.

Фактический статус на 2026-03-18:

- `npm test` — успешно (30/30).
- `npm run build` — успешно.

Build-метрики:

- `dist/assets/index-D4kPRB2_.js`: **516.85 kB** (gzip **153.84 kB**)
- `dist/assets/index-DHScuyME.css`: **50.14 kB** (gzip **9.22 kB**)
- `dist/assets/SubmarineGallery-UI3y0J4g.js`: **1.10 kB** (gzip **0.65 kB**)
- `dist/assets/SubmarineGallery-ABMJRPnb.css`: **0.91 kB** (gzip **0.42 kB**)
- Vite warning: чанк JS > 500 kB.

## 12. Риски и техдолг

1. Дублирование методов модов между `src/api/api.js` и `src/api/mods.js`.
2. Legacy/неиспользуемые CSS-файлы: `src/components/PostCard.css`, `src/pages/PostDetailPage.css`.
3. Необъявленные CSS-переменные в `src/pages/GuidesListPage.css` (`--primary`, `--primary-hover`, `--text`).
4. Смешение стилей (tokens + inline + hardcoded) усложняет поддержку.
5. Ошибки местами обрабатываются через `alert`/`console.error` вместо единого уведомления (например, в `ModPage`, `ModSidebar`, `ModGuideEditor`).
6. Тестами не покрыты `AuthContext`, `ProtectedRoute`, `AdminPage`, `GuidesSection`/`ModGuideEditor`.
7. Нет `lint`/`format` скриптов в `package.json`.
8. Роль `SUPERUSER` есть в UI, но не учитывается в `isAdmin` (возможный бизнес-рассинхрон).
9. Крупный основной JS-chunk (516.85 kB до gzip) превышает warning-порог; есть code-split для `SubmarineGallery`, но вклад в общий вес пока минимальный.

## 13. Что важно новому разработчику

1. Источник истины по auth — `AuthContext` + JWT в `localStorage`.
2. Есть историческое расслоение API: базовый `api.js` и доменные обертки (`mods.js`, `submarines.js`, `modGuides.js`, `tags.js`, `steamSync.js`).
3. Нормализация `snake_case`/`camelCase` критична для стабильности UI.
4. Подлодки — отдельный крупный домен (собственный API, карточки, расширенный поиск, отдельные тесты).
5. Самые чувствительные к изменениям модули: `ModsListPage`, `SubmarinesListPage`, `AdminPage`, `SteamSyncTab`, `AuthContext`.

## 14. Рекомендуемый план стабилизации

1. Консолидировать API-слой и убрать дубли (`api.js` vs `mods.js`).
2. Привести стили к единой системе токенов и убрать невалидные CSS-переменные.
3. Ввести единый UX-слой уведомлений (toast/snackbar), убрать `alert`.
4. Добавить линтинг/форматирование (`eslint`, `prettier`) и CI-проверки.
5. Расширить тесты на auth/protected routes/admin/editor.
6. Начать разбивку бандла (lazy routes/manual chunks) для снижения веса initial JS.

## 15. Изменения относительно аудита 2026-03-16

1. Добавлен полноценный домен подлодок:
   - API (`src/api/submarines.js`);
   - страницы (`SubmarinesListPage`, `SubmarinePage`);
   - UI-компонент карточки (`SubmarineCard`);
   - маршруты `/submarines` и `/submarines/:externalId`.
2. Расширено автотестирование:
   - добавлены тесты на подлодки;
   - общее покрытие выросло с 16 до 30 тестов.
3. Обновился фактический размер фронтенд-бандла:
   - основной JS-чанк вырос до ~516.85 kB (до gzip), warning по chunk size сохраняется.
   - добавлен отдельный lazy chunk для `SubmarineGallery` (~1.10 kB).
4. Добавлен отдельный admin-домен для Steam Sync:
   - API (`src/api/steamSync.js`);
   - UI-вкладка `Steam Sync` в `AdminPage`;
   - статусный polling и операции `start/stop/reset`.
