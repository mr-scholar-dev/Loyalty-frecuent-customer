"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  type: "customers" | "visits";
  label: string;
}

/** Triggers a CSV download from the export route handler. */
export function ExportButton({ type, label }: ExportButtonProps) {
  return (
    <Button
      className="w-full"
      onClick={() => {
        window.location.href = `/api/export?type=${type}`;
      }}
    >
      <Download aria-hidden /> {label}
    </Button>
  );
}
