# Contributing to AuroraLens

Thanks for stopping by — issues and PRs are welcome.

## Quick start

```bash
git clone https://github.com/aniruddhaadak80/aurora-lens
cd aurora-lens
npm install
npm run dev
```

Zero env vars. The app works fully offline via sealed fallback samples.

## Ground rules

- **One function, three consumers.** New scoring logic goes in `src/lib/engine.ts` so the UI, REST API and MCP tools stay identical.
- **Every feed gets a fallback.** Add samples to `src/lib/fallback.ts` whenever you touch `src/lib/live.ts`.
- **Keep it keyless.** No API keys in the core experience.
- Run `npm run lint` and `npm run build` before opening a PR.
- Conventional commits (`feat:`, `fix:`, `docs:` …).

## Good first issues

- New public feed normalizer (aurora oval, solar imagery, GNSS TEC)
- Extra engine factors with weights + docs
- Globe layer ideas (terminator line, satellite tracks)
- README diagrams and translations
