# Frontend Env For Cloud

## Что важно

Во фронтенде используются переменные `VITE_*`.
Они подставляются на этапе `npm run build` и попадают в итоговый JS-бандл.
Поэтому секреты во frontend env хранить нельзя.

## Обязательные переменные

`VITE_API_BASE_URL`
- Базовый URL backend API.
- Пример: `https://api.barolab.com`

`VITE_GOOGLE_CLIENT_ID`
- Google OAuth Client ID для кнопки входа через Google.
- Пример: `1234567890-xxxx.apps.googleusercontent.com`

## Где задавать в облаке

Задавайте переменные в настройках окружения именно для сборки frontend-приложения:
- Vercel: Project Settings -> Environment Variables
- Netlify: Site settings -> Environment variables
- Railway/Render (static frontend): Variables/Environment

После изменения переменных нужен новый deploy (новая сборка).

## Локальный запуск

1. Скопировать `.env.example` в `.env`
2. Подставить реальные значения
3. Запустить `npm run dev`

## Почему нужен `.env.example`

`.env.example` коммитится в git как безопасный шаблон.
`.env` не коммитится и хранит реальные значения только локально/в облаке.
