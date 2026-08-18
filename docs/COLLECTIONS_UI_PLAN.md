# Collection builder — implementation plan

The backend is finished and deployed. This file is the plan for the front end,
written against the repo as it stands so the next session does not have to
re-derive any of it.

## What the backend gives us

Base URL comes from `API_BASE` in `src/api/api.js`.

| Endpoint | Auth | Returns |
|---|---|---|
| `POST /api/mod-collections/analyse` | none | analysis of an unsaved list |
| `POST /api/mod-collections` | user | created collection |
| `GET /api/mod-collections/mine` | user | the caller's collections |
| `PUT /api/mod-collections/{id}` | owner | updated collection |
| `DELETE /api/mod-collections/{id}` | owner | 204 |
| `POST /api/mod-collections/{id}/resolve` | owner | analysis, and stores the order |
| `GET /api/mod-collections/{slug}` | none | collection with items |
| `GET /api/mod-collections/{slug}/analysis` | none | analysis of a saved one |
| `GET /api/mod-collections/{slug}/export` | none | XML, `Content-Disposition: attachment` |

Request body for create/update and for `analyse`:

```json
{ "title": "...", "description": "...", "game_version": "1.13.4.0", "workshop_ids": [3190189044] }
```
```json
{ "workshop_ids": [3190189044, 3247838390] }
```

Analysis response:

```json
{
  "order":   [{ "package_id", "external_id", "name", "position", "reason" }],
  "missing": [{ "package_id", "external_id", "name", "needed_by", "hard", "alternatives": [] }],
  "problems":[{ "type", "severity", "summary", "packages": [] }],
  "unknown_workshop_ids": [123],
  "content_packages_xml": "<contentpackages>…"
}
```

Collection response items carry `{ workshop_id, name, position, added_reason, known }`.

`severity` is `BLOCKING | DEGRADED | NOTICE`. `type` is one of
`CANNOT_COEXIST`, `PICK_ONE`, `REDUNDANT`, `OVERLAPPING_OVERRIDES`,
`ORDER_CYCLE`, `OUTDATED`, `NEEDS_LUA_RUNTIME`.

## Rules the UI must not get wrong

- **`known: false`** means the graph has no data for that mod yet. Say so on the
  row; never let it read as "checked and fine". In production this is still most
  mods until the whole workshop is inventoried.
- **The order is top-wins.** The first entry loads above the rest and wins every
  override fight it takes part in. A patch sits *above* what it patches. Do not
  invert the list.
- **`NEEDS_LUA_RUNTIME` is a notice, not a dependency.** LuaCs installs through a
  Steam launch option; it must never be offered as a mod to add.
- **Mods come only from the site's own browser.** The API rejects a workshop id
  with no mod on the site, with a 400 whose message names the id.
- **`alternatives` on a missing mod means "any one of these"**, not "all of them".
- Unknown ids from `analyse` come back in `unknown_workshop_ids` — surface them,
  do not drop them silently.

## Files to add

```
src/api/modCollections.js        wrapper, following src/api/encyclopedia.js (uses request())
src/pages/CollectionsPage.jsx    "my collections" list          + .css
src/pages/CollectionBuilderPage.jsx  create/edit + live analysis + .css
src/pages/CollectionPage.jsx     public view by slug            + .css
src/components/collection/ModPicker.jsx        search over /mods, add to list
src/components/collection/OrderedModList.jsx   the resolved order with reasons
src/components/collection/CollectionProblems.jsx  problems grouped by severity
src/components/collection/MissingMods.jsx      missing, with one-click add
```

Routes in `src/App.jsx`, lazy like every other page:

```
/collections            CollectionsPage        <ProtectedRoute>
/collections/new        CollectionBuilderPage  <ProtectedRoute>
/collections/:slug      CollectionPage         public
/collections/:slug/edit CollectionBuilderPage  <ProtectedRoute>
```

`/load-order` stays where it is. It is the older manual tool; leave it alone
until the new page has been used for a while.

## Order of work

1. `src/api/modCollections.js` plus its unit test. Mirror the shape of
   `src/api/encyclopedia.js`: import `request` from `./api`, let it handle auth
   and error mapping. The export endpoint returns XML, so it needs a raw fetch
   like `convertLoadOrder` in `src/api/loadOrder.js` does.
2. `CollectionBuilderPage` against `POST /analyse` only — no saving yet. That
   alone is a usable tool and proves the response rendering.
3. Saving: create, edit, `mine`, delete.
4. Public page by slug plus the XML download button.
5. Problems and missing-mod panels, then polish.

## Testing

Vitest with Testing Library, `.test.jsx` beside the file, mock fetch — see
`src/pages/EncyclopediaEditorPage.test.jsx` for the established pattern. Worth
covering: a mod with `known: false` renders its warning; problems render by
severity; the order renders top-first; a 400 from an unknown mod shows the
message the API sent.

## Decisions already taken with the user

Stored order, recomputed only on an explicit action. Mods only from the site
browser. Public by slug immediately. Moderated with `Status` like guides. Only
signed-in users create, no forking someone else's collection yet. Pinning a
position by hand was deferred. `OVERRIDE_CONFLICT` is shown only when both mods
are in the collection.
