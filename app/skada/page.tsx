"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, parseISO } from "date-fns";
import { GitCompareArrows, Ghost, Search } from "lucide-react";
import {
  LogsResponseSchema,
  type ValidatedRaidEncounterPayload,
} from "@/src/domain/schemas/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageBody, PageHeader } from "@/components/page-header";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import { useRaidLogs } from "../hooks/useRaidLogs";
import { BOSSES_BY_INSTANCE, BOSSES_TRANSLATIONS, RAID_INSTANCES } from "../types/RaidLog";
import { cn } from "@/lib/utils";
import { getClassMeta, parseCompactNumber } from "@/lib/wow";

const INSTANCE_LABELS: Record<string, string> = {
  "Icecrown Citadel": "Ciudadela de la Corona de Hielo",
  "Ruby Sanctum": "Sagrario Rubí",
  "Trial of the Crusader": "Prueba del Cruzado",
  Ulduar: "Ulduar",
};

function useDayEncounters(date: string | null) {
  return useQuery({
    queryKey: ["skadaDay", date],
    queryFn: async () => {
      const res = await fetch(`/api/logs?date=${date}`);
      if (!res.ok) throw new Error("Error al obtener los logs");
      return LogsResponseSchema.parse(await res.json());
    },
    enabled: !!date,
  });
}

/** Duración aproximada del encuentro: daño / DPS del jugador con más tiempo activo. */
function encounterSeconds(e: ValidatedRaidEncounterPayload) {
  return Math.max(
    0,
    ...(e.Damage ?? []).map((d) => {
      const dps = parseCompactNumber(d.DPS);
      return dps > 0 ? parseCompactNumber(d.Amount) / dps : 0;
    }),
  );
}

