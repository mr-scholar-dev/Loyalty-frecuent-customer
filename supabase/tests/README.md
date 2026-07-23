# SQL / RLS tests

pgTAP-based database tests run with `supabase test db`. Added in Phase 1 to
prove tenant isolation and RLS policies:

- Organization A cannot read organization B's rows.
- `employee` cannot modify loyalty programs.
- `membership_balances` cannot be updated directly (only via RPC).
- Every tenant-scoped table has RLS enabled.

No tests exist in Phase 0 (no schema yet).
