-- ============================================================================
-- Facturación / suscripción por organización.
-- Necesario antes de activar Stripe en producción. El webhook de Stripe
-- (app/api/stripe/webhook) persiste aquí el estado de la suscripción.
--
-- El gate de pago usa organizations.status: 'trial' = registrada sin pago
-- (bloqueada, ve el tour), 'active' = pago al día (acceso completo),
-- 'suspended' = pago vencido o bloqueo manual.
-- ============================================================================

alter table public.organizations
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists current_period_end     timestamptz,
  add column if not exists activated_at           timestamptz;

create index if not exists organizations_stripe_customer_id_idx
  on public.organizations (stripe_customer_id);

-- ============================================================================
-- down (manual):
--   alter table public.organizations
--     drop column if exists stripe_customer_id,
--     drop column if exists stripe_subscription_id,
--     drop column if exists current_period_end,
--     drop column if exists activated_at;
-- ============================================================================
