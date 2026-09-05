# BaroLab frontend project map

Compact navigation index for agents and developers. Verified against the source tree on **2026-09-05**.

Use this file to find the right starting points, then verify behavior in the relevant code and tests. For an exact inventory, run `rg --files`; this map intentionally does not duplicate every JSX, CSS, or test file.

## Repository role

React 19 / Vite 6 single-page application for BaroLab. It provides public content discovery, authenticated content creation, universal and mod-specific guides, encyclopedia reading/editing, collections and load-order tools, admin moderation, Steam operational controls, and a small global quest experience.

Main UI flow:

`route in App.jsx -> page -> domain component/hook/utility -> src/api client -> backend`

The frontend uses plain CSS, React Router, context providers, lazy-loaded route pages, Vitest, and Testing Library.

## Start here

| Need | Primary source |
|---|---|
| Bootstrap/providers | `src/main.jsx` |
| Route table and page loading | `src/App.jsx` |
| Base HTTP/error/pagination behavior | `src/api/api.js` |
| Authentication/session | `src/context/AuthContext.jsx`, `src/components/ProtectedRoute.jsx` |
| Global backend-down handling | `src/context/ServerErrorContext.jsx` |
| Global design tokens/base styles | `src/index.css` |
| Domain API clients | `src/api/` |
| Route-level screens | `src/pages/` |
| Shared/domain UI | `src/components/` |
| Test environment | `src/test/setup.js`, `vite.config.js` |
| Build and dependency scripts | `package.json` |

## Directory map

| Area | Responsibility |
|---|---|
| `src/api/` | Fetch wrappers, backend contracts, response normalization, domain constants |
| `src/components/` | Shared and content-domain UI blocks |
| `src/components/collection/` | Collection picker, ordering, missing dependencies, and problem display |
| `src/components/guides/` | Shared guide Markdown rendering and internal-link picker |
| `src/components/quest/` | Global quest overlays, terminal, inventory, and item inspection |
| `src/context/` | Auth, server availability, and quest state providers |
| `src/hooks/` | Reusable React hooks such as document metadata |
| `src/pages/` | Lazy-loaded route screens, page-local styles, and page tests |
| `src/utils/` | Steam BBCode, guide links, relation/property display, search, and text helpers |
| `public/` | Static icon and crawler/SEO files |
| `docs/` | Focused plans or design notes; not automatically required context |

## Feature routing

| Feature | Read first | Continue with | Closest tests |
|---|---|---|---|
| Bootstrap, routing, navigation, layout | `src/main.jsx`, `src/App.jsx`, `src/components/Navbar.jsx`, `Footer.jsx` | matching CSS, `src/hooks/useDocumentMeta.js` | component tests where present; route page tests |
| Login, signup, roles, protected routes | `src/context/AuthContext.jsx`, `src/components/ProtectedRoute.jsx`, `src/pages/LoginPage.jsx`, `SignUpPage.jsx` | auth functions in `src/api/api.js`; backend auth/security sources | Add/inspect auth and route tests near the changed code |
| Global server errors and error pages | `src/context/ServerErrorContext.jsx`, `src/pages/ServerErrorPage.jsx` | `ForbiddenPage.jsx`, `NotFoundPage.jsx`, base `request()` in `src/api/api.js` | relevant component/page tests |
| Home and public presentation | `src/pages/HomePage.jsx` | `HomeModCard.jsx`, `HomeSubCard.jsx`, `HeroCarousel.jsx`, `AboutPage.jsx`, metadata/static public files | page/component tests where present |
| Mods, comments, tags, Steam transition | `src/pages/ModsListPage.jsx`, `ModPage.jsx`, `TagsPage.jsx` | `src/api/mods.js`, `tags.js`, `tagErrorMapper.js`, shared comment/mod/tag components | `ModsListPage.test.jsx`, `ModPage.test.jsx`, `TagsPage.test.jsx` and component tests |
| Submarines | `src/pages/SubmarinesListPage.jsx`, `SubmarinePage.jsx` | `src/api/submarines.js`, `SubmarineCard.jsx`, `SubmarineGallery.jsx`, Steam/author/relation components | submarine page tests plus affected component tests |
| Universal and mod-specific guides | `src/pages/GuidesListPage.jsx`, `GuidePage.jsx`, `GuideCreatePage.jsx`, `GuideEditorPage.jsx`, legacy `ModGuidePage.jsx`/`ModGuideEditor.jsx` | `src/api/modGuides.js`, `internalReferences.js`, `components/guides/`, `utils/internalGuideLinks.js`; read `GUIDE_INSTRUCTIONS.md` | guide page/editor and `components/guides/` tests |
| Encyclopedia browsing and rendering | `src/pages/EncyclopediaListPage.jsx`, `EncyclopediaDetailPage.jsx` | `src/api/encyclopedia.js`, encyclopedia/relation/property components, `utils/relations.js`, `importedProperties.js` | encyclopedia page tests and related component/utility tests |
| Encyclopedia admin editor | `src/pages/EncyclopediaEditorPage.jsx` | admin functions/constants in `src/api/encyclopedia.js`, shared guide Markdown/internal-link components | `EncyclopediaEditorPage.test.jsx` and guide component tests |
| Collections | `src/pages/CollectionsPage.jsx`, `CollectionBuilderPage.jsx`, `CollectionPage.jsx` | `src/api/modCollections.js`, `src/components/collection/`, `docs/COLLECTIONS_UI_PLAN.md` only when historical plan context is useful | collection page/API/component tests |
| Load-order conversion | `src/pages/LoadOrderPage.jsx` | `src/api/loadOrder.js`, `src/pages/loadOrderSample.js` | add/inspect tests around conversion behavior |
| Admin moderation and Steam operations | `src/pages/AdminPage.jsx` | `SteamSyncTab.jsx`, `SteamAvailabilityTab.jsx`, `src/api/steamSync.js`, `steamAvailability.js`, moderation functions in `api.js`/domain clients | admin Steam status/availability tests and affected domain tests |
| Internal content previews | `src/api/internalReferences.js` | `components/guides/InternalLinkPicker.jsx`, `EncyclopediaEntityLink.jsx`, `ModEncyclopediaLink.jsx`, related API clients | internal-link and encyclopedia-link tests |
| Steam content rendering and availability | `SteamDescription.jsx`, `SteamAvailabilityBadge.jsx`, `WorkshopAuthorCard.jsx` | `utils/steamBbcode.js`, relevant mod/submarine APIs | same-named component and utility tests |
| Quest experience | `src/context/QuestContext.jsx`, quest components under `src/components/quest/` | `questItems.js` owns item lore/clues; `QuestItemArtwork.jsx` renders faces from `public/quest/`, with a low-resolution canvas pass for the card/radio atlases; `ItemInspectModal.jsx` owns button-only inspection; guarded `/promise` and `PromisePage.jsx` own the ending, with opt-in ambience in `usePromiseAudio.js`; local `DESIGN.md` records visual rules and `docs/SIGNALIS_DESIGN.md` records reference provenance | `ItemInspectModal.test.jsx`, `PromisePage.test.jsx`, `Pagination.test.jsx` |

