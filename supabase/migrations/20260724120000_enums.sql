-- ============================================================================
-- Fase 1 · Enums y extensiones
-- Modelo de datos §7. Reversible: ver `-- down` al pie (comentado).
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- Roles y estados ------------------------------------------------------------
create type public.platform_role      as enum ('superadmin');
create type public.organization_status as enum ('active', 'suspended', 'trial');
create type public.branch_status       as enum ('active', 'inactive');
create type public.member_role         as enum ('owner', 'manager', 'employee');
create type public.member_status       as enum ('invited', 'active', 'disabled');
create type public.customer_status     as enum ('active', 'blocked', 'archived');
create type public.vehicle_status      as enum ('active', 'inactive');

-- Programa de fidelización ---------------------------------------------------
create type public.program_type     as enum ('visit_count');
create type public.cycle_behavior   as enum ('rolling_cycle');
create type public.program_status   as enum ('draft', 'active', 'inactive');
create type public.membership_status as enum ('active', 'blocked', 'expired');

-- Ledger ---------------------------------------------------------------------
create type public.loyalty_event_type as enum (
  'visit_earned',
  'visit_reversed',
  'reward_earned',
  'reward_redeemed',
  'reward_reversed',
  'manual_adjustment'
);
create type public.redemption_status as enum ('completed', 'reversed');

-- ============================================================================
-- down (manual):
--   drop type if exists public.redemption_status, public.loyalty_event_type,
--     public.membership_status, public.program_status, public.cycle_behavior,
--     public.program_type, public.vehicle_status, public.customer_status,
--     public.member_status, public.member_role, public.branch_status,
--     public.organization_status, public.platform_role;
-- ============================================================================
