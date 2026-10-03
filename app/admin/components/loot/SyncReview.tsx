"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CircleCheck, FlaskConical, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { confirmDialog } from "@/components/confirm-dialog";
import { adminJson } from "../../lib/api";
import type { AdminStatus } from "../../types";

interface CleanupResult {
  days: number;
  dryRun: boolean;
  inserted: number;
  deleted: number;
  skipped: number;
}

const PERIODS = [
  { value: "7", label: "Últimos 7 días" },
  { value: "30", label: "Últimos 30 días" },
  { value: "90", label: "Últimos 90 días" },
  { value: "365", label: "Último año" },
];

/**
 * Recalcula el botín por raid a partir de los logs EPGP: une las copias del
 * mismo ítem en varios jefes de ICC, separa las runs de RS y quita entregas
 * anuladas. Primero simula y, si convence, ejecuta. Nunca toca registros manuales.
 */
export default function SyncReview({ onStatus }: { onStatus: (s: AdminStatus) => void }) {
  const queryClient = useQueryClient();
  const [days, setDays] = useState("30");
  const [preview, setPreview] = useState<CleanupResult | null>(null);
  const [running, setRunning] = useState<"dry" | "run" | null>(null);

  const run = async (dryRun: boolean) => {
    if (!dryRun && preview) {
      const ok = await confirmDialog({
        title: "¿Ejecutar la limpieza?",
        description: `Se eliminarán ${preview.deleted} filas sobrantes y se añadirán ${preview.inserted} entregas del periodo elegido. Los registros manuales no se tocan.`,
        confirmLabel: "Ejecutar",
      });
      if (!ok) return;
    }
    setRunning(dryRun ? "dry" : "run");
    try {
      const result = await adminJson<CleanupResult>("/api/admin/raid-items-cleanup", {
        method: "POST",
        body: JSON.stringify({ days: Number(days), dryRun }),
      });
      if (dryRun) {
        setPreview(result);
      } else {
        setPreview(null);
        onStatus({
          type: "success",
          message: "Botín recalculado",
          description: `${result.inserted} añadidas · ${result.deleted} eliminadas · ${result.skipped} omitidas`,
        });
        await adminJson("/api/admin/overview?fresh=1");
        queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
        queryClient.invalidateQueries({ queryKey: ["adminLoot"] });
        queryClient.invalidateQueries({ queryKey: ["adminActivity"] });
        queryClient.invalidateQueries({ queryKey: ["lootMatrix"] });
      }
    } catch (error) {
      onStatus({
        type: "error",
        message: error instanceof Error ? error.message : "No se pudo recalcular el botín",
      });
    } finally {
      setRunning(null);
    }
  };

  const nothingToDo = preview && preview.deleted === 0 && preview.inserted === 0;

  return (
    <Card className="gap-5 p-5">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-semibold">Recalcular el botín por raid</h2>
        <p className="max-w-prose text-sm text-muted-foreground">
          Cada entrega de EPGP se asigna al jefe que se mató justo antes y en el que estaba el
          ganador. Así se unen las copias que aparecían en cada jefe de ICC y cada run de RS queda
          por separado. Los registros manuales nunca se modifican.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cleanup-days">Periodo</Label>
          <Select
            value={days}
            onValueChange={(v) => {
              setDays(v);
              setPreview(null);
            }}
          >
            <SelectTrigger id="cleanup-days" className="h-10! w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="h-10" onClick={() => run(true)} disabled={!!running}>
          {running === "dry" ? <Loader2 className="animate-spin" /> : <FlaskConical />}
          Simular
        </Button>
        <Button
          className="h-10"
          onClick={() => run(false)}
          disabled={!!running || !preview || !!nothingToDo}
        >
          {running === "run" ? <Loader2 className="animate-spin" /> : <Sparkles />}
          Ejecutar limpieza
        </Button>
      </div>

      {preview &&
        (nothingToDo ? (
          <p className="flex items-center gap-2 rounded-lg bg-positive/10 p-3 text-sm">
            <CircleCheck className="size-4 text-positive" /> El botín del periodo ya está bien
            asignado: no hay nada que cambiar.
          </p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <dt className="text-sm text-muted-foreground">Filas sobrantes que se eliminarían</dt>
              <dd className="font-mono text-2xl font-semibold text-negative tabular">
                {preview.deleted}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-sm text-muted-foreground">Entregas que faltan y se añadirían</dt>
              <dd className="font-mono text-2xl font-semibold text-positive tabular">
                {preview.inserted}
              </dd>
            </div>
          </dl>
        ))}
    </Card>
  );
}
