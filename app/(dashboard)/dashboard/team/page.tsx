import type { Metadata } from "next";
import { listTeam } from "@/lib/loyalty/team";
import { TeamManager } from "@/components/dashboard/TeamManager";

export const metadata: Metadata = { title: "Equipo" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const team = await listTeam();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Equipo</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Administra el personal de tu servicentro y sus roles.
      </p>
      {team ? (
        <TeamManager members={team.members} isOwner={team.isOwner} />
      ) : (
        <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          No se pudo cargar el equipo.
        </p>
      )}
    </main>
  );
}
