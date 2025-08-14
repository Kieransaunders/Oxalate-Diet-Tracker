# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Feature code in TypeScript.
  - `components/` (PascalCase `.tsx`), `screens/` (PascalCase `*Screen.tsx`), `navigation/`, `api/` (API wrappers), `state/` (Zustand stores), `utils/`, `hooks/`, `config/`, `test-utils/`.
- Entry points: `App.tsx`, `index.ts`. Assets in `Assets/`. Native projects in `ios/` and `android/`.
- Config: `app.json`, `eas.json`, `metro.config.js`, `eslint.config.mjs`/`.eslintrc.js`, `.prettierrc`, `jest.config.js`.

## Build, Test, and Development Commands
- `npm run start`: Launch Expo dev server (QR/iOS/Android/Web).
- `npm run ios` / `npm run android` / `npm run web`: Run locally on target.
- `npm test` / `npm run test:watch` / `npm run test:coverage`: Run Jest, watch, or produce coverage.
- `npm run test:update-snapshots`: Update Jest snapshots.
- `npm run validate:revenuecat`: Static checks for RevenueCat setup.
- EAS builds: `eas build -p ios|android --profile <profile>` (see `eas.json`).

## Coding Style & Naming Conventions
- TypeScript, 2‑space indent, line width 120, double quotes enforced by Prettier.
- ESLint (Expo + TS) is authoritative; fix lint before PRs. Example: `npx eslint src` and `npx prettier --check .`.
- Naming:
  - Components/Screens: `PascalCase` (e.g., `DailyProgressBar.tsx`, `HomeScreen.tsx`).
  - Hooks: `useSomething` in `hooks/`.
  - Stores: camelCase with `Store` suffix (e.g., `mealStore.ts`).
  - Utils: kebab‑case (e.g., `usage-limit-validation.ts`).

## Testing Guidelines
- Framework: Jest + Testing Library for React Native (`jest-expo` setup). See `jest-setup.ts` and `jest.config.js`.
- Location: colocate under `__tests__/` or use `*.test.ts(x)` alongside sources.
- Run: `npm test` (CI: `npm run test:ci`). Coverage artifacts in `coverage/`.
- Use helpers from `src/test-utils` for providers/mocks; prefer testing behavior over implementation.

## Commit & Pull Request Guidelines
- Commits: Imperative, concise subjects. Optional emoji/scope are acceptable (e.g., `feat(ui): Add TrackingProgress` or `✨ UI: Improve header`).
- PRs must include: clear description, linked issues, screenshots for UI, test plan/steps, and any config changes (`.env`, EAS, Sentry, RevenueCat).
- Checks: Lint and tests must pass locally; include any new tests.

## Security & Configuration Tips
- Copy `.env.example` → `.env`; never commit secrets. Validate with `npm run validate:revenuecat`.
- Keep library hotfixes in `patches/` (via `patch-package`). Avoid editing files in `node_modules/` directly.
