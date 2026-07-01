Abonnement à des animés en cours de diffusion : détection automatique de la
sortie d'un épisode (AniList), recherche du torrent correspondant (Nyaa.si),
ajout à Premiumize, et exposition d'un lien de lecture direct pour un client
externe (Kodi). Ce projet est pour but educationnel uniquement et n'a pas vocation à être utilisé, particulièrement pas de façon illégale.

## Sommaire
- [Contexte & objectifs](#contexte--objectifs)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Périmètre M1 / M2](#périmètre)
- [Structure du repo](#structure-du-repo)
- [Endpoints](#endpoints)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts](#scripts)
- [Tests](#tests)
- [Lint & format](#lint--format)
- [CI/CD](#cicd)

## Contexte & objectifs
- Éliminer la vérification manuelle de sortie d'épisode
- Automatiser recherche torrent + ajout debrid (Premiumize)
- Fournir un lien de lecture stable pour un client externe (Kodi)

## Architecture

Architecture en 4 couches horizontales :

1. **Présentation** — Controllers Express (`SubscriptionController`, `EpisodeController`), routing et validation d'input uniquement
2. **Métier** — Services d'orchestration (`SubscriptionService`, `EpisodeService`), toute la logique de décision
3. **Intégrations externes** — Services techniques (`AnilistService`, `NyaaService`, `PremiumizeService`), encapsulent un appel API tiers, sans logique métier
4. **Données** — Repositories (interface + implémentations `InMemory`/`SQL`), persistance uniquement

Voir `docs/architecture.md` pour le diagramme complet.

### Responsabilités

| Service | Rôle | Dépend de |
|---|---|---|
| `SubscriptionService` | Marquer une série à suivre, voir le dernier épisode prévu | `AnilistService`, `SubscriptionRepository` |
| `EpisodeService` | Voir infos épisode, lister les fichiers Premiumize dispo, produire le lien débridé | `NyaaService`, `PremiumizeService`, `EpisodeRepository` |

## Stack technique

- Backend : TypeScript (Node.js, Express)
- Frontend : React + TypeScript
- DB : PostgreSQL
- Queue : BullMQ + Redis (polling asynchrone Premiumize)
- Debrid : Premiumize (M1)
- Monorepo : pnpm workspaces + Turborepo
- Tests : Vitest (+ Testing Library côté front)
- Lint : ESLint (flat config) + Prettier

## Périmètre

### M1 (cette itération)
- Subscription à une sélection finie d'animés en diffusion
- Sync airing via `nextAiringEpisode` (AniList)
- Recherche Nyaa (premier résultat valide, pas de scoring) + ajout Premiumize
- Listing des fichiers disponibles côté Premiumize à l'instant T
- Endpoint de résolution du lien de lecture

### M2 (juillet)
- `Matching` : scoring de pertinence (fansub, résolution, seeders) intégré dans `EpisodeService`
- Multi-provider (Real-Debrid, TorBox)
- Gestion série → saisons multiples

## Structure du repo

```
anime-auto-grabber/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   │   ├── subscription.service.ts
│   │   │   │   ├── episode.service.ts
│   │   │   │   ├── anilist.service.ts
│   │   │   │   ├── nyaa.service.ts
│   │   │   │   └── premiumize.service.ts
│   │   │   ├── repositories/
│   │   │   │   ├── subscription.repository.ts   # interface
│   │   │   │   ├── episode.repository.ts         # interface
│   │   │   │   ├── in-memory/
│   │   │   │   └── sql/
│   │   │   ├── routes/
│   │   │   ├── app.ts
│   │   │   └── main.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                       # frontend React (Vite)
├── packages/
│   └── domain/                    # entités partagées (Series, Season, Episode, Subscription)
├── docs/
│   └── architecture.md
├── .github/workflows/
│   ├── ci.yml
│   └── cd.yml
├── docker-compose.dev.yml
├── .env.example
├── eslint.config.mjs
├── .prettierrc
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Endpoints

### Subscriptions
```
POST   /subscriptions              → create
GET    /subscriptions              → list
GET    /subscriptions/:id          → getById
GET    /subscriptions/:id/next-episode → getNextAiringEpisode
DELETE /subscriptions/:id          → remove
```

### Episodes
```
GET    /episodes                   → list (filtrable par subscriptionId, status)
GET    /episodes/files             → listAvailableFiles (Premiumize, doit être déclaré avant /:id)
GET    /episodes/:id               → getDetails
POST   /episodes/:id/resolve-link  → resolveDownloadLink
```

## Installation

```bash
corepack enable
corepack prepare pnpm@9 --activate
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
pnpm dev
```

## Variables d'environnement

| Variable | Description |
|---|---|
| `PORT` | Port de l'API (défaut 3000) |
| `DATABASE_URL` | Connexion PostgreSQL |
| `REDIS_URL` | Connexion Redis (BullMQ) |
| `PREMIUMIZE_API_KEY` | Clé API Premiumize |
| `ANILIST_POLL_INTERVAL_MIN` | Intervalle de sync airing |
| `USE_IN_MEMORY_DB` | `true` pour dev/tests sans DB réelle |

## Scripts

| Commande | Rôle |
|---|---|
| `pnpm dev` | Lance api + web en parallèle (Turborepo) |
| `pnpm build` | Build production (packages affectés) |
| `pnpm test` | Tests unitaires (Vitest) |
| `pnpm lint` | ESLint sur tout le monorepo |
| `pnpm lint:fix` | ESLint + correction auto |
| `pnpm format` | Prettier |

## Tests

- **Unitaires** : services testés avec les repositories `InMemory` et des fakes pour les services externes (pas de mock lib nécessaire)
- **Intégration** : repositories `SQL` testés contre PostgreSQL éphémère (Testcontainers)
- **Frontend** : composants React testés avec Vitest + Testing Library, comportement utilisateur plutôt qu'implémentation

## Lint & format

ESLint flat config (`eslint.config.mjs`) + `typescript-eslint` + Prettier intégré.

## CI/CD

- **CI** (`ci.yml`) : install → lint → build → test, déclenché sur push/PR, limité aux packages affectés (`turbo --filter=...[HEAD^1]`)
- **CD** (`cd.yml`) : build + push d'images Docker multi-stage vers GHCR, déclenché sur push vers `main` uniquement
