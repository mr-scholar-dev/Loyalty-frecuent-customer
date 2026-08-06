"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { CalendarDays, Plus, Search, Trash2, X } from "lucide-react";
import type {
  KanbanBoardView,
  KanbanCard,
  KanbanColumn,
  KanbanMember,
  KanbanPriority,
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

const PRIORITY_META: Record<
  KanbanPriority,
  { label: string; chip: string; dot: string }
> = {
  low: {
    label: "Baja",
    chip: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  medium: {
    label: "Media",
    chip: "bg-info/10 text-info",
    dot: "bg-info",
  },
  high: {
    label: "Alta",
    chip: "bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  urgent: {
    label: "Urgente",
    chip: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

const PRIORITY_ORDER: KanbanPriority[] = ["urgent", "high", "medium", "low"];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Today at local midnight — the reference for "overdue". */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Parse a yyyy-mm-dd date as local, not UTC — `new Date("2026-08-06")` is
 * midnight UTC, which lands on the previous day west of Greenwich. */
function parseDueDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function dueLabel(iso: string): { text: string; overdue: boolean } | null {
  const date = parseDueDate(iso);
  if (!date) return null;
  const today = startOfToday();
  const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { text: `Vencida hace ${-days}d`, overdue: true };
  if (days === 0) return { text: "Hoy", overdue: true };
  if (days === 1) return { text: "Mañana", overdue: false };
  if (days <= 7) return { text: `En ${days} días`, overdue: false };
  return {
    text: date.toLocaleDateString("es-CR", { day: "numeric", month: "short" }),
    overdue: false,
  };
}

export function KanbanBoard({ board }: { board: KanbanBoardView }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const [columns, setColumns] = useState<KanbanColumn[]>(board.columns);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newColumn, setNewColumn] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [editing, setEditing] = useState<KanbanCard | null>(null);
  const [query, setQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Re-sync with server truth after each refresh.
  useEffect(() => {
    setColumns(board.columns);
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const filtersActive = Boolean(query || assigneeFilter || priorityFilter);

  const visibleColumns = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return columns.map((col) => ({
      ...col,
      // Keep the true count for the header; filtering only hides cards.
      total: col.cards.length,
      cards: col.cards.filter((card) => {
        if (needle) {
          const haystack = `${card.title} ${card.description ?? ""} ${
            card.assigneeName ?? ""
          }`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        if (assigneeFilter && card.assigneeId !== assigneeFilter) return false;
        if (priorityFilter && card.priority !== priorityFilter) return false;
        return true;
      }),
    }));
  }, [columns, query, assigneeFilter, priorityFilter]);

  const overdueCount = useMemo(() => {
    const today = startOfToday();
    return columns
      .flatMap((c) => c.cards)
      .filter((card) => {
        if (!card.dueDate) return false;
        const d = parseDueDate(card.dueDate);
        return d !== null && d.getTime() <= today.getTime();
      }).length;
  }, [columns]);

  function run(fn: () => Promise<unknown>, successMessage?: string) {
    startTransition(async () => {
      await fn();
      router.refresh();
      if (successMessage) toast.success(successMessage);
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
    const target = columns.find((c) => c.id === toColumnId);
    // Optimistic move.
    setColumns((cols) =>
      cols.map((c) => {
        if (c.id === from.id)
          return { ...c, cards: c.cards.filter((x) => x.id !== cardId) };
        if (c.id === toColumnId) return { ...c, cards: [...c.cards, card] };
        return c;
      }),
    );
    run(
      () => moveCard(cardId, toColumnId),
      target ? `"${card.title}" → ${target.name}` : undefined,
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tareas…"
            aria-label="Buscar tareas"
            className="h-9 pl-9"
          />
        </div>

        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          aria-label="Filtrar por responsable"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Todos los responsables</option>
          {board.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          aria-label="Filtrar por prioridad"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">Toda prioridad</option>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_META[p].label}
            </option>
          ))}
        </select>

        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setAssigneeFilter("");
              setPriorityFilter("");
            }}
          >
            <X aria-hidden /> Limpiar
          </Button>
        )}

        {overdueCount > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {overdueCount} vencida{overdueCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {visibleColumns.map((col) => (
            <Column
              key={col.id}
              column={col}
              total={col.total}
              filtered={filtersActive}
              disabled={isPending}
              reduceMotion={Boolean(reduceMotion)}
              draft={drafts[col.id] ?? ""}
              onDraft={(v) => setDrafts((d) => ({ ...d, [col.id]: v }))}
              onSubmitCard={() => submitCard(col.id)}
              onDeleteColumn={() =>
                run(
                  () => deleteColumn(col.id),
                  `Columna "${col.name}" eliminada`,
                )
              }
              onOpenCard={setEditing}
            />
          ))}

          <div className="w-72 shrink-0">
            {addingColumn ? (
              <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
                <Input
                  autoFocus
                  value={newColumn}
                  onChange={(e) => setNewColumn(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setAddingColumn(false);
                      setNewColumn("");
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
                      run(
                        () => addColumn(board.boardId, name),
                        `Columna "${name}" creada`,
                      );
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
                className="flex w-full items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
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
            }, "Tarea actualizada");
          }}
          onDelete={() => {
            const card = editing;
            setEditing(null);
            run(() => deleteCard(card.id), `"${card.title}" eliminada`);
          }}
        />
      )}
    </>
  );
}

function Column({
  column,
  total,
  filtered,
  disabled,
  reduceMotion,
  draft,
  onDraft,
  onSubmitCard,
  onDeleteColumn,
  onOpenCard,
}: {
  column: KanbanColumn;
  total: number;
  filtered: boolean;
  disabled: boolean;
  reduceMotion: boolean;
  draft: string;
  onDraft: (v: string) => void;
  onSubmitCard: () => void;
  onDeleteColumn: () => void;
  onOpenCard: (c: KanbanCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const hidden = total - column.cards.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30 transition-all",
        isOver && "border-primary/40 bg-primary/[0.06] ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold">{column.name}</span>
          <span className="shrink-0 rounded-full bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {filtered ? `${column.cards.length}/${total}` : total}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Eliminar columna ${column.name}`}
          onClick={onDeleteColumn}
          disabled={disabled}
          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex-1 space-y-2 px-3">
        {column.cards.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            reduceMotion={reduceMotion}
            onOpen={onOpenCard}
          />
        ))}

        {column.cards.length === 0 && (
          <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            {hidden > 0
              ? `${hidden} tarea(s) oculta(s) por los filtros`
              : "Sin tareas"}
          </p>
        )}
      </div>

      <div className="p-3">
        <Input
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmitCard();
          }}
          placeholder="+ Añadir tarjeta"
          aria-label={`Añadir tarjeta a ${column.name}`}
          className="h-9 bg-background text-sm"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function DraggableCard({
  card,
  reduceMotion,
  onOpen,
}: {
  card: KanbanCard;
  reduceMotion: boolean;
  onOpen: (c: KanbanCard) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: card.id });
  const priority = card.priority ? PRIORITY_META[card.priority] : null;
  const due = card.dueDate ? dueLabel(card.dueDate) : null;

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(card)}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={
        transform
          ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
          : undefined
      }
      className={cn(
        "group relative cursor-grab touch-none overflow-hidden rounded-lg border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "shadow-lg",
      )}
    >
      {priority && (
        <span
          aria-hidden
          className={cn("absolute inset-y-0 left-0 w-1", priority.dot)}
        />
      )}
      <div className={cn(priority && "pl-1.5")}>
        <p className="text-sm font-medium">{card.title}</p>
        {card.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {card.description}
          </p>
        )}

        {(priority || due) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {priority && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  priority.chip,
                )}
              >
                {priority.label}
              </span>
            )}
            {due && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  due.overdue
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <CalendarDays className="h-3 w-3" aria-hidden />
                {due.text}
              </span>
            )}
          </div>
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
    </motion.div>
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
    patch: {
      title: string;
      description: string;
      assigneeId: string | null;
      priority: KanbanPriority | null;
      dueDate: string | null;
    },
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
  const [priority, setPriority] = useState<string>(card.priority ?? "");
  const [dueDate, setDueDate] = useState(card.dueDate ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Editar tarjeta"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl"
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
            <div className="space-y-1.5">
              <label htmlFor="k-priority" className="text-sm font-medium">
                Prioridad
              </label>
              <select
                id="k-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Sin prioridad</option>
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="k-due" className="text-sm font-medium">
                Fecha límite
              </label>
              <Input
                id="k-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">¿Seguro?</span>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Sí, eliminar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 aria-hidden /> Eliminar
            </Button>
          )}

          {!confirmDelete && (
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
                      priority: (priority || null) as KanbanPriority | null,
                      dueDate: dueDate || null,
                    },
                    columnId,
                  )
                }
              >
                Guardar
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
