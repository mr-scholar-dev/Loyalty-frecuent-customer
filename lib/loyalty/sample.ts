/**
 * Demo membership seeds for the public card and scanner, while the database
 * layer is deferred.
 *
 * TEMPORARY: replace with a real, RLS-protected lookup by token hash once the
 * Supabase layer lands. Kept isolated here so the swap is a single call site.
 */

import { MembershipStatus } from "@/types/domain";
import type { OrganizationBrand } from "@/lib/loyalty/card";

export interface MembershipRecord {
  organization: OrganizationBrand;
  customerFullName: string;
  /** Normalized license plate. */
  licensePlate: string;
  paidVisitsInCycle: number;
  availableRewards: number;
  status: MembershipStatus;
  joinedAt: string;
  lastActivityAt: string | null;
}

export const SAMPLE_SEEDS: Record<string, MembershipRecord> = {
  demo: {
    organization: {
      name: "Auto Lavado El Sol",
      logoUrl: null,
      primaryColor: "#0f766e",
      secondaryColor: "#0ea5e9",
    },
    customerFullName: "María Rodríguez Solano",
    licensePlate: "BMT345",
    paidVisitsInCycle: 3,
    availableRewards: 0,
    status: MembershipStatus.Active,
    joinedAt: "2026-06-01T09:00:00-06:00",
    lastActivityAt: "2026-07-20T14:30:00-06:00",
  },
  "demo-reward": {
    organization: {
      name: "Servicentro La Bandera",
      logoUrl: null,
      primaryColor: "#7c3aed",
      secondaryColor: "#db2777",
    },
    customerFullName: "Carlos Jiménez Vargas",
    licensePlate: "CL1289",
    paidVisitsInCycle: 2,
    availableRewards: 1,
    status: MembershipStatus.Active,
    joinedAt: "2026-05-15T09:00:00-06:00",
    lastActivityAt: "2026-07-23T09:15:00-06:00",
  },
  "demo-blocked": {
    organization: {
      name: "Lavacar Express",
      logoUrl: null,
      primaryColor: "#b91c1c",
      secondaryColor: "#f59e0b",
    },
    customerFullName: "Ana Mora",
    licensePlate: "SJB902",
    paidVisitsInCycle: 5,
    availableRewards: 0,
    status: MembershipStatus.Blocked,
    joinedAt: "2026-04-01T09:00:00-06:00",
    lastActivityAt: "2026-06-30T18:00:00-06:00",
  },
};
