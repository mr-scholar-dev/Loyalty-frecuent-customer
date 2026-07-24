"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import type { TeamMember } from "@/lib/loyalty/team";
import { inviteMember, setMemberRole, setMemberStatus } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLE_LABEL: Record<TeamMember["role"], string> = {
  owner: "Propietario",
  manager: "Manager",
  employee: "Empleado",
};

export function TeamManager({
  members,
  isOwner,
}: {
  members: TeamMember[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Invite form
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"manager" | "employee">("employee");
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [tempInfo, setTempInfo] = useState<string | null>(null);

  function invite() {
    setInviteMsg(null);
    setTempInfo(null);
    startTransition(async () => {
      const result = await inviteMember({ email, fullName, role });
      if (!result.ok) {
        setInviteMsg(result.message);
        return;
      }
      setEmail("");
      setFullName("");
      if (result.tempPassword) {
        setTempInfo(
          `Usuario creado. Comparte estas credenciales: ${email || "(correo)"} · contraseña temporal ${result.tempPassword}`,
        );
      } else if (result.existed) {
        setTempInfo("Esa persona ya tenía cuenta; se agregó al equipo.");
      }
      router.refresh();
    });
  }

  function changeRole(userId: string, next: "manager" | "employee") {
    startTransition(async () => {
      await setMemberRole(userId, next);
      router.refresh();
    });
  }

  function toggleStatus(userId: string, current: TeamMember["status"]) {
    startTransition(async () => {
      await setMemberStatus(
        userId,
        current === "active" ? "disabled" : "active",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Miembro</th>
              <th className="px-4 py-2.5 font-medium">Rol</th>
              <th className="px-4 py-2.5 font-medium">Estado</th>
              {isOwner && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m) => {
              const editable = isOwner && !m.isSelf && m.role !== "owner";
              return (
                <tr key={m.userId}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium">
                      {m.fullName}
                      {m.isSelf && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (tú)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    {editable ? (
                      <select
                        value={m.role}
                        onChange={(e) =>
                          changeRole(
                            m.userId,
                            e.target.value as "manager" | "employee",
                          )
                        }
                        disabled={isPending}
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                      >
                        <option value="employee">Empleado</option>
                        <option value="manager">Manager</option>
                      </select>
                    ) : (
                      ROLE_LABEL[m.role]
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        m.status === "active"
                          ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                          : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {m.status === "active"
                        ? "Activo"
                        : m.status === "invited"
                          ? "Invitado"
                          : "Deshabilitado"}
                    </span>
                  </td>
                  {isOwner && (
                    <td className="px-4 py-2.5 text-right">
                      {editable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(m.userId, m.status)}
                          disabled={isPending}
                        >
                          {m.status === "active" ? "Deshabilitar" : "Habilitar"}
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isOwner ? (
        <div className="rounded-lg border p-4">
          <p className="mb-3 font-medium">Invitar miembro</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">Nombre</Label>
              <Input
                id="inv-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre del empleado"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">Correo</Label>
              <Input
                id="inv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="empleado@correo.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-role">Rol</Label>
              <select
                id="inv-role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "manager" | "employee")
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="employee">Empleado</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={invite}
                disabled={isPending || !email || !fullName}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <UserPlus aria-hidden />
                )}
                Invitar
              </Button>
            </div>
          </div>

          {inviteMsg && (
            <p
              role="alert"
              className="mt-3 text-sm font-medium text-destructive"
            >
              {inviteMsg}
            </p>
          )}
          {tempInfo && (
            <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {tempInfo}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Se crea la cuenta con una contraseña temporal que compartes con la
            persona. (El envío de invitaciones por correo llega en el
            endurecimiento.)
          </p>
        </div>
      ) : (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Solo el propietario puede invitar o gestionar miembros.
        </p>
      )}
    </div>
  );
}
