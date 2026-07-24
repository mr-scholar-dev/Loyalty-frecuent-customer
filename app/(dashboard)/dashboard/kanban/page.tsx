import type { Metadata } from "next";
import { getBoard } from "@/lib/loyalty/kanban";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";

export const metadata: Metadata = { title: "Kanban" };
export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const board = await getBoard();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Tablero</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Organiza las tareas de tu servicentro: mantenimiento, pendientes,
        seguimiento a clientes.
      </p>
      {board ? (
        <KanbanBoard board={board} />
      ) : (
        <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          No se pudo cargar el tablero.
        </p>
      )}
    </main>
  );
}