function formatDuration(sec: number) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  return `${m}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
}

export default function SkadaPage() {
  const { logs, sessions, loading, error, filters, setFilters } = useRaidLogs();
  const isDamage = filters.metric === "Damage";
  const [compareWeek, setCompareWeek] = useState(false);

  const { data: day = [] } = useDayEncounters(filters.date || null);
  const lastWeekDate = filters.date
    ? format(addDays(parseISO(filters.date), -7), "yyyy-MM-dd")
    : null;
  const { data: lastWeek = [], isFetching: lastWeekLoading } = useDayEncounters(
    compareWeek ? lastWeekDate : null,
  );

  // Duración por jefe (última kill del día) para las píldoras y el resumen.
  const durations = useMemo(() => {
    const map = new Map<string, { sec: number; kills: number }>();
    [...day]
      .sort((a, b) => a.endtime - b.endtime)
      .forEach((e) =>
        map.set(e.name, { sec: encounterSeconds(e), kills: (map.get(e.name)?.kills ?? 0) + 1 }),
      );
    return map;
  }, [day]);

  // Valor de la semana pasada por personaje para el mismo jefe (última kill).
  const previous = useMemo(() => {
    const enc = [...lastWeek]
      .filter((e) => e.name === filters.boss)
      .sort((a, b) => b.endtime - a.endtime)[0];
    const list = (isDamage ? enc?.Damage : enc?.Healing) ?? [];
    return new Map(
      list.map((d) => [
        d.Character.toLowerCase(),
        parseCompactNumber(isDamage ? (d.DPS ?? d.Amount) : d.Amount),
      ]),
    );
  }, [lastWeek, filters.boss, isDamage]);

  const rows = useMemo(() => {
    const list = [...logs].sort((a, b) => a.Rank - b.Rank);
    const totals = list.map((l) => parseCompactNumber(l.Amount));
    const max = Math.max(...totals, 1);
    const sum = totals.reduce((s, n) => s + n, 0) || 1;
    return list.map((l, i) => ({
      ...l,
      pct: (totals[i] / max) * 100,
      share: (totals[i] / sum) * 100,
    }));
  }, [logs]);

  const total = useMemo(() => rows.reduce((s, r) => s + parseCompactNumber(r.Amount), 0), [rows]);
  const raidRate = useMemo(() => rows.reduce((s, r) => s + parseCompactNumber(r.DPS), 0), [rows]);
  const bossInfo = durations.get(filters.boss);

  const weekDelta = (r: (typeof rows)[number]) => {
    if (!compareWeek) return null;
    const before = previous.get(r.Character.toLowerCase());
    const nowValue = parseCompactNumber(isDamage ? (r.DPS ?? r.Amount) : r.Amount);
    return before ? ((nowValue - before) / before) * 100 : null;
  };

  const composition = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((r) => {
      const key = getClassMeta(r.Class)?.key ?? r.Class;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([key, n]) => ({ meta: getClassMeta(key), key, n }))
      .sort((a, b) => b.n - a.n);
  }, [rows]);

  const bosses = BOSSES_BY_INSTANCE[filters.raidInstance] ?? [];

  return (
    <PageBody>
      <PageHeader
        title="Medidor de la raid"
        description="Daño y sanación por jefe, sincronizado desde ScriptSkada."
        actions={
          <>
            <Input
              type="date"
              aria-label="Fecha"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="h-9 w-40"
            />
            <Select
              value={filters.raidInstance}
              onValueChange={(v) =>
                setFilters({ ...filters, raidInstance: v, boss: BOSSES_BY_INSTANCE[v]?.[0] ?? "" })
              }
            >
              <SelectTrigger className="w-60" aria-label="Instancia">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RAID_INSTANCES.map((i) => (
                  <SelectItem key={i} value={i}>
                    {INSTANCE_LABELS[i] ?? i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs
              value={filters.metric}
              onValueChange={(v) => setFilters({ ...filters, metric: v as typeof filters.metric })}
            >
              <TabsList>
                <TabsTrigger value="Damage">Daño</TabsTrigger>
                <TabsTrigger value="Healing">Sanación</TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        }
      />

      <ToggleGroup
        type="single"
        value={filters.boss}
        onValueChange={(v) => v && setFilters({ ...filters, boss: v })}
        variant="outline"
        aria-label="Jefe"
        className="flex-wrap justify-start"
      >
        {bosses.map((b) => (
          <ToggleGroupItem
            key={b}
            value={b}
            className="group h-8 gap-1.5 rounded-full! border! px-3 text-sm data-[state=on]:bg-foreground data-[state=on]:text-background"
          >
            {BOSSES_TRANSLATIONS[b] ?? b}
            {durations.get(b) && (
              <span className="font-mono text-[11px] text-muted-foreground tabular group-data-[state=on]:text-background/70">
                {formatDuration(durations.get(b)!.sec)}
              </span>
            )}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="gap-0 overflow-hidden p-0">
          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Buscar personaje…"
                aria-label="Buscar personaje"
                className="h-9 pl-8"
              />
            </div>
            {sessions.length > 1 && (
              <Select
                value={filters.session != null ? String(filters.session) : undefined}
                onValueChange={(v) => setFilters({ ...filters, session: Number(v) })}
              >
                <SelectTrigger className="w-40" aria-label="Sesión">
                  <SelectValue placeholder="Sesión" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.endtime} value={String(s.endtime)}>
                      Kill de las {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <span className="ml-auto text-sm text-muted-foreground">{rows.length} jugadores</span>
          </div>

          <div className="hidden grid-cols-[40px_minmax(0,220px)_minmax(0,1fr)_88px_64px] items-center gap-3 border-b px-4 py-2.5 text-xs font-medium text-muted-foreground md:grid">
            <span className="text-center">#</span>
            <span>Jugador</span>
            <span>{isDamage ? "Daño total" : "Sanación total"}</span>
            <span className="text-right">{isDamage ? "DPS" : ""}</span>
            <span className="text-right">{compareWeek ? "vs. sem." : "%"}</span>
          </div>

          {error ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Ghost />
                </EmptyMedia>
                <EmptyTitle>Error al cargar los datos</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>Sin datos para este jefe</EmptyTitle>
                <EmptyDescription>Prueba con otra fecha o jefe.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ol>
              {rows.map((r, i) => {
                const meta = getClassMeta(r.Class);
                return (
                  <li
                    key={`${r.Character}-${r.endtime}-${i}`}
                    className="grid grid-cols-[32px_minmax(0,1fr)_72px] items-center gap-3 border-b px-4 py-2 last:border-b-0 md:grid-cols-[40px_minmax(0,220px)_minmax(0,1fr)_88px_64px]"
                  >
                    <span
                      className={cn(
                        "mx-auto flex size-6 items-center justify-center rounded-full font-mono text-xs font-semibold tabular",
                        r.Rank === 1 && "bg-highlight text-black",
                        r.Rank > 1 && r.Rank <= 3 && "bg-muted text-highlight",
                        r.Rank > 3 && "text-muted-foreground",
                      )}
                    >
                      {r.Rank}
                    </span>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <ClassIcon cls={r.Class} src={r.Icon} size={28} />
                      <div className="min-w-0 leading-tight">
                        <CharacterName cls={r.Class} className="block truncate font-semibold">
                          {r.Character}
                        </CharacterName>
                        <span className="block truncate text-xs text-muted-foreground">
                          {r.Talent}
                        </span>
                      </div>
                    </div>
                    <div className="relative col-span-3 h-6 overflow-hidden rounded-md bg-muted md:col-span-1">
                      <div
                        className="absolute inset-y-0 left-0 opacity-45"
                        style={{ width: `${r.pct}%`, background: meta?.hex ?? "var(--primary)" }}
                      />
                      <span className="absolute inset-y-0 right-2 flex items-center font-mono text-xs tabular">
                        {r.Amount}
                      </span>
                    </div>
                    <span className="hidden text-right font-mono text-sm font-semibold tabular md:block">
                      {isDamage ? r.DPS : ""}
                    </span>
                    <span
                      className={cn(
                        "row-start-1 text-right font-mono text-xs tabular md:row-auto [grid-column:3] md:[grid-column:auto]",
                        weekDelta(r) == null
                          ? "text-muted-foreground"
                          : weekDelta(r)! >= 0
                            ? "text-positive"
                            : "text-negative",
                      )}
                      title={
                        compareWeek
                          ? "Variación frente a la kill de la semana pasada"
                          : "Porcentaje del total de la raid"
                      }
                    >
                      {compareWeek
                        ? weekDelta(r) == null
                          ? lastWeekLoading
                            ? "…"
                            : "—"
                          : `${weekDelta(r)! >= 0 ? "+" : "\u2212"}${Math.abs(weekDelta(r)!).toFixed(1)}%`
                        : `${r.share.toFixed(1)}%`}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="truncate">
                {BOSSES_TRANSLATIONS[filters.boss] ?? filters.boss}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <SummaryStat
                label="Duración"
                value={bossInfo?.sec ? formatDuration(bossInfo.sec) : "—"}
                hint="aprox."
              />
              <SummaryStat
                label={isDamage ? "DPS raid" : "Sanación raid"}
                value={isDamage ? (raidRate ? formatCompact(raidRate) : "—") : formatCompact(total)}
              />
              <SummaryStat label="Kills del día" value={String(bossInfo?.kills ?? 0)} />
              <SummaryStat label="Jugadores" value={String(rows.length)} />
            </CardContent>
          </Card>
          <button
            type="button"
            onClick={() => setCompareWeek((v) => !v)}
            aria-pressed={compareWeek}
            className={cn(
              "flex flex-col gap-1 rounded-xl border border-dashed p-4 text-left transition-colors hover:bg-accent",
              compareWeek && "border-solid border-primary/50 bg-primary/5",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <GitCompareArrows className="size-4" />
              {compareWeek ? "Comparando con la semana pasada" : "Comparar con la semana pasada"}
            </span>
            <span className="text-xs text-muted-foreground">
              {compareWeek
                ? previous.size
                  ? `Variación por jugador frente a la kill del ${lastWeekDate ? format(parseISO(lastWeekDate), "dd/MM") : ""}. Pulsa para volver al %.`
                  : lastWeekLoading
                    ? "Cargando la semana pasada…"
                    : "No hay kill de este jefe la semana pasada."
                : `Muestra la variación de ${isDamage ? "DPS" : "sanación"} por jugador frente a la kill de este jefe 7 días antes.`}
            </span>
          </button>
          {composition.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Composición</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
                  {composition.map((c) => (
                    <div
                      key={c.key}
                      style={{ flexGrow: c.n, background: c.meta?.hex ?? "var(--muted)" }}
                    />
                  ))}
                </div>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {composition.map((c) => (
                    <li key={c.key} className="flex items-center gap-1.5 text-xs">
                      <ClassIcon cls={c.key} size={16} />
                      <span className="truncate">{c.meta?.name ?? c.key}</span>
                      <span className="ml-auto font-mono text-muted-foreground tabular">{c.n}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageBody>
  );
}

function SummaryStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-lg font-semibold tabular">
        {value}
        {hint && value !== "—" && (
          <span className="ml-1 font-sans text-[11px] font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} K`;
  return n.toFixed(0);
}
