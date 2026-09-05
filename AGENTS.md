# BaroLab frontend agent instructions

Start every frontend task with `PROJECT_MAP.md`. It is the compact routing index for this repository.

- Follow the relevant feature-routing row and open only the page, components, API client, utilities, styles, and tests needed for the task.
- Read `README.md` for setup or dependency questions, `DEPLOY_ENV.md` for deployment environment work, and `GUIDE_INSTRUCTIONS.md` only for guide editor/rendering behavior.
- Do not scan every JSX/CSS file or reconstruct a full repository tree before focused work. Use targeted `rg` searches when the map is not enough.
- Treat current routes, components, tests, API clients, and configuration as authoritative when they disagree with documentation.
- For API contracts, authentication, shared models, or end-to-end behavior, inspect the matching backend controller, DTO, security rule, and service in `../BaroLab/`.
- For UI/UX and visual design work, use the `impeccable` skill and preserve the existing visual identity unless the user explicitly requests a redesign.

Before finishing a change, inspect `git diff --name-status`. Update `PROJECT_MAP.md` in the same commit if the change adds, removes, renames, or moves a significant route, page, context, API module, component area, or configuration; changes a documented responsibility, contract, access boundary, or main data flow; or otherwise makes the map inaccurate.

Do not update the map for a purely internal component or styling change that leaves its documented routing information accurate. Keep the map compact: no exhaustive file tree, changelog, file/test counts, or build artifact sizes.

Verify frontend changes with `npm test` and/or `npm run build`, in proportion to the change.
