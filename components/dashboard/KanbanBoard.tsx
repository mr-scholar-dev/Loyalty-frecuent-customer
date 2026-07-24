"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus, Trash2, X } from "lucide-react";
import type {
  KanbanBoardView,
  KanbanCard,
  KanbanColumn,
  KanbanMember,
} from "@/lib/loyalty/kanban";
import {
  addCard,
  addColumn,
  deleteCard,
  deleteColumn,
  moveCard,
  updateCard,
} from "@/actions/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function KanbanBoard({ board }: { board: KanbanBoardView }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [columns, setColumns] = useState<KanbanColumn[]>(board.columns);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newColumn, setNewColumn] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [editing, setEditing] = useState<KanbanCard | null>(null);

  // Re-sync with server truth after each refresh.
  useEffect(() => {
    setColumns(board.columns);
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

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

  function onDragEnd(event: DragEndEvent) {
    const cardId = String(event.active.id);
    const toColumnId = event.over ? String(event.over.id) : null;
    if (!toColumnId) return;
    const from = columns.find((c) => c.cards.some((x) => x.id === cardId));
    if (!from || from.id === toColumnId) return;
    const card = from.cards.find((x) => x.id === cardId)!;
    // Optimistic move.
    setColumns((cols) =>
      cols.map((c) => {
        if (c.id === from.id)
          return { ...c, cards: c.cards.filter((x) => x.id !== cardId) };
        if (c.id === toColumnId) return { ...c, cards: [...c.cards, card] };
        return c;
      }),
    );
    run(() => moveCard(cardId, toColumnId));
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              disabled={isPending}
              draft={drafts[col.id] ?? ""}
              onDraft={(v) => setDrafts((d) => ({ ...d, [col.id]: v }))}
              onSubmitCard={() => submitCard(col.id)}
              onDeleteColumn={() => run(() => deleteColumn(col.id))}
              onOpenCard={setEditing}
            />
          ))}

          <div className="w-72 shrink-0">
            {addingColumn ? (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <Input
                  autoFocus
                  value={newColumn}
                  onChange={(e) => setNewColumn(e.target.value)}
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
      </DndContext>

      {editing && (
        <CardModal
          card={editing}
          columns={columns}
          members={board.members}
          onClose={() => setEditing(null)}
          onSave={(patch, toColumnId) => {
            const card = editing;
            setEditing(null);
            run(async () => {
              await updateCard(card.id, patch);
              const current = columns.find((c) =>
                c.cards.some((x) => x.id === card.id),
              );
              if (toColumnId && current && current.id !== toColumnId) {
                await moveCard(card.id, toColumnId);
              }
            });
          }}
          onDelete={() => {
            const card = editing;
            setEditing(null);
            run(() => deleteCard(card.id));
          }}
        />
      )}
    </>
  );
}

function Column({
  column,
  disabled,
  draft,
  onDraft,
  onSubmitCard,
  onDeleteColumn,
  onOpenCard,
}: {
  column: KanbanColumn;
  disabled: boolean;
  draft: string;
  onDraft: (v: string) => void;
  onSubmitCard: () => void;
  onDeleteColumn: () => void;
  onOpenCard: (c: KanbanCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors",
        isOver && "ring-2 ring-primary",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{column.name}</span>
          <span className="rounded-full bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {column.cards.length}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Eliminar columna ${column.name}`}
          onClick={onDeleteColumn}
          disabled={disabled}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex-1 space-y-2 px-3">
        {column.cards.map((card) => (
          <DraggableCard key={card.id} card={card} onOpen={onOpenCard} />
        ))}
      </div>

      <div className="p-3">
        <Input
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmitCard();
          }}
          placeholder="+ Añadir tarjeta"
          className="h-9 bg-background text-sm"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function DraggableCard({
  card,
  onOpen,
}: {
  card: KanbanCard;
  onOpen: (c: KanbanCard) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: card.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(card)}
      style={
        transform
          ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
          : undefined
      }
      className={cn(
        "cursor-grab touch-none rounded-md border bg-card p-3 text-left shadow-sm active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
    >
      <p className="text-sm font-medium">{card.title}</p>
      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {card.description}
        </p>
      )}
      {card.assigneeName && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-semibold text-primary">
            {initials(card.assigneeName)}
          </span>
          <span className="text-xs text-muted-foreground">
            {card.assigneeName}
          </span>
        </div>
      )}
    </div>
  );
}

function CardModal({
  card,
  columns,
  members,
  onClose,
  onSave,
  onDelete,
}: {
  card: KanbanCard;
  columns: KanbanColumn[];
  members: KanbanMember[];
  onClose: () => void;
  onSave: (
    patch: { title: string; description: string; assigneeId: string | null },
    toColumnId: string,
  ) => void;
  onDelete: () => void;
}) {
  const currentColumn = columns.find((c) =>
    c.cards.some((x) => x.id === card.id),
  );
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [assigneeId, setAssigneeId] = useState(card.assigneeId ?? "");
  const [columnId, setColumnId] = useState(currentColumn?.id ?? "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Editar tarjeta</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="k-title" className="text-sm font-medium">
              Título
            </label>
            <Input
              id="k-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="k-desc" className="text-sm font-medium">
              Descripción
            </label>
            <textarea
              id="k-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="k-assignee" className="text-sm font-medium">
                Asignado
              </label>
              <select
                id="k-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Sin asignar</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="k-column" className="text-sm font-medium">
                Columna
              </label>
              <select
                id="k-column"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onDelete}>
            <Trash2 aria-hidden /> Eliminar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={!title.trim()}
              onClick={() =>
                onSave(
                  {
                    title,
                    description,
                    assigneeId: assigneeId || null,
                  },
                  columnId,
                )
              }
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
