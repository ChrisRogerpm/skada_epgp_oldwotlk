"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleCheck,
  Clock,
  Copy,
  KeyRound,
  Plus,
  RefreshCw,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { confirmDialog } from "@/components/confirm-dialog";
import { BOSSES_TRANSLATIONS } from "@/app/types/RaidLog";
import { timeAgo, useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { isoToDmy } from "@/lib/wow";
import { attentionCount, useAdminOverview } from "../hooks/useAdminOverview";
import { adminJson } from "../lib/api";
import { AdminStatus } from "../types";
import type { AdminSectionId } from "./AdminNav";
import AdminSectionHeader from "./AdminSectionHeader";
import ActivityList, { type ActivityResponse } from "./ActivityList";

const RAID_LABEL: Record<string, string> = { ICC: "ICC", RS: "RS", TOGC: "ToGC" };

interface PanelSectionProps {
  onNavigate: (id: AdminSectionId) => void;
  canSeeUsers: boolean;
  onStatus: (status: AdminStatus) => void;
}

interface AttentionItem {
  key: string;
  icon: LucideIcon;
  tone: "warning" | "info" | "danger";
  title: string;
  detail: string;
  action?: { label: string; onClick: () => void };
}

const TONE: Record<AttentionItem["tone"], string> = {
  warning: "bg-highlight/12 text-highlight",
  info: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
  danger: "bg-negative/12 text-negative",
};

const SHORTCUTS: { key: string; label: string; section: AdminSectionId }[] = [
  { key: "b", label: "Registrar botín", section: "loot" },
  { key: "p", label: "Reglas de puntos", section: "puntos" },
  { key: "l", label: "Nueva regla de loteo", section: "loteo" },
  { key: "g", label: "Marcar Full Gear", section: "fullgeared" },
];

function Stat({
  label,
  value,
  hint,
  tone,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  tone?: "warning";
  loading: boolean;
}) {
  return (
    <Card
      className={cn(
        "gap-1.5 p-4",
        tone === "warning" && "border-highlight/35 bg-highlight/5 dark:bg-highlight/5",
      )}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <span
          className={cn(
            "text-2xl font-semibold tabular",
            tone === "warning" && "text-highlight",
          )}
        >
          {value}
        </span>
      )}
      <span className="text-sm text-muted-foreground">{hint}</span>
    </Card>
  );
}

