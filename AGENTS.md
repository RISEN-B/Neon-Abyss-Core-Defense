# Repository Guidelines

## Project Structure & Module Organization

`index.html` is the application entry point and loads all styles and classic JavaScript files. Game code lives in `assets/js/`: `main.js` owns initialization and input, `game-loop.js` handles frame updates and collisions, entity classes have dedicated files, and `config.js` contains shared limits and color settings. Styles are split by UI concern under `assets/css/`; ship and enemy artwork lives in `assets/svg/`. Keep the English and Chinese documentation in `README.md` and `README.zh-CN.md` aligned when changing documented behavior.

## Build, Test, and Development Commands

The project uses vanilla JavaScript with no dependencies or compilation step.

- `python3 -m http.server 8000` — serve the repository locally; open `http://localhost:8000`.
- Open `index.html` directly — quick smoke test when an HTTP server is unnecessary.
- `git diff --check` — detect whitespace errors before committing.

There is no package install or production build command. Preserve the `<script>` order in `index.html`, because files share browser globals and are not ES modules.

## Coding Style & Naming Conventions

Follow the existing style: four-space indentation, semicolons, single-quoted JavaScript strings, and braces on the same line. Use `camelCase` for variables and functions, `PascalCase` for entity classes such as `AudioManager`, and `UPPER_SNAKE_CASE` for fixed limits. CSS class names and asset filenames use kebab-case. Add concise comments for gameplay rules or non-obvious math; avoid comments that merely restate code. Keep tunable gameplay constants in `config.js` where practical.

## Testing Guidelines

No automated test framework or coverage threshold is configured. Manually verify changes in a modern browser. Start and restart a game, test WASD/mouse input and pause behavior, and exercise any affected enemies, upgrades, audio, settings, or demo mode. Check the browser console for errors and resize or blur the window when changing lifecycle or layout code. Include reproduction and verification steps in the pull request.

## Commit & Pull Request Guidelines

Recent history uses short, title-case prefixes such as `Docs: add contributors section` and `Chore: initial release`. Prefer `Type: imperative summary` (for example, `Fix: prevent duplicate projectiles`) and keep each commit focused. Pull requests should explain player-visible impact, list manual checks, link relevant issues, and include screenshots or a short recording for UI, animation, or visual-effect changes.

## Security & Configuration

Do not commit secrets or introduce runtime credentials. The game stores scores and settings in `localStorage`; use stable, namespaced keys and handle missing or invalid stored values safely.
