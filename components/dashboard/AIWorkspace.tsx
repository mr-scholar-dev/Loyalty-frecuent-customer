"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Copy,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { AtRiskCustomer } from "@/lib/ai/insights";
import type { DashboardCounts } from "@/lib/ai/insights";
import {
  askAssistant,
  draftReactivationMessage,
  generateSummary,
} from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "¿Cómo va el negocio este mes?",
  "¿Qué clientes están por dejar de venir?",
  "Crea una tarea: revisar la bomba de agua, en Por hacer.",
  "Agenda seguimiento a los clientes en riesgo y asígnalo a Carlos.",
];

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Turn a normalized CR phone into a wa.me link (best effort). */
function waLink(phone: string | null, text: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 8) digits = `506${digits}`;
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function AIWorkspace({
  configured,
  counts,
  atRisk,
}: {
  configured: boolean;
  counts: DashboardCounts;
  atRisk: AtRiskCustomer[];
}) {
  if (!configured) return <NotConfigured />;

  return (
    <div className="space-y-6">
      <CountsRow counts={counts} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Assistant />
          <SummaryCard />
        </div>
        <AtRiskCard atRisk={atRisk} />
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="flex items-start gap-3 py-6">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-amber-900">IA no configurada</p>
          <p className="text-amber-800">
            Agrega{" "}
            <code className="rounded bg-amber-100 px-1 font-mono">
              OPENROUTER_API_KEY
            </code>{" "}
            (y opcionalmente{" "}
            <code className="rounded bg-amber-100 px-1 font-mono">
              OPENROUTER_MODEL
            </code>
            ) en el servidor y reinicia. Con la API compatible de OpenRouter
            puedes usar Claude, GPT, Llama y más sin cambiar código.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CountsRow({ counts }: { counts: DashboardCounts }) {
  const items = [
    { label: "Clientes", value: counts.totalCustomers },
    { label: "Lavados este mes", value: counts.washesThisMonth },
    { label: "Premios pendientes", value: counts.rewardsPending },
    { label: "En riesgo", value: counts.atRisk },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl border bg-card p-4">
          <p className="font-mono text-2xl font-bold">{i.value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{i.label}</p>
        </div>
      ))}
    </div>
  );
}

function Assistant() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function ask(question: string) {
    const q = question.trim();
    if (!q || isPending) return;
    setError(null);
    setInput("");
    setTurns((t) => [...t, { role: "user", content: q }]);
    startTransition(async () => {
      const res = await askAssistant(q);
      if (res.ok) {
        setTurns((t) => [...t, { role: "assistant", content: res.text }]);
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          Copiloto — pregunta o pide acciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {turns.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <div className="max-h-[22rem] space-y-3 overflow-y-auto pr-1">
            {turns.map((t, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  t.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm",
                    t.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border bg-muted/40",
                  )}
                >
                  {t.content}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Pensando…
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre tu negocio…"
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isPending}
          />
          <Button type="submit" size="icon" disabled={isPending || !input.trim()}>
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SummaryCard() {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await generateSummary();
      if (res.ok) setText(res.text);
      else setError(res.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
          Resumen inteligente del mes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {text && (
          <div className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-3.5 text-sm">
            {text}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button variant="outline" onClick={run} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Generando…
            </>
          ) : text ? (
            "Regenerar resumen"
          ) : (
            "Generar resumen del mes"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function AtRiskCard({ atRisk }: { atRisk: AtRiskCustomer[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
          Clientes en riesgo
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
            {atRisk.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {atRisk.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            🎉 Ningún cliente activo lleva más de 30 días sin volver.
          </p>
        ) : (
          <ul className="divide-y">
            {atRisk.map((c) => (
              <AtRiskRow key={c.membershipId} customer={c} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AtRiskRow({ customer }: { customer: AtRiskCustomer }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function generate() {
    setError(null);
    startTransition(async () => {
      const res = await draftReactivationMessage(customer.membershipId);
      if (res.ok) setMsg(res.text);
      else setError(res.message);
    });
  }

  async function copy() {
    if (!msg) return;
    await navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const link = msg ? waLink(customer.phone, msg) : null;

  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{customer.name}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {customer.licensePlate} · {customer.daysSinceLast} días ·{" "}
            {customer.current}/{customer.required}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={generate}
          disabled={isPending}
          className="shrink-0"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden /> Mensaje
            </>
          )}
        </Button>
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      {msg && (
        <div className="mt-2 space-y-2 rounded-lg border bg-muted/40 p-3">
          <p className="whitespace-pre-wrap text-sm">{msg}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copy}>
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {copied ? "Copiado" : "Copiar"}
            </Button>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
