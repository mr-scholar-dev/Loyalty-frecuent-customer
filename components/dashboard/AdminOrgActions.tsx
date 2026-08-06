"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  setOrganizationStatus,
  type SuperadminResult,
} from "@/actions/superadmin";
import { Button } from "@/components/ui/button";

/**
 * Superadmin row controls: activate (mark paid) or suspend an organization.
 * Optimistic-free — waits for the server and refreshes via revalidatePath.
 */
export function AdminOrgActions({
  organizationId,
  status,
}: {
  organizationId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(next: string) {
    setError(null);
    startTransition(async () => {
      const result: SuperadminResult = await setOrganizationStatus(
        organizationId,
        next,
      );
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {isPending && (
        <Loader2
          className="h-4 w-4 animate-spin text-muted-foreground"
          aria-hidden
        />
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
      {status !== "active" ? (
        <Button size="sm" onClick={() => run("active")} disabled={isPending}>
          Activar
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => run("suspended")}
          disabled={isPending}
        >
          Suspender
        </Button>
      )}
    </div>
  );
}
