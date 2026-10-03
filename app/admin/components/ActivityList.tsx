"use client";

import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { timeAgo, useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

export interface ActivityEntry {
  id: number;
  created_at: string;
  actor: string;
  action: string;
  summary: string;
}

export interface ActivityResponse {
  data: ActivityEntry[];
  available: boolean;
}

const KIND: { prefix: string; label: string; className: string }[] = [
  { prefix: "loot.cleanup", label: "Limpieza", className: "bg-highlight/14 text-highlight" },
  { prefix: "loot.", label: "Botín", className: "bg-positive/14 text-positive" },
  { prefix: "sync.", label: "Sync", className: "bg-blue-500/14 text-blue-600 dark:text-blue-300" },
  { prefix: "rule.", label: "Regla", className: "bg-highlight/14 text-highlight" },
  { prefix: "fullgear.", label: "Full Gear", className: "bg-secondary text-foreground" },
  { prefix: "token.", label: "Token", className: "bg-negative/14 text-negative" },
  { prefix: "user.", label: "Usuario", className: "bg-secondary text-foreground" },
];

export const ACTIVITY_TYPES = [
  { value: "loot.", label: "Botín" },
  { value: "rule.", label: "Reglas" },
  { value: "fullgear.", label: "Full Gear" },
  { value: "token.", label: "Tokens" },
  { value: "user.", label: "Usuarios" },
  { value: "sync.", label: "Sync" },
];

/** Email → nombre corto del oficial; las acciones automáticas aparecen como «Sync». */
export function actorName(actor: string) {
  return actor.includes("@") ? actor.split("@")[0] : actor;
}

function formatWhen(iso: string, now: number) {
  const date = new Date(iso);
  if (now - date.getTime() < 20 * 3600 * 1000) return timeAgo(date.getTime(), now);
  return date.toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Lista del registro de actividad (compacta en el Panel, completa en Usuarios y accesos). */
export default function ActivityList({
  data,
  loading,
  compact,
}: {
  data: ActivityResponse | undefined;
  loading: boolean;
  compact?: boolean;
}) {
  const now = useNow();

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4 pt-0">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    );
  }

  if (data && !data.available) {
    return (
      <Empty className="border-t py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <History />
          </EmptyMedia>
          <EmptyTitle>El registro de actividad aún no está activo</EmptyTitle>
          <EmptyDescription>
            Ejecuta <code className="font-mono">supabase_admin_activity_migration.sql</code> en
            Supabase para empezar a guardar quién hace cada cambio.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!data?.data.length) {
    return (
      <p className="border-t px-4 py-6 text-sm text-muted-foreground">
        Todavía no hay actividad registrada.
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-col", compact && "pb-2")}>
      {data.data.map((entry) => {
        const kind = KIND.find((k) => entry.action.startsWith(k.prefix));
        return (
          <li
            key={entry.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-3 text-sm"
          >
            <span className="w-28 shrink-0 text-muted-foreground tabular">
              {formatWhen(entry.created_at, now)}
            </span>
            <span className="w-28 shrink-0 truncate font-medium" title={entry.actor}>
              {actorName(entry.actor)}
            </span>
            {kind && (
              <Badge variant="secondary" className={cn("border-0", kind.className)}>
                {kind.label}
              </Badge>
            )}
            <span className="min-w-48 flex-1">{entry.summary}</span>
          </li>
        );
      })}
    </ul>
  );
}
