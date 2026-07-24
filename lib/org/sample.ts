/**
 * Demo organizations keyed by slug, while the database layer is deferred.
 *
 * TEMPORARY: replace with an RLS-protected lookup by slug once Supabase lands.
 * Isolated here so the swap is a single call site.
 */

import type { OrganizationBrand } from "@/lib/loyalty/card";
import { DEFAULT_PROGRAM, type ProgramConfig } from "@/lib/loyalty/progress";

export interface SampleOrg {
  slug: string;
  brand: OrganizationBrand;
  program: ProgramConfig;
}

const ORGS: Record<string, SampleOrg> = {
  "el-sol": {
    slug: "el-sol",
    brand: {
      name: "Auto Lavado El Sol",
      logoUrl: null,
      primaryColor: "#0f766e",
      secondaryColor: "#0ea5e9",
    },
    program: DEFAULT_PROGRAM,
  },
  "la-bandera": {
    slug: "la-bandera",
    brand: {
      name: "Servicentro La Bandera",
      logoUrl: null,
      primaryColor: "#7c3aed",
      secondaryColor: "#db2777",
    },
    program: DEFAULT_PROGRAM,
  },
};

/** Look up a demo organization by slug, or null when unknown. */
export function getSampleOrg(slug: string): SampleOrg | null {
  return ORGS[slug] ?? null;
}