## Route groups

`src/App.jsx` is authoritative. Current groups are:

- public home/auth/info/errors: `/`, `/login`, `/sign-up`, `/about`, `/403`, `/500`, fallback `*`;
- content: `/mods`, `/mod/:externalId`, `/submarines`, `/submarines/:externalId`, `/tags`;
- guides: `/guides`, `/guides/:guideId`, authenticated create/edit routes, plus legacy mod-targeted guide routes;
- tools: `/load-order`, authenticated collection list/create/edit, public collection detail by slug;
- encyclopedia: public list/detail and admin-only create/edit routes;
- administration: `/admin`, guarded with `adminOnly`;
- quest: `/promise`, guarded by quest progress rather than authentication; its immersive ending omits the global navigation and quest dialogs.

Whenever a route or guard changes, verify navigation links, direct-load behavior, fallback behavior, and access rules.

## API and data-contract rules

- `src/api/api.js` owns `API_BASE`, the shared `request()` wrapper, `ApiRequestError`, pagination normalization, and server-failure signaling.
- Domain clients own their normalization and endpoint calls. Do not bypass them from pages unless an existing pattern clearly requires it.
- Backend JSON commonly uses `snake_case`; several clients normalize mixed `snake_case`/`camelCase`. Preserve this compatibility when changing contracts.
- `src/api/encyclopedia.js`, `submarines.js`, and `modCollections.js` contain substantial domain normalization in addition to network calls; inspect their helpers before changing consumers.
- Auth token/session behavior lives in `AuthContext.jsx`; route authorization is UI convenience only. Backend security remains authoritative.

## Cross-repository map

| Frontend area | Backend starting point in `../BaroLab/` |
|---|---|
| `src/api/api.js`, `AuthContext.jsx` | `UserController.java`, `GoogleAuthController.java`, `SecurityConfig.java`, `TokenAuthFilter.java` |
| `src/api/mods.js`, comments/tags UI | `ModPostController.java`, `CommentController.java`, `TagController.java` and matching services |
| `src/api/submarines.js` | `SubmarineController.java`, `SubmarineServiceImpl.java`, submarine search/Steam services |
| `src/api/modGuides.js`, guide UI | `ModGuideController.java`, `ModGuideServiceImpl.java`, guide validator/renderer |
| `src/api/encyclopedia.js` | `EncyclopediaController.java`, `AdminEncyclopediaController.java`, encyclopedia/search/relation services |
| `src/api/modCollections.js` | collection controllers and `service/collection/` |
| `src/api/loadOrder.js` | `loadorder/` bounded context |
| `src/api/steamSync.js`, `steamAvailability.js` | corresponding admin controllers and `service/steam/` |

For an API change, trace backend controller/DTO/security/service and frontend client/normalizer/consumer together. Update both project maps if the routing information or cross-repository contract changes.

## Styling and UI behavior

- Global tokens and reusable primitives start in `src/index.css`; feature styles usually sit beside their JSX.
- The established identity uses dark underwater tones, glass-like surfaces, shared button/card/status patterns, and responsive page-level CSS.
- Preserve keyboard access, focus visibility, reduced-motion behavior where relevant, loading/empty/error states, responsive layouts, and semantic labels.
- UI/UX work must follow the workspace `impeccable` skill instruction; broad redesign is out of scope unless explicitly requested.

## Configuration and verification

- Environment template: `.env.example`; deployment notes: `DEPLOY_ENV.md`; never commit `.env` or credentials.
- Vite and test configuration: `vite.config.js`; scripts: `package.json`.
- Use `npm test` for behavior changes and `npm run build` for production/build-affecting changes. Run both for broad frontend changes.
- Do not edit `node_modules/` or `dist/` unless generated output is explicitly requested.

## Map maintenance boundary

Update this map only when its navigation information changes: significant routes, guards, pages, contexts, component areas, API modules/contracts, backend mappings, configuration entry points, or main flows. Keep detailed prop/field catalogs, historical release notes, exhaustive file lists, test counts, bundle hashes, and build sizes out of this file; retrieve those from current source when a task needs them.
