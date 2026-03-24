# BaroLabFront

> **Work in progress:** this project is in active development and is **not** a final release.  
> Features, API contracts, UI behavior, and data models may change.

BaroLabFront is a React SPA for the Barotrauma community.  
It provides catalogs for mods and submarines, guide authoring in Markdown, comments, tags, and an admin panel.

## What Is In This Repository

This repository contains the **frontend application** only.
The backend is private (restricted access, private GitHub repository) and is not included here.

The backend is consumed via REST API (`VITE_API_BASE_URL`) and is expected to provide:
- authentication (regular + Google token login),
- user/mod/guide/comment moderation flows,
- tags management,
- submarine search and creation,
- Steam Workshop sync control/status endpoints for admins.

For security reasons, this README intentionally avoids internal operational details.

## Frontend + Backend Overview

The frontend is a SPA that communicates with a private backend over configured API base URL.
Authentication and permission checks are enforced through the app and backend together.
Content workflows (catalogs, guides, tags, moderation) are implemented through domain-based API clients.

## Key Features

- Mods catalog: search, tag filters, pagination, create mod (for authenticated users)
- Mod page: details, image gallery, comments, related guides, tags
- Submarines catalog: advanced filters, sorting, pagination, create submarine
- Submarine page: technical metrics, weapons, tag management (admin/author)
- Guides: list, view, create, edit with Markdown + live preview
- Tags: list, sort, paginate, create
- Auth: login, sign-up, Google OAuth login
- Admin panel for authorized moderation and operational tasks

## Tech Stack

- React 19
- Vite 6
- React Router 7
- `@react-oauth/google`
- `react-markdown` + `remark-gfm`
- Vitest + Testing Library + jsdom

## Local Development

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm

### Setup

```bash
npm install
cp .env.example .env
```

PowerShell alternative:

```powershell
Copy-Item .env.example .env
```

Fill `.env` with real values:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=replace-with-your-google-client-id
```

### Run

```bash
npm run dev
```

Frontend will run on `http://localhost:5173` (configured in `vite.config.js`).

## NPM Scripts

- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run preview` — preview built app
- `npm run test` — run Vitest tests

## Navigation Areas

- Authentication pages
- Content catalogs (mods, submarines, guides, tags)
- Content detail pages
- Restricted areas for content editing and administration

## Backend Integration (High-Level)

The frontend communicates with a private backend API grouped by domain:

- Auth
- User management
- Mods and comments
- Guides
- Submarines
- Tags
- Admin synchronization tooling

Exact request paths, internal backend contracts, and detailed process flows are intentionally omitted from this public frontend README.

## Auth and Roles

- The app uses role-based access control for restricted UI sections.
- Administrative capabilities are available only to authorized accounts.

## Project Structure

```text
src/
  api/          # API clients and response normalization
  components/   # Reusable UI blocks
  context/      # Auth context and session state
  pages/        # Route-level pages
  test/         # Test setup
```

## Notes About Current State

- This is an actively evolving codebase, not a stable final product.
- UI texts are currently mostly in Russian, while code/docs are mixed-language.
- Some parts are still being standardized (styling consistency, API layer consolidation, broader test coverage).
