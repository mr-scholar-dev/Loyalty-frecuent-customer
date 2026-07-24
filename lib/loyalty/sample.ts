/**
 * Demo data for the public card while the database layer is deferred.
 *
 * TEMPORARY: replace with a real, RLS-protected lookup by token hash once the
 * Supabase layer lands. Kept isolated here so the swap is a single call site.
 */

import { MembershipStatus } from "@/types/domain";
import {
  buildCardUrl,
  getProgressView,
  maskCustomerName,
  type CardView,
} from "@/lib/loyalty/card";

interface SampleSeed {
  organizationName: string;
  primaryColor: string;
  secondaryColor: string;
  customerFullName: string;
  licensePlate: string;
  paidVisitsInCycle: number;
  availableRewards: number;
  status: MembershipStatus;
  lastActivityAt: string | null;
}

const SAMPLES: Record<string, SampleSeed> = {
  demo: {
    organizationName: "Auto Lavado El Sol",
    primaryColor: "#0f766e",
    secondaryColor: "#0ea5e9",
    customerFullName: "María Rodríguez Solano",
    licensePlate: "BMT345",
    paidVisitsInCycle: 3,
    availableRewards: 0,
    status: MembershipStatus.Active,
    lastActivityAt: "2026-07-20T14:30:00-06:00",
  },
  "demo-reward": {
    organizationName: "Servicentro La Bandera",
    primaryColor: "#7c3aed",
    secondaryColor: "#db2777",
    customerFullName: "Carlos Jiménez Vargas",
    licensePlate: "CL1289",
    paidVisitsInCycle: 2,
    availableRewards: 1,
    status: MembershipStatus.Active,
    lastActivityAt: "2026-07-23T09:15:00-06:00",
  },
  "demo-blocked": {
    organizationName: "Lavacar Express",
    primaryColor: "#b91c1c",
    secondaryColor: "#f59e0b",
    customerFullName: "Ana Mora",
    licensePlate: "SJB902",
    paidVisitsInCycle: 5,
    availableRewards: 0,
    status: MembershipStatus.Blocked,
    lastActivityAt: "2026-06-30T18:00:00-06:00",
  },
};

/** Build a safe CardView for a demo token, or null when unknown. */
export function getSampleCardView(token: string): CardView | null {
  const seed = SAMPLES[token];
  if (!seed) return null;

  return {
    organization: {
      name: seed.organizationName,
      logoUrl: null,
      primaryColor: seed.primaryColor,
      secondaryColor: seed.secondaryColor,
    },
    customerDisplayName: maskCustomerName(seed.customerFullName),
    licensePlate: seed.licensePlate,
    status: seed.status,
    progress: getProgressView({
      paidVisitsInCycle: seed.paidVisitsInCycle,
      availableRewards: seed.availableRewards,
    }),
    cardUrl: buildCardUrl(token),
    lastActivityAt: seed.lastActivityAt,
  };
}
