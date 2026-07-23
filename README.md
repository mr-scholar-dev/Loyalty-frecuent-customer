# Loyalty Web

Plataforma web **multiempresa** de fidelización para servicentros. Cada
servicentro (organización/tenant) administra clientes, vehículos, tarjetas
digitales con QR, un programa de lavados y sus recompensas.

> **Estado actual: Fase 0 (base técnica).** Solo está la infraestructura del
> proyecto: Next.js, TypeScript estricto, Tailwind, herramientas de calidad,
> estructura de carpetas, `/api/health` y configuración (sin lógica de negocio).

## Stack

- **Next.js** (App Router) + **React 19** + **TypeScript** estricto
- **Tailwind CSS** + **shadcn/ui** (preparado) + **Lucide** icons
- **Supabase** (PostgreSQL, Auth, Storage, RLS) — _configurado, aún sin esquema_
- **Vitest** + React Testing Library (unit/integration) · **Playwright** (E2E)
- **ESLint** + **Prettier**
- **pnpm** · Node.js LTS (ver `.nvmrc`)

## Requisitos

- Node.js ≥ 20 (recomendado 22 LTS, ver `.nvmrc`)
- pnpm 9 (`corepack enable`)
- Para Supabase local: **Docker** + **Supabase CLI** (aún no instalados en este
  entorno — ver [Supabase local](#supabase-local))

## Primeros pasos

```bash
pnpm install
cp .env.example .env      # completa los valores reales
pnpm dev                  # http://localhost:3000
```

Verifica la salud del servicio: `GET http://localhost:3000/api/health`.

## Scripts

| Comando             | Descripción                               |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | Servidor de desarrollo                    |
| `pnpm build`        | Build de producción (salida `standalone`) |
| `pnpm start`        | Sirve el build de producción              |
| `pnpm lint`         | ESLint (`next lint`)                      |
| `pnpm typecheck`    | `tsc --noEmit`                            |
| `pnpm test`         | Vitest (unit + integration)               |
| `pnpm test:e2e`     | Playwright (E2E)                          |
| `pnpm format`       | Prettier (escribe)                        |
| `pnpm format:check` | Prettier (verifica)                       |

## Supabase local

Requiere Docker + Supabase CLI (instálalos con, p. ej., `brew install supabase/tap/supabase`
y Docker Desktop). Luego:

```bash
supabase start           # levanta Postgres, Auth, Storage y Studio locales
```

En Fase 0 no hay migraciones de negocio; el esquema, RLS y funciones RPC llegan
en la Fase 1.

## Estructura

```text
app/            Rutas (App Router): (auth) (public) (dashboard) api/
components/     ui · public · dashboard · scanner · loyalty-card
lib/            auth · supabase · loyalty · qr · permissions ·
                validation · normalization · security · utils
actions/        Server actions
hooks/          React hooks
types/          Tipos compartidos
supabase/       migrations · seed.sql · tests (SQL/RLS)
tests/          unit · integration · e2e
public/         icons · manifest.webmanifest (PWA)
```

## Docker

Imagen provider-agnostic (Cloud Run, Fly.io, Railway, Render, VPS…):

```bash
docker compose up --build   # requiere un .env válido
```

Supabase **no** está en el compose; usa la Supabase CLI y apunta
`NEXT_PUBLIC_SUPABASE_URL` a la instancia local (por defecto `:54321`).

## Seguridad (principios que aplican desde ya)

- TypeScript estricto, validación en los límites, **sin `any`**.
- `SUPABASE_SERVICE_ROLE_KEY` **solo** en el servidor, nunca al navegador.
- La organización se deriva de la sesión, no del cliente.
- Balances y recompensas solo cambian mediante RPC transaccional (Fase 3).
- Secretos únicamente en variables de entorno; `.env` nunca se commitea.

## Roadmap por fases

Fase 0 (esta) → 1 BD + RLS → 2 Auth + orgs → 3 Fidelización → 4 Registro
público → 5 Tarjeta digital → 6 Escáner → 7 Administración → 8 Pruebas y
endurecimiento → 9 Piloto. Ver detalle y reglas en [`AGENTS.md`](./AGENTS.md).

## Licencia

Privado / propietario. Todos los derechos reservados.
