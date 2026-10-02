"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, CalendarX2, Check, Star, Swords, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ItemIcon, itemNameClass } from "@/components/wow/item-icon";
import { useRoster } from "@/hooks/use-roster";
import { useMyCharacter } from "@/hooks/use-my-character";
import type { RaidsByDateResponse } from "@/app/types/RaidComposition";
import { BOSSES_TRANSLATIONS } from "@/app/types/RaidLog";
import { instanceBosses, raidShort } from "@/lib/raids";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LogsResponseSchema } from "@/src/domain/schemas/schemas";
import { resolveItemDisplayName } from "@/src/domain/constants/constants";
import { cn } from "@/lib/utils";
import {
  formatPoints,
  formatSigned,
  getClassMeta,
  itemQuality,
  limaIsoDate,
  parseCompactNumber,
} from "@/lib/wow";

const LOOKBACK_DAYS = 7;

export default function HomePage() {
  const { myCharacter } = useMyCharacter();
  const { roster, rankOf, memberByName, isLoading: rosterLoading } = useRoster();
  const me = myCharacter ? memberByName.get(myCharacter.toLowerCase()) : undefined;
  const [metric, setMetric] = useState<"Damage" | "Healing">("Damage");

  // Última raid: la fecha más reciente con encuentros dentro de la última semana.
  const today = limaIsoDate();
  const dates = useMemo(
    () =>
      Array.from({ length: LOOKBACK_DAYS }, (_, i) =>
        format(addDays(parseISO(today), -i), "yyyy-MM-dd"),
      ),
    [today],
  );
  const raidQueries = useQueries({
    queries: dates.map((date) => ({
      queryKey: ["raids", date],
      queryFn: async (): Promise<RaidsByDateResponse> => {
        const res = await fetch(`/api/raids?date=${date}`);
        if (!res.ok) throw new Error("Error al obtener las raids");
        return res.json();
      },
    })),
  });
  const raidsLoading = raidQueries.some((q) => q.isLoading);
  const lastRaidDay = raidQueries.find((q) => (q.data?.raids?.length ?? 0) > 0)?.data ?? null;
  const raidDate = lastRaidDay ? dates[raidQueries.findIndex((q) => q.data === lastRaidDay)] : null;

  const { data: encounters } = useQuery({
    queryKey: ["skadaDay", raidDate],
    queryFn: async () => {
      const res = await fetch(`/api/logs?date=${raidDate}`);
      if (!res.ok) throw new Error("Error al obtener los logs");
      return LogsResponseSchema.parse(await res.json());
    },
    enabled: !!raidDate,
  });

  // Historial de mi personaje para la variación de los últimos 7 días.
  const myNames = me ? [me.main, ...(me.alters ?? []).map((a) => a.name)].join(",") : "";
  const { data: myHistory } = useQuery<{ valor: number; fecha: string }[]>({
    queryKey: ["epgpHistory", myNames],
    queryFn: async () => {
      const res = await fetch(`/api/epgp/history?names=${encodeURIComponent(myNames)}`);
      if (!res.ok) throw new Error("Error al obtener el historial");
      return res.json();
    },
    enabled: !!myNames,
  });
  const weekDelta = useMemo(() => {
    if (!myHistory) return null;
    const since = parseISO(dates[LOOKBACK_DAYS - 1]).getTime();
    return myHistory
      .filter((t) => {
        const [d, m, y] = t.fecha.split("/").map(Number);
        return new Date(y, m - 1, d).getTime() >= since;
      })
      .reduce((s, t) => s + t.valor, 0);
  }, [myHistory, dates]);

  const raids = useMemo(
    () => [...(lastRaidDay?.raids ?? [])].sort((a, b) => a.raid_time.localeCompare(b.raid_time)),
    [lastRaidDay],
  );
  const loot = useMemo(
    () =>
      raids
        .flatMap((r) =>
          (r.items ?? []).map((it) => ({ ...it, boss: r.boss_name, time: r.raid_time })),
        )
        .sort((a, b) => b.time.localeCompare(a.time))
        .slice(0, 6),
    [raids],
  );
  const playerCount = useMemo(
    () => new Set(raids.flatMap((r) => r.participants.map((p) => p.player_name))).size,
    [raids],
  );
  const itemCount = raids.reduce((s, r) => s + (r.items?.length ?? 0), 0);

  const topEncounter = useMemo(
    () =>
      (encounters ?? []).reduce<NonNullable<typeof encounters>[number] | null>(
        (best, e) => (!best || e.endtime > best.endtime ? e : best),
        null,
      ),
    [encounters],
  );
  const top = useMemo(() => {
    const source = metric === "Damage" ? topEncounter?.Damage : topEncounter?.Healing;
    const list = (source ?? [])
      .slice(0, 7)
      .map((d) => ({
        ...d,
        value: parseCompactNumber(metric === "Damage" ? (d.DPS ?? d.Amount) : d.Amount),
      }));
    const max = list[0]?.value || 1;
    return list.map((d) => ({ ...d, pct: (d.value / max) * 100 }));
  }, [topEncounter, metric]);

  // Instancia principal del día (la que tiene más encuentros) con todos sus jefes, matados o no.
  const mainRaid = useMemo(() => {
    const counts = new Map<string, number>();
    raids.forEach((r) =>
      counts.set(raidShort(r.boss_name), (counts.get(raidShort(r.boss_name)) ?? 0) + 1),
    );
    const short = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "ICC";
    const size = Math.max(0, ...raids.map((r) => r.participants.length)) > 10 ? 25 : 10;
    return { label: `${short} ${size}`, bosses: instanceBosses(short) };
  }, [raids]);
  const killed = useMemo(() => new Set(raids.map((r) => r.boss_name)), [raids]);
  const duration = useMemo(() => {
    if (raids.length < 2) return null;
    const toMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    let span = toMin(raids[raids.length - 1].raid_time) - toMin(raids[0].raid_time);
    if (span < 0) span += 24 * 60;
    return `${Math.floor(span / 60)} h ${span % 60} min`;
  }, [raids]);

  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Lima",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <PageBody>
      <PageHeader
        title={me ? `${greeting}, ${me.main}` : greeting}
        description={
          raidDate
            ? `Última raid registrada: ${format(parseISO(raidDate), "EEEE d 'de' MMMM", { locale: es })}`
            : "Resumen de la hermandad"
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/reglas">Ver reglas de loteo</Link>
            </Button>
            <Button asChild>
              <Link href="/epgp">Abrir EPGP</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Mi personaje</CardDescription>
            {me && (
              <CardAction>
                <Badge className="bg-highlight/15 text-highlight hover:bg-highlight/15">
                  <Star className="fill-current" /> Fijado
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {rosterLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : me ? (
              <>
                <div className="flex items-center gap-3">
                  <ClassIcon cls={me.class} src={me.icon} size={52} />
                  <div className="min-w-0">
                    <CharacterName cls={me.class} className="block truncate text-xl font-semibold">
                      {me.main}
                    </CharacterName>
                    <span className="text-sm text-muted-foreground">
                      {getClassMeta(me.class)?.name}
                      {me.alters?.length
                        ? ` · ${me.alters.length} ${me.alters.length === 1 ? "alter" : "alters"}`
                        : ""}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat label="Puntos" value={formatPoints(me.amount)} />
                  <MiniStat
                    label="Puesto"
                    value={`#${rankOf.get(me.main)}`}
                    hint={`/${roster.length}`}
                  />
                  <MiniStat
                    label="7 días"
                    value={weekDelta == null ? "—" : formatSigned(weekDelta)}
                    tone={
                      weekDelta == null || weekDelta === 0
                        ? undefined
                        : weekDelta > 0
                          ? "positive"
                          : "negative"
                    }
                  />
                </div>
                <Button variant="link" className="h-auto justify-start p-0" asChild>
                  <Link href={`/epgp?personaje=${encodeURIComponent(me.main)}`}>
                    Ver historial completo <ArrowRight />
                  </Link>
                </Button>
              </>
            ) : (
              <Empty className="border border-dashed py-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Star />
                  </EmptyMedia>
                  <EmptyTitle>Fija tu personaje</EmptyTitle>
                  <EmptyDescription>
                    Márcalo con la estrella en <Link href="/epgp">EPGP</Link> y verás aquí tus
                    puntos y tu puesto.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Última raid
              {raidDate && (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  {mainRaid.label} · {format(parseISO(raidDate), "dd/MM/yyyy")}
                </Badge>
              )}
            </CardTitle>
            {raidDate && (
              <CardAction className="font-mono text-sm font-medium text-positive tabular">
                {killed.size}/{mainRaid.bosses.length} jefes
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {raidsLoading && !lastRaidDay ? (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-9" />
                ))}
              </div>
            ) : raids.length === 0 ? (
              <Empty className="py-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CalendarX2 />
                  </EmptyMedia>
                  <EmptyTitle>Sin raids esta semana</EmptyTitle>
                  <EmptyDescription>
                    Cuando ScriptSkada sincronice una raid aparecerá aquí.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(killed.size / Math.max(1, mainRaid.bosses.length)) * 100}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {mainRaid.bosses.map((b) => {
                    const done = killed.has(b);
                    return (
                      <div
                        key={b}
                        className={cn(
                          "flex h-9 items-center gap-2 rounded-md bg-muted/60 px-3 text-sm",
                          !done && "text-muted-foreground",
                        )}
                        title={BOSSES_TRANSLATIONS[b] ?? b}
                      >
                        {done ? (
                          <Check className="size-4 shrink-0 text-positive" />
                        ) : (
                          <X className="size-4 shrink-0" />
                        )}
                        <span className="truncate">{BOSSES_TRANSLATIONS[b] ?? b}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span>{playerCount} jugadores</span>
                  {duration && (
                    <>
                      <span>·</span>
                      <span>{duration}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{itemCount} ítems repartidos</span>
                  <Button variant="link" className="ml-auto h-auto p-0" asChild>
                    <Link href="/raids">
                      Ver composición <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-0 pb-0">
          <CardHeader className="border-b pb-4">
            <CardTitle>Botín reciente</CardTitle>
            <CardAction>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href="/loot">Ver todo</Link>
              </Button>
            </CardAction>
          </CardHeader>
          {loot.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {raidsLoading ? "Cargando…" : "No hay botín registrado en la última raid."}
            </p>
          ) : (
            <ul className="divide-y">
              {loot.map((it) => {
                const q = itemQuality(it.id_item);
                return (
                  <li key={it.id} className="flex items-center gap-3 px-6 py-2.5">
                    <ItemIcon src={it.items?.icon} name={it.items?.name} quality={q} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", itemNameClass(q))}>
                        {resolveItemDisplayName(
                          it.items?.raid,
                          it.id_item,
                          it.class,
                          it.items?.name ?? "",
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {BOSSES_TRANSLATIONS[it.boss] ?? it.boss}
                      </p>
                    </div>
                    {it.personaje ? (
                      <div className="flex w-32 shrink-0 items-center gap-2">
                        <ClassIcon cls={it.class} size={22} />
                        <CharacterName cls={it.class} className="truncate text-sm">
                          {it.personaje}
                        </CharacterName>
                      </div>
                    ) : (
                      <span className="w-32 shrink-0 text-xs text-muted-foreground">
                        Sin asignar
                      </span>
                    )}
                    <span className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground tabular">
                      {it.valor != null ? `\u2212${formatPoints(Math.abs(it.valor))} pts` : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-4">
            <CardTitle className="truncate">
              Top {metric === "Damage" ? "daño" : "sanación"}
              {topEncounter
                ? ` · ${BOSSES_TRANSLATIONS[topEncounter.name] ?? topEncounter.name}`
                : ""}
            </CardTitle>
            <CardAction>
              <ToggleGroup
                type="single"
                size="sm"
                value={metric}
                onValueChange={(v) => v && setMetric(v as typeof metric)}
                aria-label="Métrica"
              >
                <ToggleGroupItem
                  value="Damage"
                  className="h-7 px-2.5 text-xs data-[state=on]:bg-muted"
                >
                  Daño
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="Healing"
                  className="h-7 px-2.5 text-xs data-[state=on]:bg-muted"
                >
                  Sanación
                </ToggleGroupItem>
              </ToggleGroup>
            </CardAction>
          </CardHeader>
          {top.length === 0 ? (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Swords />
                </EmptyMedia>
                <EmptyDescription>Sin logs de Skada para la última raid.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ol className="flex flex-col gap-2 px-6 py-4">
              {top.map((d) => {
                const meta = getClassMeta(d.Class);
                return (
                  <li key={d.Character} className="flex items-center gap-2.5">
                    <span className="w-4 text-right font-mono text-xs text-muted-foreground tabular">
                      {d.Rank}
                    </span>
                    <ClassIcon cls={d.Class} src={d.Icon} size={22} />
                    <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-muted">
                      <div
                        className="absolute inset-y-0 left-0 opacity-40"
                        style={{ width: `${d.pct}%`, background: meta?.hex ?? "var(--primary)" }}
                      />
                      <span className="absolute inset-y-0 left-2.5 flex items-center text-sm font-medium">
                        {d.Character}
                      </span>
                      <span className="absolute inset-y-0 right-2.5 flex items-center font-mono text-xs tabular">
                        {metric === "Damage" ? (d.DPS ?? d.Amount) : d.Amount}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <div className="mt-auto border-t px-6 py-3">
            <Button variant="link" className="h-auto p-0" asChild>
              <Link href="/skada">
                Abrir medidor completo <ArrowRight />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </PageBody>
  );
}

function MiniStat({
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
    <div className="rounded-lg bg-muted/60 p-2.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-mono text-lg font-semibold tabular",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
        )}
      >
        {value}
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
