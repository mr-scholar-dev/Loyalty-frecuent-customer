"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createBranch, setBranchStatus } from "@/actions/org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface BranchItem {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
}

export function BranchManager({ branches }: { branches: BranchItem[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function add() {
    setMessage(null);
    startTransition(async () => {
      const result = await createBranch({ name, code });
      if (result.ok) {
        setName("");
        setCode("");
        router.refresh();
      } else {
        setMessage(result.message);
      }
    });
  }

  function toggle(id: string, current: "active" | "inactive") {
    startTransition(async () => {
      await setBranchStatus(id, current === "active" ? "inactive" : "active");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Sucursal</th>
              <th className="px-4 py-2.5 font-medium">Código</th>
              <th className="px-4 py-2.5 font-medium">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {branches.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-2.5 font-medium">{b.name}</td>
                <td className="px-4 py-2.5">{b.code}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      b.status === "active"
                        ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                        : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {b.status === "active" ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggle(b.id, b.status)}
                    disabled={isPending}
                  >
                    {b.status === "active" ? "Desactivar" : "Activar"}
                  </Button>
                </td>
              </tr>
            ))}
            {branches.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Aún no hay sucursales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border p-4">
        <p className="mb-3 font-medium">Nueva sucursal</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="branch-name">Nombre</Label>
            <Input
              id="branch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sucursal Norte"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branch-code">Código</Label>
            <Input
              id="branch-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="NORTE"
              className="uppercase"
            />
          </div>
          <Button onClick={add} disabled={isPending || !name || !code}>
            {isPending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Plus aria-hidden />
            )}
            Agregar
          </Button>
        </div>
        {message && (
          <p role="alert" className="mt-2 text-sm font-medium text-destructive">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
