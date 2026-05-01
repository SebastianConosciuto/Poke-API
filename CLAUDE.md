# CLAUDE.md

Context file for Claude Code working in this repository. Read this first.

## What this is

A full-stack Pokemon Trainer web app with a strict retro 8-bit aesthetic. FastAPI backend, React/TypeScript frontend, Supabase for persistence. Personal project — pragmatic over enterprise-perfect, but conventions matter because they keep the 8-bit feel coherent.

## Repository Layout

```
back/                          # FastAPI backend
  main.py                      # App entry, CORS, router includes
  app/
    config.py                  # Reads .env (SUPABASE_*, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES)
    database.py                # Single shared `supabase` client
    models/                    # Pydantic v2 schemas — request/response only
    routers/                   # Thin HTTP layer, calls into services
    services/                  # All business logic lives here
    utils/auth.py              # JWT + bcrypt helpers, `get_current_user` dep

front/                         # React 19 + TypeScript + Vite
  src/
    main.tsx                   # createRoot + StrictMode
    App.tsx                    # Provider, ThemeProvider, Routes
    components/                # UI components grouped by feature
    features/                  # Redux slices + thunks (auth, pokemon, catch)
    store/                     # store.ts + typed useAppDispatch/useAppSelector hooks
    styles/theme.ts            # 8-bit MUI theme (Press Start 2P, etc.)
```

## Common Commands

```bash
# Backend
cd back
python verify_config.py                # Sanity-check .env + DB before any run
python main.py                         # Start API on :8000 (docs at /docs)
python populate_pokemon.py             # One-time PokeAPI → Supabase pull
pip install <pkg> --break-system-packages

# Frontend
cd front
npm run dev                            # Vite on :5173
npm run build                          # tsc -b && vite build
npm run lint
```

CORS in `back/main.py` is locked to `http://localhost:5173` — update there if the dev port ever changes.

## Architecture Conventions

### Backend: routers → services → supabase

- **Routers** (`app/routers/`) handle HTTP: extract params, call a service method, wrap exceptions. Keep them thin. The pattern is `try / except HTTPException: raise / except Exception: raise HTTPException(500, ...)`.
- **Services** (`app/services/`) own the logic and the Supabase calls. Add new behavior here, not in routers.
- **Models** (`app/models/`) are Pydantic schemas only. No logic.
- **Auth**: every protected endpoint depends on `get_current_user` from `app.utils.auth`, which returns the `trainer_id` string. Use this — don't roll your own token decoding.

### Frontend: Redux Toolkit + thunks

- Each domain has a slice in `features/<domain>/<domain>Slice.ts` with `createAsyncThunk` for API calls and `extraReducers` for the three states (pending/fulfilled/rejected).
- Always use `useAppDispatch` / `useAppSelector` from `store/hooks.ts` — never the untyped versions.
- `ProtectedRoute` wraps any authed page and runs `checkAuth` if a token exists in localStorage but state isn't authenticated yet.
- Routes are declared centrally in `App.tsx`. Add new pages there.

### Database (Supabase / PostgreSQL)

Three tables: `trainers`, `pokemon`, `captured_pokemon`. The `pokemon` table is populated **once** from PokeAPI — never call PokeAPI at request time, that pattern was already removed (was 2–5s, now <100ms via the local table).

**RLS gotcha**: Row Level Security has silently blocked writes more than once on this project. If a write seems to "succeed" but the row never appears, check RLS policies first. This is the single most common bug source.

## Domain Rules (do not change without asking)

### XP rewards
Defined in `ExperienceService` constants. Successful catches award `XP_CATCH_SUCCESS`; failures award half. XP scales by difficulty tier (10–60 base). Both success and failure path through `award_experience` in the service.

### Catching difficulty (exact, do not adjust)
Tiers are determined by Pokemon `stats_total`:

| Tier | Stats range | Buttons | Time/button |
|------|-------------|---------|-------------|
| weak | 180–300 | 3 | 1.5s |
| easy | 301–400 | 4 | 1.2s |
| medium | 401–500 | 5 | 1.0s |
| hard | 501–600 | 6 | 0.8s |
| legendary | 601–720 | 7 | 0.6s |
| mythical | 721+ | 8 | 0.5s |

These exact numbers come from the design spec — both `catch_service.py` and the frontend instructions display must stay in sync. A "perfect" catch is every button pressed within 60% of the time-per-button limit.

### QTE input
Only the four arrow keys: `up`, `down`, `left`, `right`. The `KEY_MAP` in `QTEMinigame.tsx` translates `event.key` (`ArrowUp`, etc.) to the lowercase strings the backend expects.

## Styling Rules (the 8-bit feel)

These are non-negotiable for any new UI:

- Primary font: `"Press Start 2P", monospace` for headings, buttons, titles
- Body/mono text: `"Roboto Mono", monospace`
- Hard pixel borders (`border: '3px solid'` or `'4px solid'`), no rounded corners (`borderRadius: 0`)
- Hard text shadows for depth (`textShadow: '3px 3px 0px rgba(0, 0, 0, 0.2)'`)
- Iconify Game Icons collection (`@iconify/react`) for thematic iconography
- Use the `pokedexTheme` from `styles/theme.ts` and the existing styled components in each feature folder rather than inventing new ones

When in doubt, look at `Register.tsx`, `Pokedex.tsx`, or `QTEMinigame.tsx` — they set the visual tone for forms, lists, and game UI respectively.

## Development Approach

Sebastian prefers:

- **Incremental over comprehensive** — start with the minimal working version, then expand. Don't propose huge refactors unprompted.
- **Modular separation** — frontend never reaches around Redux to hit the API directly; backend never puts logic in routers.
- **Type safety** — TypeScript on the frontend, Pydantic on the backend. Don't use `any` in TS without a reason.
- **Verify before assuming a bug is in code** — DB schema, RLS policies, server restart, `.env` reload have all been culprits before.

## When Adding Features

1. **New endpoint**: model in `app/models/` → method in service → route in router → register in `main.py` if it's a new router.
2. **New page**: component under `components/<feature>/` → route in `App.tsx` (wrap in `ProtectedRoute` if authed) → slice in `features/<feature>/` if it has its own state, otherwise reuse.
3. **New API client call from frontend**: add a thunk in the relevant slice; don't call axios directly from components.
4. **New filter on the Pokedex**: extend the query params in `pokemon.py` router → handle in `pokemon_service.get_pokemon_list` → add to `pokemonSlice` filters → wire UI in `Pokedex.tsx`.

## Forward-Looking Notes

Workflow automation (n8n vs APScheduler) is on the radar for things like daily featured Pokemon rotation. Nothing's wired up yet — if asked to implement, ask whether to go self-hosted n8n or in-process APScheduler before scaffolding either.

## Things to Avoid

- Calling PokeAPI at request time (use the populated `pokemon` table)
- Bypassing `get_current_user` to read the token manually
- Adding `borderRadius` to UI components (breaks 8-bit feel)
- Putting business logic in routers
- Adding new arrow-key directions or changing the QTE difficulty tiers without explicit confirmation
- `any` types on the frontend without justification
