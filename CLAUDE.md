# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Orientation

This repo is the **frontend only** (React 19 / Vite 6 SPA). The backend is a separate private repo expected at `../BaroLab/` (Java/Spring); consult its controllers/DTOs/security/services when touching API contracts.

Read these before working, in this order:

- `PROJECT_MAP.md` — the compact feature→file routing index. Start here for any task; follow the one relevant row instead of scanning the tree.
- `AGENTS.md` — working rules (notably: keep `PROJECT_MAP.md` accurate in the same commit when routes/guards/pages/contexts/API modules/contracts/flows change).
- `GUIDE_INSTRUCTIONS.md` — only for the guide/encyclopedia Markdown editor and its custom rendering (styled quotes, `INFOBOX:` tables, BaroLab-only internal links).
- `DEPLOY_ENV.md` — deployment env notes.

Treat current source, routes, and tests as authoritative when they disagree with docs.

## Commands

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # production build to dist/
npm run preview     # serve the built dist/
npm test           # vitest run (single pass, CI-style)
```

Run one test file or name (no npm script for this):

```bash
npx vitest run src/pages/ModPage.test.jsx
npx vitest run -t "renders the mod title"
npx vitest            # watch mode
```

There is **no linter or formatter** configured — match surrounding style (4-space indent, single quotes, semicolons).

CI (`.github/workflows/cd.yaml`) only builds and pushes a Docker image on `main`; it does not run tests. Verify changes locally with `npm test` and/or `npm run build` in proportion to the change.

## Git conventions

- **Never commit or push directly to `main`/`master`.** Always work on a dedicated branch named `<type>/<short-name>` (e.g. `feat/refresh-token`). Create it with `git switch -c <branch>` before starting; if you find yourself on `main`, branch first, then commit. Push with `git push -u origin <branch>` and open a PR.
- No `--force`. Use `git push --force-with-lease` only on explicit request.
- Commit messages follow **Conventional Commits**: `<type>(<scope>): <description>`.
  - Types: `feat` | `fix` | `docs` | `refactor` | `perf` | `test` | `build` | `ci` | `chore`.
  - Subject line ≤72 chars, imperative mood, lowercase, no trailing period.
  - Body (when needed) explains *why*, not *what*. Breaking changes: `!` after type/scope plus a `BREAKING CHANGE: ...` footer.

## Architecture

Request flow: `route in src/App.jsx` → lazy-loaded `src/pages/*` → domain component/hook/util → `src/api/*` client → backend.

- **Providers** (`src/main.jsx`): `GoogleOAuthProvider` → `BrowserRouter` → `ServerErrorProvider` → `AuthProvider` → `App`. `QuestProvider` wraps the routes inside `App`.
- **API layer** (`src/api/`): `api.js` owns `API_BASE`, the shared `request()` wrapper (injects `Bearer` token, JSON handling), `ApiRequestError`, `normalizePagedResponse`, and pagination error mapping. Each domain client (`mods.js`, `submarines.js`, `encyclopedia.js`, `modCollections.js`, `modGuides.js`, `loadOrder.js`, `tags.js`, `steamSync.js`, `steamAvailability.js`, `internalReferences.js`) owns its own endpoints and normalization. Pages should go through these clients, not call `request()` directly, unless following an existing pattern.
- **snake_case/camelCase**: backend JSON is mostly `snake_case`; several clients accept both forms. Preserve this dual-key tolerance when editing contracts or normalizers.
- **Auth** (`src/context/AuthContext.jsx`): JWT stored in `localStorage` under `barolab_token`; user identity/role/expiry are decoded client-side from the JWT payload. Roles: `ADMIN` and `SUPER_ADMIN` (`isAdmin`, `isSuperAdmin`). `src/components/ProtectedRoute.jsx` (`adminOnly` prop) gates routes — this is UI convenience only; backend security is authoritative.
- **Global backend-down handling** (`src/context/ServerErrorContext.jsx`): `request()` dispatches a `server:unavailable` window event on network failure; `App` then renders `ServerErrorPage` instead of the router.
- **Quest** (`src/context/QuestContext.jsx`, `src/components/quest/`): a small hidden ARG. Progress is **browser-local** (not server state). `/promise` is guarded by quest `stage >= 3`, not by auth, and renders without the global Navbar/quest dialogs. See `src/components/quest/DESIGN.md` and `docs/SIGNALIS_DESIGN.md`.
- **Styling**: plain CSS, one stylesheet per component/page beside its JSX. `src/index.css` `:root` is the design-system source of truth — the "Tactical Rust" palette (rust/amber/green on near-black), Orbitron/Rajdhani/JetBrains Mono/Inter type, and shared primitives: `.chamfer-lg|card|btn|badge` (corners are `clip-path` chamfers — **never `border-radius`** except 50% circles), `.btn*`, `.chip*`, `.log-tag*`, `.bracket*`, `.hazard-strip`. `/styleguide` (`src/pages/StyleguidePage.jsx`) renders every token/component live. A "legacy aliases" block in `index.css` re-points old token names (`--accent`, `--bg-card`, `--radius-md`, …) at the new palette so unmigrated pages stay on-brand; migrate a stylesheet by swapping aliases for real tokens. Migrated: global primitives, `Navbar`, `Footer`, `HomePage` + its cards/hero. Focus rings on chamfered controls are **inset** (`box-shadow: inset 0 0 0 2px var(--green)` / `outline-offset: -2px`) because `clip-path` clips a normal outline. `vite.config.js` defines `manualChunks` splitting (react/router → `vendor`, markdown ecosystem → `vendor-markdown`, oauth → `vendor-auth`) — keep new heavy deps in mind.

## Configuration gotchas

- `VITE_*` vars are baked into the bundle at build time — never put secrets there. Required: `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID` (see `.env.example`).
- `src/api/api.js` has a **hardcoded `API_BASE` fallback** to a live backend when `VITE_API_BASE_URL` is unset.
- `src/main.jsx` uses a **hardcoded Google client ID**, not `VITE_GOOGLE_CLIENT_ID`, despite what the docs say.
- `.env` is gitignored; only `.env.example` is committed.