/** Pantalla de inicio del admin: resumen de la semana y lo que hay que revisar. */
export default function PanelSection({ onNavigate, canSeeUsers, onStatus }: PanelSectionProps) {
  const now = useNow();
  const queryClient = useQueryClient();
  const { data: overview, isLoading, isFetching, refetch } = useAdminOverview();
  const activity = useQuery({
    queryKey: ["adminActivity", "recent"],
    queryFn: () => adminJson<ActivityResponse>("/api/admin/activity?limit=8"),
  });

  // Atajos de teclado de los accesos rápidos (solo fuera de campos de texto).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      const shortcut = SHORTCUTS.find((s) => s.key === e.key.toLowerCase());
      if (shortcut) {
        e.preventDefault();
        onNavigate(shortcut.section);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNavigate]);

  const revokeToken = async (id: string, name: string) => {
    const ok = await confirmDialog({
      title: `¿Revocar el token «${name}»?`,
      description: "ScriptSkada dejará de poder sincronizar con él. No se puede deshacer.",
      confirmLabel: "Revocar",
      destructive: true,
    });
    if (!ok) return;
    try {
      await adminJson(`/api/admin/sync-tokens?id=${id}`, { method: "DELETE" });
      onStatus({ type: "success", message: `Token «${name}» revocado` });
      await adminJson("/api/admin/overview?fresh=1");
      queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
      queryClient.invalidateQueries({ queryKey: ["adminActivity"] });
    } catch (error) {
      onStatus({
        type: "error",
        message: error instanceof Error ? error.message : "No se pudo revocar el token",
      });
    }
  };

  const a = overview?.attention;
  const attention: AttentionItem[] = [];
  if (a?.duplicates) {
    attention.push({
      key: "dup",
      icon: Copy,
      tone: "warning",
      title: `${a.duplicates} ${a.duplicates === 1 ? "entrega sobra" : "entregas sobran"} en el botín de los últimos 7 días`,
      detail: "Copias del mismo ítem en varios jefes o entregas anuladas en EPGP.",
      action: { label: "Revisar y limpiar", onClick: () => onNavigate("loot") },
    });
  }
  if (a?.missing) {
    attention.push({
      key: "missing",
      icon: Clock,
      tone: "info",
      title: `${a.missing} ${a.missing === 1 ? "entrega de EPGP no está" : "entregas de EPGP no están"} en el botín`,
      detail: "Se añadirán en el próximo sync o al ejecutar la limpieza.",
      action: { label: "Revisar", onClick: () => onNavigate("loot") },
    });
  }
  for (const r of a?.itemsWithoutRule ?? []) {
    attention.push({
      key: `rule-${r.raid}`,
      icon: ScrollText,
      tone: "warning",
      title: `${r.count} ${r.count === 1 ? "ítem" : "ítems"} de ${RAID_LABEL[r.raid] ?? r.raid} sin regla de loteo`,
      detail: "Se pueden entregar sin un mínimo de puntos que validar.",
      action: { label: "Crear reglas", onClick: () => onNavigate("loteo") },
    });
  }
  if (a?.staleFullGear) {
    attention.push({
      key: "fg",
      icon: Clock,
      tone: "info",
      title: `${a.staleFullGear} ${a.staleFullGear === 1 ? "personaje Full Gear" : "personajes Full Gear"} sin revisar hace más de 30 días`,
      detail: "Su GearScore puede estar desactualizado.",
      action: { label: "Actualizar", onClick: () => onNavigate("fullgeared") },
    });
  }
  for (const t of a?.idleTokens ?? []) {
    attention.push({
      key: `token-${t.id}`,
      icon: KeyRound,
      tone: "danger",
      title: `El token «${t.name}» sigue activo sin usarse`,
      detail: t.lastUsedAt
        ? `Último uso ${timeAgo(new Date(t.lastUsedAt).getTime(), now)}.`
        : "Nunca se ha usado.",
      action: canSeeUsers
        ? { label: "Revocar", onClick: () => revokeToken(t.id, t.name) }
        : undefined,
    });
  }
  const pending = attentionCount(overview);

  return (
    <>
      <AdminSectionHeader
        group="General"
        title="Panel de oficiales"
        description="Lo que necesita tu atención antes y después de cada raid."
        actions={
          <>
            <Button
              variant="outline"
              onClick={async () => {
                await adminJson("/api/admin/overview?fresh=1");
                refetch();
                activity.refetch();
              }}
              disabled={isFetching}
            >
              <RefreshCw className={cn(isFetching && "animate-spin")} /> Actualizar
            </Button>
            <Button onClick={() => onNavigate("loot")}>
              <Plus /> Registrar botín
            </Button>
          </>
        }
      />

      <section aria-label="Resumen" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Último sync"
          loading={isLoading}
          value={
            overview?.lastSync ? timeAgo(new Date(overview.lastSync.at).getTime(), now) : "—"
          }
          hint={overview?.lastSync ? `Token «${overview.lastSync.tokenName}»` : "Sin envíos"}
        />
        <Stat
          label="Raids esta semana"
          loading={isLoading}
          value={overview?.week.sessions ?? 0}
          hint={
            overview?.week.byRaid.length
              ? overview.week.byRaid.map((r) => `${r.short} ×${r.count}`).join(" · ")
              : "Sin raids registradas"
          }
        />
        <Stat
          label="Entregas (7 días)"
          loading={isLoading}
          value={(overview?.week.lootSync ?? 0) + (overview?.week.lootManual ?? 0)}
          hint={`${overview?.week.lootSync ?? 0} del sync · ${overview?.week.lootManual ?? 0} manuales`}
        />
        <Stat
          label="Por revisar"
          loading={isLoading}
          tone={pending ? "warning" : undefined}
          value={pending}
          hint={pending ? "avisos abajo" : "todo en orden"}
        />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="gap-0 py-0">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="font-semibold">Necesita atención</h2>
            <span className="text-sm text-muted-foreground">Se resuelve desde aquí</span>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : attention.length === 0 ? (
            <div className="flex items-center gap-3 border-t px-4 py-6 text-sm text-muted-foreground">
              <CircleCheck className="size-5 text-positive" />
              Todo en orden: no hay nada pendiente de revisar.
            </div>
          ) : (
            <ul className="px-2 pb-2">
              {attention.map((item) => (
                <li
                  key={item.key}
                  className="flex flex-wrap items-center gap-3 border-t px-2 py-3 first:border-t"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      TONE[item.tone],
                    )}
                  >
                    <item.icon className="size-4" />
                  </span>
                  <div className="flex min-w-56 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-sm text-muted-foreground">{item.detail}</span>
                  </div>
                  {item.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={item.action.onClick}
                      className={cn(
                        item.tone === "danger" &&
                          "border-negative/40 text-negative hover:text-negative",
                      )}
                    >
                      {item.action.label}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="gap-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Última noche de raid</h2>
              {overview?.lastNight && (
                <span className="text-sm text-muted-foreground">
                  {isoToDmy(overview.lastNight.date)}
                </span>
              )}
            </div>
            {isLoading ? (
              <Skeleton className="h-20" />
            ) : overview?.lastNight ? (
              <ul className="flex flex-col gap-2">
                {overview.lastNight.sessions.map((s) => (
                  <li key={`${s.label}-${s.start}`} className="flex items-center gap-2.5 text-sm">
                    <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs whitespace-nowrap">
                      {s.label}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {s.start} · {BOSSES_TRANSLATIONS[s.lastBoss] ?? s.lastBoss}
                    </span>
                    <span className="font-mono tabular">
                      {s.items} {s.items === 1 ? "ítem" : "ítems"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin raids en los últimos 7 días.</p>
            )}
            <Button
              variant="link"
              className="h-auto self-start p-0"
              onClick={() => onNavigate("loot")}
            >
              Ver el botín →
            </Button>
          </Card>

          <Card className="gap-3 p-4">
            <h2 className="font-semibold">Accesos rápidos</h2>
            <div className="grid grid-cols-2 gap-2">
              {SHORTCUTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onNavigate(s.section)}
                  className="flex min-h-16 flex-col justify-between gap-1.5 rounded-lg bg-secondary/60 p-3 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <Kbd>{s.key.toUpperCase()}</Kbd>
                  {s.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="gap-0 py-0">
        <div className="flex items-center justify-between gap-2 p-4">
          <h2 className="font-semibold">Actividad de oficiales</h2>
          {canSeeUsers && (
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={() => onNavigate("usuarios")}
            >
              Ver todo el registro →
            </Button>
          )}
        </div>
        <ActivityList data={activity.data} loading={activity.isLoading} compact />
      </Card>
    </>
  );
}
