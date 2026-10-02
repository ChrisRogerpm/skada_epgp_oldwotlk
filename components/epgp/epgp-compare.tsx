"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useQueries } from "@tanstack/react-query";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import type { RosterMember } from "@/hooks/use-roster";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { EpgpMovement, movementTime, pointsSeries } from "@/lib/epgp";
import { formatPoints, formatSigned, getClassMeta } from "@/lib/wow";

const MAX = 4;
const DAYS = 30;

interface EpgpCompareProps {
  roster: RosterMember[];
  rankOf: Map<string, number>;
  selected: string[];
  onChange: (mains: string[]) => void;
}

/** Compara la evolución de puntos de hasta 4 mains en los últimos 30 días. */
export function EpgpCompare({ roster, rankOf, selected, onChange }: EpgpCompareProps) {
  const [open, setOpen] = useState(false);
  const now = useNow();
  const { resolvedTheme } = useTheme();
  const members = selected
    .map((n) => roster.find((m) => m.main === n))
    .filter(Boolean) as RosterMember[];

  const histories = useQueries({
    queries: members.map((m) => {
      const names = [m.main, ...(m.alters ?? []).map((a) => a.name)].join(",");
      return {
        queryKey: ["epgpHistory", names],
        queryFn: async (): Promise<EpgpMovement[]> => {
          const res = await fetch(`/api/epgp/history?names=${encodeURIComponent(names)}`);
          if (!res.ok) throw new Error("Error al obtener el historial");
          return res.json();
        },
      };
    }),
  });

  const stats = members.map((m, i) => {
    const history = histories[i]?.data ?? [];
    const since = now - DAYS * 24 * 3600 * 1000;
    const recent = history.filter((t) => movementTime(t) >= since);
    return {
      member: m,
      loading: histories[i]?.isLoading,
      gained: recent.filter((t) => t.valor > 0).reduce((s, t) => s + t.valor, 0),
      spent: recent.filter((t) => t.valor < 0).reduce((s, t) => s + t.valor, 0),
      series: pointsSeries(history, m.amount, DAYS, now),
    };
  });

  const chart = buildChart(stats, now);

  const toggle = (main: string) =>
    onChange(
      selected.includes(main)
        ? selected.filter((n) => n !== main)
        : [...selected, main].slice(0, MAX),
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {members.map((m) => (
          <span
            key={m.main}
            className="flex h-9 items-center gap-2 rounded-md border bg-card pr-1 pl-1.5"
          >
            <ClassIcon cls={m.class} src={m.icon} size={24} />
            <CharacterName cls={m.class} className="text-sm font-semibold">
              {m.main}
            </CharacterName>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => toggle(m.main)}
              aria-label={`Quitar a ${m.main}`}
            >
              <X />
            </Button>
          </span>
        ))}
        {selected.length < MAX && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 border-dashed">
                <Plus /> Añadir personaje
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar main…" />
                <CommandList>
                  <CommandEmpty>Sin resultados.</CommandEmpty>
                  <CommandGroup>
                    {roster.map((m) => (
                      <CommandItem
                        key={m.main}
                        value={m.main}
                        onSelect={() => {
                          toggle(m.main);
                          setOpen(false);
                        }}
                      >
                        <ClassIcon cls={m.class} src={m.icon} size={22} />
                        <CharacterName cls={m.class}>{m.main}</CharacterName>
                        <span className="ml-auto font-mono text-xs text-muted-foreground tabular">
                          {formatPoints(m.amount)}
                        </span>
                        <Check
                          className={cn(
                            "size-4",
                            selected.includes(m.main) ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
        <span className="ml-auto text-sm text-muted-foreground">
          Hasta {MAX} personajes · últimos {DAYS} días
        </span>
      </div>

      {members.length === 0 ? (
        <Card>
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle>Elige personajes para comparar</EmptyTitle>
              <EmptyDescription>
                Añade hasta {MAX} mains para ver cómo evolucionan sus puntos.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.member.main} className="gap-3 py-4">
                <CardHeader className="px-4">
                  <div className="flex items-center gap-3">
                    <ClassIcon cls={s.member.class} src={s.member.icon} size={36} />
                    <div className="min-w-0">
                      <CardTitle>
                        <CharacterName cls={s.member.class} className="font-semibold">
                          {s.member.main}
                        </CharacterName>
                      </CardTitle>
                      <CardDescription>
                        #{rankOf.get(s.member.main)} · {getClassMeta(s.member.class)?.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 px-4">
                  <Stat label="Puntos" value={formatPoints(s.member.amount)} />
                  <Stat
                    label="Ganados"
                    value={s.loading ? "…" : formatSigned(s.gained)}
                    tone="positive"
                  />
                  <Stat
                    label="Gastados"
                    value={s.loading ? "…" : formatSigned(s.spent)}
                    tone="negative"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Evolución de puntos</CardTitle>
              <CardDescription>Saldo al cierre de cada día</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--muted-foreground)"
                    minTickGap={24}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="var(--muted-foreground)"
                    width={44}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                    formatter={(v) => formatPoints(Number(v))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {members.map((m) => (
                    <Line
                      key={m.main}
                      type="stepAfter"
                      dataKey={m.main}
                      stroke={
                        (resolvedTheme === "light"
                          ? getClassMeta(m.class)?.light
                          : getClassMeta(m.class)?.dark) ?? "var(--primary)"
                      }
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/** Una fila por día con el saldo de cada personaje al cierre de ese día. */
function buildChart(
  stats: { member: RosterMember; series: { t: number; pts: number }[] }[],
  now: number,
) {
  return Array.from({ length: DAYS + 1 }, (_, i) => {
    const end = now - (DAYS - i) * 24 * 3600 * 1000;
    const row: Record<string, number | string> = {
      date: new Date(end).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }),
    };
    stats.forEach((s) => {
      row[s.member.main] = ([...s.series].reverse().find((p) => p.t <= end) ?? s.series[0]).pts;
    });
    return row;
  });
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="rounded-md bg-muted/60 p-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-mono text-sm font-semibold tabular",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
        )}
      >
        {value}
      </div>
    </div>
  );
}
