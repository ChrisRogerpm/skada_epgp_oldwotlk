"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Coins, Gem, Skull } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import { ItemDescription, isLootEntry } from "@/components/epgp/item-description";
import type { RosterMember } from "@/hooks/use-roster";
import { cn } from "@/lib/utils";
import { formatPoints, formatSigned, getClassMeta, refreshWowheadLinks } from "@/lib/wow";
import { pointsSeries } from "@/lib/epgp";

interface Transaction {
  personaje: string;
  valor: number;
  descripcion: string;
  fecha: string; // dd/mm/yyyy
  hour: string; // hh:mm:ss
}

type Filter = "all" | "plus" | "minus" | "loot";

const MAX_VISIBLE = 150;

function toDate(fecha: string, hour: string) {
  const [d, m, y] = fecha.split("/").map(Number);
  const [h = 0, mi = 0, s = 0] = (hour || "").split(":").map(Number);
  return new Date(y, m - 1, d, h, mi, s);
}

interface CharacterHistorySheetProps {
  member: RosterMember | null;
  rank?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Bitácora EPGP del main y sus alters en un panel lateral. */
export function CharacterHistorySheet({
  member,
  rank,
  open,
  onOpenChange,
}: CharacterHistorySheetProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [now] = useState(() => Date.now());
  const names = member ? [member.main, ...(member.alters ?? []).map((a) => a.name)] : [];
  const namesQuery = names.join(",");

  const { data: history = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["epgpHistory", namesQuery],
    queryFn: async () => {
      const res = await fetch(`/api/epgp/history?names=${encodeURIComponent(namesQuery)}`);
      if (!res.ok) throw new Error("Error al obtener el historial");
      return res.json();
    },
    enabled: open && !!member,
  });

  const chronological = useMemo(
    () =>
      [...history].sort(
        (a, b) => toDate(a.fecha, a.hour).getTime() - toDate(b.fecha, b.hour).getTime(),
      ),
    [history],
  );

