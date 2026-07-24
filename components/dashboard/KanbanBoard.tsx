"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import type { KanbanBoardView } from "@/lib/loyalty/kanban";
import {
  addCard,
  addColumn,
  deleteCard,
  deleteColumn,
  moveCard,
} from "@/actions/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function KanbanBoard({ board }: { board: KanbanBoardView }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newColumn, setNewColumn] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);

  const columnIds = board.columns.map((c) => c.id);

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  function submitCard(columnId: string) {
    const title = (drafts[columnId] ?? "").trim();
    if (!title) return;
    setDrafts((d) => ({ ...d, [columnId]: "" }));
    run(() => addCard(columnId, title, ""));
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {board.columns.map((col, i) => (
        <div
          key={col.id}
          className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30"
        >
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{col.name}</span>
              <span className="rounded-full bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {col.cards.length}
              </span>
            </div>
            <button
              type="button"
              aria-label={`Eliminar columna ${col.name}`}
              onClick={() => run(() => deleteColumn(col.id))}
              disabled={isPending}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="flex-1 space-y-2 px-3">
            {col.cards.map((card) => (
              <div
                key={card.id}
                className="rounded-md border bg-card p-3 shadow-sm"
              >
                <p className="text-sm font-medium">{card.title}</p>
                {card.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.description}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Mover a la izquierda"
                      disabled={isPending || i === 0}
                      onClick={() =>
                        run(() => moveCard(card.id, columnIds[i - 1]!))
                      }
                      className="rounded p-1 text-muted-foreground enabled:hover:bg-accent disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Mover a la derecha"
                      disabled={isPending || i === columnIds.length - 1}
                      onClick={() =>
                        run(() => moveCard(card.id, columnIds[i + 1]!))
                      }
                      className="rounded p-1 text-muted-foreground enabled:hover:bg-accent disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Eliminar tarjeta"
                    disabled={isPending}
                    onClick={() => run(() => deleteCard(card.id))}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3">
            <Input
              value={drafts[col.id] ?? ""}
              onChange={(e) =>
                setDrafts((d) => ({ ...d, [col.id]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCard(col.id);
              }}
              placeholder="+ Añadir tarjeta"
              className="h-9 bg-background text-sm"
              disabled={isPending}
            />
          </div>
        </div>
      ))}

      {/* Add column */}
      <div className="w-72 shrink-0">
        {addingColumn ? (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <Input
              autoFocus
              value={newColumn}
              onChange={(e) => setNewColumn(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newColumn.trim()) {
                  const name = newColumn.trim();
                  setNewColumn("");
                  setAddingColumn(false);
                  run(() => addColumn(board.boardId, name));
                }
              }}
              placeholder="Nombre de la columna"
              className="h-9 bg-background text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={isPending || !newColumn.trim()}
                onClick={() => {
                  const name = newColumn.trim();
                  setNewColumn("");
                  setAddingColumn(false);
                  run(() => addColumn(board.boardId, name));
                }}
              >
                Añadir
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingColumn(false);
                  setNewColumn("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingColumn(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground"
          >
            <Plus className="h-4 w-4" aria-hidden /> Añadir columna
          </button>
        )}
      </div>
    </div>
  );
}
