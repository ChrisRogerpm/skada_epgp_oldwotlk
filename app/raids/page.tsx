"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarX2, Check, ChevronLeft, ChevronRight, Copy, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import { ItemIcon, itemNameClass } from "@/components/wow/item-icon";
import type { RaidParticipant, RaidsByDateResponse } from "../types/RaidComposition";
import type { RaidOption } from "../types/Loot";
import { BOSSES_TRANSLATIONS } from "../types/RaidLog";
import { resolveItemDisplayName, resolveWowheadItemId } from "@/src/domain/constants/constants";
import { cn } from "@/lib/utils";
import { groupSessions, instanceBosses, sessionLabel } from "@/lib/raids";
import { formatPoints, itemQuality, itemUrl, refreshWowheadLinks } from "@/lib/wow";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export default function RaidsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [pickedMonth, setPickedMonth] = useState<Date | null>(null);
  const [sessionKey, setSessionKey] = useState<string | null>(null);

  // Días con raid (para los puntos del calendario).
  const { data: raidOptions = [], isFetched: optionsFetched } = useQuery<RaidOption[]>({
    queryKey: ["raidOptions"],
    queryFn: async () => {
      const res = await fetch("/api/loot/raids?limit=1000");
      if (!res.ok) throw new Error("Error al obtener las raids");
      return res.json();
    },
  });
  const raidDays = useMemo(() => new Set(raidOptions.map((r) => r.raid_date)), [raidOptions]);
  // Sin elección del usuario se abre el último día con raid.
  const latestRaidDay = useMemo(() => [...raidDays].sort().at(-1), [raidDays]);
  const selectedDate = pickedDate ?? latestRaidDay ?? today;
  const month = pickedMonth ?? startOfMonth(parseISO(selectedDate));
  const setMonth = (fn: (m: Date) => Date) => setPickedMonth(fn(month));

  const {
    data,
    isPending: isLoading,
    error,
  } = useQuery<RaidsByDateResponse>({
    queryKey: ["raids", selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/raids?date=${selectedDate}`);
      if (!res.ok) throw new Error("Error al obtener las raids");
      return res.json();
    },
    enabled: pickedDate != null || optionsFetched,
  });

  const sessions = useMemo(() => groupSessions(data?.raids ?? []), [data]);
  const session = sessions.find((s) => s.key === sessionKey) ?? sessions[0];

  const calendar: Date[] = [];
  for (
    let d = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    d <= endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    d = addDays(d, 1)
  ) {
    calendar.push(d);
  }

  const pickDate = (iso: string) => {
    setPickedDate(iso);
    setSessionKey(null);
  };

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] flex-col pb-20 md:pb-0 lg:flex-row">
      <aside
        aria-label="Calendario de raids"
        className="flex shrink-0 flex-col gap-4 border-b p-4 lg:w-72 lg:border-r lg:border-b-0"
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold capitalize">
            {format(month, "MMMM yyyy", { locale: es })}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              aria-label="Mes anterior"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Mes siguiente"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1 text-[11px] text-muted-foreground">
              {w}
            </span>
          ))}
          {calendar.map((d) => {
            const iso = format(d, "yyyy-MM-dd");
            const selected = iso === selectedDate;
            const hasRaid = raidDays.has(iso);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => pickDate(iso)}
                aria-pressed={selected}
                aria-label={
                  format(d, "d 'de' MMMM", { locale: es }) + (hasRaid ? ", con raid" : "")
                }
                className={cn(
                  "flex h-9 flex-col items-center justify-center gap-0.5 rounded-md font-mono text-xs tabular transition-colors",
                  selected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  !selected && !isSameMonth(d, month) && "text-muted-foreground/50",
                  !selected && isSameMonth(d, month) && !hasRaid && "text-muted-foreground",
                  iso === today && !selected && "ring-1 ring-border",
                )}
              >
                {format(d, "d")}
                <span
                  className={cn(
                    "size-1 rounded-full",
                    hasRaid
                      ? selected
                        ? "bg-primary-foreground"
                        : "bg-primary"
                      : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>

        <div className="pt-1 text-xs font-medium text-muted-foreground">
          Raids del {format(parseISO(selectedDate), "dd/MM")}
        </div>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin raids este día.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((s) => {
              const active = s.key === session?.key;
              const players = Math.max(...s.encounters.map((e) => e.participants.length));
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSessionKey(s.key)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    active ? "border-primary/50 bg-primary/5" : "hover:bg-muted",
                  )}
                >
                  <span className="flex items-center justify-between text-sm font-semibold">
                    {sessionLabel(s, sessions)}
                    <span className="text-xs font-normal text-muted-foreground">
                      {s.encounters.reduce((n, e) => n + (e.items?.length ?? 0), 0)} ítems
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {s.start} · {new Set(s.encounters.map((e) => e.boss_name)).size}/
                    {instanceBosses(s.short).length || "?"} jefes · {players} jugadores
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-64 w-full" />
          </>
        ) : error ? (
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TriangleAlert />
              </EmptyMedia>
              <EmptyTitle>No se pudieron cargar las raids</EmptyTitle>
              <EmptyDescription>Inténtalo de nuevo en unos segundos.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : !session ? (
          <Empty className="border border-dashed py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarX2 />
              </EmptyMedia>
              <EmptyTitle>Sin raids este día</EmptyTitle>
              <EmptyDescription>
                Elige en el calendario un día marcado con un punto.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <SessionView
            key={session.key}
            session={session}
            label={sessionLabel(session, sessions)}
            date={selectedDate}
          />
        )}
      </div>
    </div>
  );
}

function SessionView({
  session,
  label,
  date,
}: {
  session: ReturnType<typeof groupSessions>[number];
  label: string;
  date: string;
}) {
  // Composición: la del encuentro con más jugadores (la formación completa de la raid).
  const main = [...session.encounters].sort(
    (a, b) => b.participants.length - a.participants.length,
  )[0];
  const groups = useMemo(() => {
    const map = new Map<number, RaidParticipant[]>();
    main.participants.forEach((p) => {
      if (!map.has(p.player_group)) map.set(p.player_group, []);
      map.get(p.player_group)!.push(p);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [main]);

  const killed = new Set(session.encounters.map((e) => e.boss_name));
  const bosses = instanceBosses(session.short);
  const loot = session.encounters.flatMap((e) =>
    (e.items ?? []).map((it) => ({ ...it, boss: e.boss_name })),
  );

  useEffect(() => {
    refreshWowheadLinks();
  }, [session.key]);

  const copyComposition = async () => {
    const text = [
      `${label} · ${date} ${session.start}`,
      ...groups.map(
        ([n, players]) => `Grupo ${n}: ${players.map((p) => p.player_name).join(", ")}`,
      ),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Composición copiada", {
        description: `${main.participants.length} jugadores en ${groups.length} grupos`,
      });
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {label} · {session.start}
          </h1>
          <p className="text-sm text-muted-foreground">
            {main.participants.length} jugadores · {killed.size}/{bosses.length || killed.size}{" "}
            jefes · {loot.length} ítems
          </p>
        </div>
        <Button variant="outline" onClick={copyComposition}>
          <Copy /> Copiar composición
        </Button>
      </div>

      {bosses.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {bosses.map((b) => (
            <span
              key={b}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs",
                killed.has(b) ? "text-foreground" : "text-muted-foreground opacity-60",
              )}
            >
              {killed.has(b) && <Check className="size-3.5 text-positive" />}
              {BOSSES_TRANSLATIONS[b] ?? b}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {groups.map(([n, players]) => (
          <section key={n} className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-3 py-2.5 text-xs font-medium text-muted-foreground">
              <span>Grupo {n}</span>
              <span className="font-mono tabular">{players.length}/5</span>
            </div>
            <ul>
              {players.map((p) => (
                <li
                  key={p.id}
                  className="flex h-10 items-center gap-2 border-b px-3 last:border-b-0"
                >
                  <ClassIcon cls={p.player_class} size={24} />
                  <CharacterName
                    cls={p.player_class}
                    className="truncate text-sm"
                    title={p.player_name}
                  >
                    {p.player_name}
                  </CharacterName>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Botín de esta raid</CardTitle>
          <CardDescription>Ordenado por jefe</CardDescription>
          <CardAction className="text-sm text-muted-foreground">{loot.length} ítems</CardAction>
        </CardHeader>
        {loot.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No se registró botín en esta raid.</p>
        ) : (
          <div className="grid gap-x-6 px-5 py-1 md:grid-cols-2">
            {loot.map((item) => {
              const q = itemQuality(item.id_item);
              const name = resolveItemDisplayName(
                item.items.raid,
                item.id_item,
                item.class,
                item.items.name,
              );
              return (
                <div key={item.id} className="flex h-12 items-center gap-2.5 border-b">
                  <ItemIcon src={item.items.icon} name={name} quality={q} size={30} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <a
                      href={itemUrl(
                        resolveWowheadItemId(item.items.raid, item.id_item, item.class),
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "block truncate text-sm font-medium hover:underline",
                        itemNameClass(q),
                      )}
                    >
                      {name}
                    </a>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {BOSSES_TRANSLATIONS[item.boss] ?? item.boss}
                    </span>
                  </div>
                  {item.personaje ? (
                    <CharacterName cls={item.class} className="shrink-0 text-sm">
                      {item.personaje}
                    </CharacterName>
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">Sin asignar</span>
                  )}
                  <span
                    className="w-14 shrink-0 text-right font-mono text-xs text-muted-foreground tabular"
                    title="Puntos pagados"
                  >
                    {item.valor != null ? `−${formatPoints(Math.abs(item.valor))}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