  // Saldo real de los últimos 30 días, reconstruido hacia atrás desde los puntos actuales.
  const chart = useMemo(
    () =>
      pointsSeries(history, member?.amount ?? 0, 30, now).map((p) => ({
        date: new Date(p.t).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }),
        pts: p.pts,
      })),
    [history, member?.amount, now],
  );

  const last30 = useMemo(() => {
    const since = now - 30 * 24 * 3600 * 1000;
    const recent = chronological.filter((t) => toDate(t.fecha, t.hour).getTime() >= since);
    return {
      gained: recent.filter((t) => t.valor > 0).reduce((s, t) => s + t.valor, 0),
      spent: recent.filter((t) => t.valor < 0).reduce((s, t) => s + t.valor, 0),
    };
  }, [chronological, now]);

  const days = useMemo(() => {
    const list = [...chronological]
      .reverse()
      .filter((t) =>
        filter === "all"
          ? true
          : filter === "loot"
            ? isLootEntry(t.descripcion)
            : filter === "plus"
              ? t.valor > 0
              : t.valor < 0 && !isLootEntry(t.descripcion),
      )
      .slice(0, MAX_VISIBLE);
    const groups: { fecha: string; label: string; net: number; items: Transaction[] }[] = [];
    list.forEach((t) => {
      let g = groups[groups.length - 1];
      if (!g || g.fecha !== t.fecha) {
        g = {
          fecha: t.fecha,
          label: format(toDate(t.fecha, "0:0:0"), "EEEE d 'de' MMMM", { locale: es }),
          net: 0,
          items: [],
        };
        groups.push(g);
      }
      g.items.push(t);
      g.net += t.valor;
    });
    return groups;
  }, [chronological, filter]);

  useEffect(() => {
    if (open && history.length) refreshWowheadLinks();
  }, [open, history, filter]);

  const meta = getClassMeta(member?.class);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="gap-4 border-b p-5">
          <div className="flex items-center gap-3 pr-8">
            <ClassIcon cls={member?.class} src={member?.icon} size={44} />
            <div className="min-w-0">
              <SheetTitle className="truncate text-lg">
                <CharacterName cls={member?.class} className="font-semibold">
                  {member?.main}
                </CharacterName>
              </SheetTitle>
              <SheetDescription className="truncate">
                {[
                  meta?.name,
                  member?.alters?.length
                    ? member.alters
                        .map((a) => `${a.name} (${getClassMeta(a.class)?.short ?? a.class})`)
                        .join(", ")
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Bitácora EPGP"}
              </SheetDescription>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat
              label="Puntos"
              value={member ? formatPoints(member.amount) : "—"}
              hint={rank ? `#${rank}` : undefined}
            />
            <Stat label="Ganados 30 d" value={formatSigned(last30.gained)} tone="positive" />
            <Stat label="Gastados 30 d" value={formatSigned(last30.spent)} tone="negative" />
          </div>
          {chart.length > 2 && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Evolución · 30 días</span>
                <span className="font-mono tabular">
                  {formatPoints(chart[0].pts)} → {formatPoints(chart[chart.length - 1].pts)}
                </span>
              </div>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="ptsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Tooltip
                      cursor={{ stroke: "var(--border)" }}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "var(--muted-foreground)" }}
                      formatter={(v) => [formatPoints(Number(v)), "Puntos"]}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="pts"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#ptsFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(v) => v && setFilter(v as Filter)}
            variant="outline"
            size="sm"
            className="justify-start gap-1.5"
          >
            <ToggleGroupItem
              value="all"
              className="rounded-full! border! px-3 data-[state=on]:bg-secondary"
            >
              Todo
            </ToggleGroupItem>
            <ToggleGroupItem
              value="plus"
              className="rounded-full! border! px-3 data-[state=on]:bg-secondary"
            >
              Beneficios
            </ToggleGroupItem>
            <ToggleGroupItem
              value="minus"
              className="rounded-full! border! px-3 data-[state=on]:bg-secondary"
            >
              Perjuicios
            </ToggleGroupItem>
            <ToggleGroupItem
              value="loot"
              className="rounded-full! border! px-3 data-[state=on]:bg-secondary"
            >
              Botín
            </ToggleGroupItem>
          </ToggleGroup>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-5 pb-6">
            {isLoading ? (
              <div className="space-y-3 pt-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : days.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyTitle>Sin movimientos</EmptyTitle>
                  <EmptyDescription>No hay registros para este filtro.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              days.map((day) => (
                <section key={day.fecha}>
                  <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 py-2.5 text-xs font-medium text-muted-foreground backdrop-blur">
                    <span className="first-letter:uppercase">{day.label}</span>
                    <span
                      className={cn(
                        "tabular font-mono",
                        day.net >= 0 ? "text-positive" : "text-negative",
                      )}
                    >
                      {formatSigned(day.net)}
                    </span>
                  </div>
                  <ul className="divide-y">
                    {day.items.map((t, i) => {
                      const loot = isLootEntry(t.descripcion);
                      const Icon = loot ? Gem : t.valor >= 0 ? Coins : Skull;
                      const kind = loot ? "Botín" : t.valor >= 0 ? "Beneficio" : "Perjuicio";
                      return (
                        <li key={`${t.hour}-${i}`} className="flex items-center gap-3 py-2.5">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-md ring-[1.5px] ring-inset",
                              loot
                                ? "bg-purple-500/10 text-purple-600 ring-purple-500 dark:text-purple-400"
                                : t.valor >= 0
                                  ? "bg-positive/10 text-positive ring-positive"
                                  : "bg-negative/10 text-negative ring-negative",
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug">
                              <ItemDescription text={t.descripcion} />
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {kind} · {t.hour.slice(0, 5)}
                              {t.personaje !== member?.main && <> · {t.personaje}</>}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "tabular font-mono text-sm font-semibold",
                              t.valor >= 0 ? "text-positive" : "text-negative",
                            )}
                          >
                            {formatSigned(t.valor)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
            {history.length > MAX_VISIBLE && (
              <p className="pt-4 text-center text-xs text-muted-foreground">
                Mostrando los últimos {MAX_VISIBLE} de {history.length} movimientos.
              </p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="rounded-lg border p-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "tabular font-mono text-base font-semibold",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
        )}
      >
        {value}
        {hint && <span className="ml-1 text-xs font-normal text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
