# Pokemon Trainer

A full-stack Pokemon-themed web application with a retro 8-bit aesthetic. Browse the Pokedex, catch Pokemon through a Quick-Time Event minigame, and level up your trainer.

## Features

- **Authentication** — Trainer registration and login with JWT tokens (bcrypt password hashing)
- **Pokedex** — Browse 1,025+ Pokemon with filters by type, region, habitat, and difficulty
- **Catching Minigame** — Arrow-key QTE with six difficulty tiers based on Pokemon stats
- **Trainer Progression** — XP rewards (success and failure) with level scaling
- **8-bit Aesthetic** — "Press Start 2P" typography, pixel art styling, Game Icons throughout

## Tech Stack

**Frontend** (`front/`)
- React 19 + TypeScript
- Vite
- Material-UI v7 with Emotion
- Redux Toolkit + React-Redux
- React Router v7
- Axios

**Backend** (`back/`)
- FastAPI (Python)
- Supabase (PostgreSQL)
- python-jose (JWT)
- passlib + bcrypt
- httpx (PokeAPI integration)

## Project Structure

```
.
├── back/                       # FastAPI backend
│   ├── main.py                 # App entry & CORS config
│   ├── populate_pokemon.py     # One-time PokeAPI → Supabase populator
│   ├── verify_config.py        # Environment sanity check
│   └── app/
│       ├── config.py           # Loads .env vars
│       ├── database.py         # Supabase client
│       ├── models/             # Pydantic schemas (user, pokemon, catch)
│       ├── routers/            # API endpoints (auth, pokemon, catch)
│       ├── services/           # Business logic (pokemon, catch, experience)
│       └── utils/auth.py       # JWT + password hashing
│
└── front/                      # React + TypeScript frontend
    ├── package.json
    └── src/
        ├── main.tsx
        ├── App.tsx             # Routes + providers
        ├── components/
        │   ├── auth/           # Login, Register, ProtectedRoute
        │   ├── catch/          # CatchPokemon, QTEMinigame
        │   ├── common/         # PokeballLoading, etc.
        │   ├── layout/         # Dashboard
        │   └── pokemon/        # Pokedex
        ├── features/           # Redux slices (auth, pokemon, catch)
        ├── store/              # store.ts, typed hooks
        └── styles/theme.ts     # 8-bit MUI theme
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Supabase project (free tier works fine)

### 1. Database Setup

In the Supabase SQL Editor, run the schema scripts to create the `trainers`, `pokemon`, and `captured_pokemon` tables. The `pokemon` table is populated via the script in step 3.

> Make sure Row Level Security (RLS) policies allow the service role to insert/update — RLS silently blocking writes is the most common setup pitfall.

### 2. Backend

```bash
cd back
pip install -r requirements.txt --break-system-packages
```

Create a `.env` file in `back/`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SECRET_KEY=generate-with-secrets-token-urlsafe-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Generate a secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Verify the configuration:
```bash
python verify_config.py
```

### 3. Populate the Pokemon Database

This pulls all Pokemon from PokeAPI into Supabase. Run **once**:

```bash
python populate_pokemon.py
```

After this, queries hit the local DB (~100ms) instead of live PokeAPI (~2–5s).

### 4. Start the Backend

```bash
python main.py
```

API runs on `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 5. Frontend

```bash
cd front
npm install
npm run dev
```

App runs on `http://localhost:5173`.

## Available Scripts

### Frontend (`front/`)
- `npm run dev` — Start Vite dev server
- `npm run build` — Type-check and build for production
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build

### Backend (`back/`)
- `python main.py` — Start FastAPI server (port 8000)
- `python verify_config.py` — Verify `.env` and DB connection
- `python populate_pokemon.py` — Populate Pokemon table from PokeAPI

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create a new trainer |
| POST | `/auth/login` | Get JWT token |
| GET | `/pokemon/` | Paginated, filterable Pokemon list |
| GET | `/pokemon/{id}` | Pokemon detail |
| POST | `/pokemon/{id}/capture` | Manually capture |
| DELETE | `/pokemon/{id}/capture` | Release |
| POST | `/catch/start` | Start a QTE catch attempt |
| POST | `/catch/complete` | Submit catch result, award XP |

All Pokemon and catch endpoints require a `Bearer` JWT.

## Catching Difficulty Tiers

QTE difficulty scales with the Pokemon's total base stats:

| Tier | Stats | Buttons | Time/Button |
|------|-------|---------|-------------|
| Weak | 180–300 | 3 | 1.5s |
| Easy | 301–400 | 4 | 1.2s |
| Medium | 401–500 | 5 | 1.0s |
| Hard | 501–600 | 6 | 0.8s |
| Legendary | 601–720 | 7 | 0.6s |
| Mythical | 721+ | 8 | 0.5s |

Successful catches award full XP; failed attempts award half. A "perfect" catch (every button pressed within 60% of the time limit) triggers a bonus message.

## License

Personal project. Pokemon data courtesy of [PokeAPI](https://pokeapi.co/). Pokemon and all related properties are © Nintendo / Game Freak / The Pokémon Company.
