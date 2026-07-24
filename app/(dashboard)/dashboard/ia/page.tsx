import type { Metadata } from "next";
import { AIWorkspace } from "@/components/dashboard/AIWorkspace";
import { isAIConfigured } from "@/lib/ai/openrouter";
import { getAICounts, getAtRiskCustomers } from "@/lib/ai/insights";

export const metadata: Metadata = { title: "Asistente IA" };
export const dynamic = "force-dynamic";

export default async function AIPage() {
  const configured = isAIConfigured();
  const nowIso = new Date().toISOString();

  // Only read live data when the feature is on — no LLM calls happen until the
  // user asks (keeps token spend at zero on page load).
  const [counts, atRisk] = configured
    ? await Promise.all([getAICounts(nowIso), getAtRiskCustomers(nowIso)])
    : [
        { totalCustomers: 0, washesThisMonth: 0, rewardsPending: 0, atRisk: 0 },
        [],
      ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Asistente IA</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Un copiloto que conoce todo tu negocio: consulta métricas y clientes,
        crea tareas en el Kanban, detecta clientes en riesgo y redacta mensajes
        de reactivación — sobre tus datos reales.
      </p>
      <AIWorkspace configured={configured} counts={counts} atRisk={atRisk} />
    </main>
  );
}
