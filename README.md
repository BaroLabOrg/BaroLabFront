# BaroLabFront

> **Work in progress:** this project is in active development and is **not** a final release.  
> Features, API contracts, UI behavior, and data models may change.

## About the Project

### Why This Project Exists

This project is being created for Barotrauma players and fans so the community can interact with each other more conveniently.

### Who Develops This Project

At the moment, the project is being developed by two people.

### Why BaroLab?

BaroLab focuses on convenience features that are not available in Steam in this form:

1. Convenient and advanced search across mods and other community content.
2. For created or ready-made mod packs, users can download a prepared config with correct mod load order.
3. A more convenient workflow for writing guides for mods and other topics.

### What Users Can Do

- Find mods, submarines, guides, and tags in one place instead of jumping between pages.
- Open detailed pages with key info, media, and related community content.
- Publish and manage content (mods, guides, comments) when signed in.

### Current Project Status

- Active development phase
- Not a final production-stable version yet

### In Development

1. A convenient wiki for items across all kinds of modifications.

## For Developers

### Repository Scope

This repository contains the **frontend application** only.

The backend is private (restricted access, private GitHub repository) and is not included here.

### Security Note

For security reasons, this README intentionally avoids:

- exact request paths,
- internal backend contract details,
- step-by-step internal operational processes.

### Frontend + Backend (High-Level)

The frontend is a React SPA that communicates with a private backend through a configured API base URL.

Authentication, permissions, and restricted access are enforced by frontend and backend together.

### Backend Integration Domains (High-Level)

- Auth
- User management
- Mods and comments
- Guides
- Submarines
- Tags
- Admin synchronization tooling

### Tech Stack

- React 19
- Vite 6
- React Router 7
- `@react-oauth/google`
- `react-markdown` + `remark-gfm`
- Vitest + Testing Library + jsdom

### Navigation Areas

- Authentication pages
- Content catalogs
- Content detail pages
- Restricted editing and admin pages

### Auth and Roles

- The app uses role-based access control for restricted UI sections.
- Administrative capabilities are available only to authorized accounts.

### Local Development

#### Prerequisites

- Node.js 18+ (LTS recommended)
- npm

#### Setup

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

#### Run

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` (configured in `vite.config.js`).

### NPM Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run preview` - preview built app
- `npm run test` - run Vitest tests

### Project Structure

```text
src/
  api/          # API clients and response normalization
  components/   # Reusable UI blocks
  context/      # Auth context and session state
  pages/        # Route-level pages
  test/         # Test setup
```
