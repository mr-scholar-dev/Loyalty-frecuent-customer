# AGENTS.md

Guía operativa para agentes (Claude Code y similares) que trabajen en este
repositorio. **Léelo junto con `README.md` antes de modificar código.**

## Contexto del producto

Plataforma **multiempresa** de fidelización para servicentros. Un cliente se
registra, obtiene una **tarjeta digital web** con **QR único**, acumula lavados
pagados y gana un lavado gratis (por defecto: 9 pagados → 1 gratis). El personal
escanea la tarjeta y registra visitas o canjea recompensas. Sin app nativa.

## Reglas de oro (obligatorias)

1. Lee `AGENTS.md` y `README.md` antes de tocar código.
2. **Una fase por bloque de trabajo.** No adelantes fases.
3. Inspecciona el código existente antes de crear archivos.
4. No reemplaces la arquitectura sin justificarlo.
5. No instales dependencias innecesarias.
6. **Prohibido `any`.** TypeScript estricto siempre.
7. No desactives TypeScript ni ESLint (ni con `// eslint-disable` salvo caso justificado).
8. No expongas el `service role` al navegador.
9. No confíes en permisos del frontend; valida en servidor/BD.
10. No alteres balances directamente; solo vía RPC.
11. No borres eventos del ledger; usa eventos de reversión.
12. Crea migraciones reversibles cuando sea razonable.
13. Ejecuta las pruebas antes de cerrar un bloque.
14. Muestra archivos modificados y comandos ejecutados.
15. Reporta riesgos y pendientes.
16. **No hagas push** sin autorización.
17. Un commit local por bloque **aprobado**; usa Conventional Commits.
18. Mantén el working tree limpio tras el commit (solo cambios del bloque actual).

## Definición de "terminado"

Una tarea está terminada solo si: código implementado, tipado correcto,
validación incluida, permisos aplicados, manejo de errores, pruebas agregadas y
pasando, documentación actualizada, sin secretos, sin TODO críticos, sin
funciones simuladas presentadas como completas, y el working tree contiene solo
los cambios del bloque actual.

## Comandos

```bash
pnpm install
pnpm dev            # desarrollo
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest (unit + integration)
pnpm test:e2e       # Playwright
pnpm build          # build de producción
pnpm format         # Prettier
```

Cierre de bloque: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Convenciones

- **Ruteo**: App Router con grupos `(auth)`, `(public)`, `(dashboard)`.
- **Alias**: `@/*` apunta a la raíz del proyecto.
- **UI**: shadcn/ui + Tailwind con variables CSS (theming por organización).
- **Datos**: cliente oficial de Supabase para Auth/RLS; **funciones RPC
  PostgreSQL** para operaciones transaccionales críticas (registrar visita,
  canjear recompensa, reversión). Sin ORM en la primera versión.
- **Validación**: Zod en los límites de entrada (se añade con sus fases).
- **Zona horaria**: `America/Costa_Rica`; locale `es-CR`; mensajes en español.
- **Fechas**: siempre del servidor, nunca del dispositivo.
- **Idempotencia**: operaciones críticas con `idempotency_key`.
- **Commits**: `feat(scope): …`, `fix(...)`, `chore(...)`, `test(...)`, `docs(...)`.

## Modelo multiempresa (invariantes)

- Toda entidad operativa lleva `organization_id`.
- El aislamiento entre organizaciones se aplica con **RLS en PostgreSQL**, no
  solo en el frontend.
- La organización se deriva de la sesión/membresía, no de datos del cliente.
- Roles: `platform superadmin`, `owner`, `manager`, `employee` (mínimo privilegio).

## Seguridad

- Secretos solo en variables de entorno; `.env` nunca se commitea (ver `.env.example`).
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor.
- Rate limiting en rutas públicas; tokens públicos no secuenciales y de alta
  entropía; nunca uses placa/teléfono/ID como token público.
- No exponer datos administrativos en la tarjeta pública (`/c/{token}`).
- Auditoría de acciones críticas; no guardar secretos ni tokens completos en logs/auditoría.

## Extensibilidad (dejar puntos de extensión, no implementar aún)

Apple/Google Wallet, app nativa, WhatsApp/SMS API, POS, facturación, cobro del
SaaS (Stripe), programas por monto, cupones, referidos, marketing, marca blanca.

## Estado por fases

- **Fase 0 — Base técnica: EN CURSO / COMPLETADA (este bloque).**
  Next.js + TS estricto + Tailwind + shadcn preparado + ESLint/Prettier +
  Vitest/RTL + Playwright preparado + Supabase CLI preparado + estructura +
  `.env.example` + `/api/health` + home mínima + Docker.
- Fase 1 — BD y seguridad: **SQL preparado, sin verificar** (falta Docker +
  Supabase CLI). Migraciones en `supabase/migrations/` (enums, tablas, índices,
  FKs, constraints, helpers y políticas RLS), `seed.sql` y tests pgTAP en
  `supabase/tests/`. Validar con `supabase db reset` + `supabase test db`.
- Fase 2 — Auth y organizaciones.
- Fase 3 — Fidelización (ledger, balance, RPC visita/recompensa, reversión, idempotencia, auditoría).
- Fase 4 — Registro público.
- Fase 5 — Tarjeta digital + PWA.
- Fase 6 — Escáner QR.
- Fase 7 — Administración.
- Fase 8 — Pruebas y endurecimiento.
- Fase 9 — Despliegue piloto.

## Notas del entorno (Fase 0)

- Node instalado: v24 (Current). El proyecto fija `engines.node >=20` y `.nvmrc`
  en 22 (LTS). Preferir LTS en producción.
- **Docker y Supabase CLI no están instalados** en la máquina actual: los
  archivos de configuración existen (`supabase/config.toml`, `Dockerfile`,
  `docker-compose.yml`) pero `supabase start` / `docker build` no se verificaron
  aquí. Instalarlos antes de la Fase 1.
