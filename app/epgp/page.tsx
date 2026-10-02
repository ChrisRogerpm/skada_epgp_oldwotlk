"use client";

import { Fragment, Suspense, useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import { addDays, format, parseISO } from "date-fns";
import { ChevronDown, ChevronRight, History, Search, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageBody, PageHeader } from "@/components/page-header";
import { ClientOnly } from "@/components/client-only";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import { CharacterHistorySheet } from "@/components/epgp/character-history-sheet";
import { EpgpCompare } from "@/components/epgp/epgp-compare";
import { ItemDescription } from "@/components/epgp/item-description";
import { useRoster, type RosterMember } from "@/hooks/use-roster";
import { useMyCharacter } from "@/hooks/use-my-character";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { EpgpMovement, movementTime, relativeMovementLabel } from "@/lib/epgp";
import {
  WOW_CLASSES,
  dmyToIso,
  formatPoints,
  formatSigned,
  getClassMeta,
  isoToDmy,
  limaIsoDate,
  normalizeClass,
} from "@/lib/wow";

type Tab = "roster" | "historial" | "comparar";
const WEEK = 7;

function logsQuery(dmy: string) {
  return {
    queryKey: ["epgpLogs", dmy || "all"],
    queryFn: async (): Promise<EpgpMovement[]> => {
      const res = await fetch(`/api/detalleepgp?fecha=${encodeURIComponent(dmy || "all")}`);
      if (!res.ok) throw new Error("Error al obtener el historial");
      return res.json();
    },
  };
}

export default function EpgpPage() {
  return (
    <Suspense>
      <ClientOnly>
        <EpgpView />
      </ClientOnly>
    </Suspense>
  );
}

function EpgpView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { roster, ranked, rankOf, memberByName, characterInfo, maxPoints, isLoading } = useRoster();
  const { myCharacter, toggleMyCharacter } = useMyCharacter();
  const now = useNow();

  const [tab, setTab] = useState<Tab>("roster");
  const [search, setSearch] = useState("");
  const [classes, setClasses] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [historyDate, setHistoryDate] = useState(() => isoToDmy(limaIsoDate()));
  const [compare, setCompare] = useState<string[] | null>(null);

  // Movimientos de los últimos 7 días (un pedido por día, cacheados) para "7 días" y "Último movimiento".
  const weekDays = useMemo(() => {
    const today = parseISO(limaIsoDate());
    return Array.from({ length: WEEK }, (_, i) =>
      isoToDmy(format(addDays(today, -i), "yyyy-MM-dd")),
    );
  }, []);
  const weekQueries = useQueries({ queries: weekDays.map(logsQuery) });
  const weekLogs = useMemo(() => weekQueries.flatMap((q) => q.data ?? []), [weekQueries]);
  const { data: historyLogs = [], isLoading: historyLoading } = useQuery(logsQuery(historyDate));

  const activity = useMemo(() => {
    const map = new Map<string, { delta: number; last: number }>();
    weekLogs.forEach((log) => {
      const main = memberByName.get(log.personaje.toLowerCase())?.main;
      if (!main) return;
      const prev = map.get(main) ?? { delta: 0, last: 0 };
      map.set(main, {
        delta: prev.delta + log.valor,
        last: Math.max(prev.last, movementTime(log)),
      });
    });
    return map;
  }, [weekLogs, memberByName]);

  // La ficha abierta vive en la URL (?personaje=) para poder compartirla y abrirla desde la búsqueda global.
  const sheetName = searchParams.get("personaje");
  const sheetMember = sheetName ? (memberByName.get(sheetName.toLowerCase()) ?? null) : null;
  const openSheet = useCallback(
    (main: string) =>
      router.push(`${pathname}?personaje=${encodeURIComponent(main)}`, { scroll: false }),
    [router, pathname],
  );
  const closeSheet = useCallback(
    () => router.push(pathname, { scroll: false }),
    [router, pathname],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roster
      .filter((m) => {
        const classOk =
          classes.length === 0 ||
          classes.includes(normalizeClass(m.class) ?? "") ||
          m.alters?.some((a) => classes.includes(normalizeClass(a.class) ?? ""));
        const searchOk =
          !q ||
          m.main.toLowerCase().includes(q) ||
          m.alters?.some((a) => a.name.toLowerCase().includes(q));
        return classOk && searchOk;
      })
      .sort((a, b) => {
        if (a.main === myCharacter) return -1;
        if (b.main === myCharacter) return 1;
        return b.amount - a.amount;
      });
  }, [roster, search, classes, myCharacter]);

  const myMember = myCharacter ? memberByName.get(myCharacter.toLowerCase()) : undefined;
  const myNames = useMemo(
    () =>
      new Set(
        myMember
          ? [myMember.main, ...(myMember.alters ?? []).map((a) => a.name)].map((n) =>
              n.toLowerCase(),
            )
          : [],
      ),
    [myMember],
  );

  const history = useMemo(() => {
    const q = search.trim().toLowerCase();
    return historyLogs
      .filter(
        (l) =>
          !q || l.personaje.toLowerCase().includes(q) || l.descripcion.toLowerCase().includes(q),
      )
      .sort((a, b) => movementTime(b) - movementTime(a));
  }, [historyLogs, search]);

  // Comparar: por defecto mi personaje y los dos primeros del ranking.
  const compareSelection =
    compare ??
    [
      ...new Set(
        [myMember?.main, ...ranked.slice(0, 3).map((m) => m.main)].filter(Boolean) as string[],
      ),
    ].slice(0, 3);

  const hasFilters = classes.length > 0 || search.length > 0;

  const toggleRow = (main: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(main)) next.delete(main);
      else next.add(main);
      return next;
    });

  const rowProps = (m: RosterMember) => ({
    member: m,
    rank: rankOf.get(m.main) ?? 0,
    max: maxPoints,
    delta: activity.get(m.main)?.delta,
    last: activity.get(m.main)?.last
      ? relativeMovementLabel(activity.get(m.main)!.last, now)
      : undefined,
    isMe: m.main === myCharacter,
    onPin: () => toggleMyCharacter(m.main),
    onHistory: () => openSheet(m.main),
  });

  return (
    <PageBody>
      <PageHeader
        title="EPGP"
        description={`${roster.length} jugadores · los alters suman a su main`}
        actions={
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>
              <TabsTrigger value="roster">Roster</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
              <TabsTrigger value="comparar">Comparar</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {tab === "comparar" ? (
        <EpgpCompare
          roster={ranked}
          rankOf={rankOf}
          selected={compareSelection}
          onChange={setCompare}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === "roster" ? "Buscar personaje o alter…" : "Buscar personaje o descripción…"
                }
                aria-label="Buscar"
                className="h-9 bg-card pl-8"
              />
            </div>
            {tab === "roster" ? (
              <ToggleGroup
                type="multiple"
                value={classes}
                onValueChange={setClasses}
                aria-label="Filtrar por clase"
                className="flex-wrap gap-1 rounded-lg border bg-card p-1 max-md:w-full max-md:flex-nowrap max-md:justify-start max-md:overflow-x-auto"
              >
                {WOW_CLASSES.map((c) => (
                  <Tooltip key={c.key}>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value={c.key}
                        aria-label={c.name}
                        className={cn(
                          "size-8 min-w-8 rounded-md! p-0 data-[state=on]:bg-transparent",
                          classes.length > 0 && "data-[state=off]:opacity-50",
                        )}
                        style={
                          classes.includes(c.key)
                            ? { boxShadow: `inset 0 0 0 1.5px ${c.hex}`, background: `${c.hex}33` }
                            : undefined
                        }
                      >
                        <ClassIcon cls={c.key} size={22} />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>{c.name}</TooltipContent>
                  </Tooltip>
                ))}
              </ToggleGroup>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  aria-label="Fecha (Lima)"
                  value={dmyToIso(historyDate)}
                  onChange={(e) => setHistoryDate(isoToDmy(e.target.value))}
                  className="h-9 w-40 bg-card"
                />
                <Button
                  variant={historyDate ? "outline" : "secondary"}
                  onClick={() => setHistoryDate("")}
                >
                  Todas las fechas
                </Button>
              </div>
            )}
            {hasFilters && (
              <Button
                variant="outline"
                className="border-dashed text-muted-foreground"
                onClick={() => {
                  setClasses([]);
                  setSearch("");
                }}
              >
                <X /> Limpiar filtros
              </Button>
            )}
            <span className="ml-auto text-sm text-muted-foreground">
              {tab === "roster"
                ? `${rows.length} de ${roster.length} jugadores`
                : `${history.length} registros`}
            </span>
          </div>

          {tab === "roster" ? (
            <>
              {/* Escritorio: tabla completa */}
              <Card className="hidden gap-0 overflow-hidden p-0 md:flex">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-14 text-center">#</TableHead>
                      <TableHead>Personaje</TableHead>
                      <TableHead className="hidden lg:table-cell">Clase</TableHead>
                      <TableHead className="w-[26%]">
                        <span className="flex items-center gap-1 text-foreground">
                          Puntos <ChevronDown className="size-3" />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">7 días</TableHead>
                      <TableHead className="hidden pl-6 xl:table-cell">Último movimiento</TableHead>
                      <TableHead className="w-24">
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={7}>
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && rows.length === 0 && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={7}>
                          <NoResults />
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((m) => (
                      <RosterRow
                        key={m.main}
                        {...rowProps(m)}
                        open={expanded.has(m.main)}
                        onToggle={() => toggleRow(m.main)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {/* Móvil: lista compacta */}
              <div className="flex flex-col gap-3 md:hidden">
                {myMember && <MobileMeCard {...rowProps(myMember)} />}
                <Card className="gap-0 px-4 py-1">
                  {rows.length === 0 && !isLoading && <NoResults />}
                  {rows
                    .filter((m) => m.main !== myCharacter)
                    .map((m) => (
                      <MobileRow key={m.main} {...rowProps(m)} />
                    ))}
                </Card>
              </div>
            </>
          ) : (
            <Card className="gap-0 overflow-hidden p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-32">Fecha</TableHead>
                    <TableHead>Personaje</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading &&
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!historyLoading && history.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4}>
                        <Empty className="py-12">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <History />
                            </EmptyMedia>
                            <EmptyTitle>
                              {historyDate ? "Sin movimientos ese día" : "Sin movimientos"}
                            </EmptyTitle>
                            <EmptyDescription>
                              Elige otra fecha o revisa todas las fechas.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  )}
                  {history.map((log, i) => {
                    const info = characterInfo.get(log.personaje.toLowerCase());
                    const main = memberByName.get(log.personaje.toLowerCase())?.main;
                    const mine = myNames.has(log.personaje.toLowerCase());
                    return (
                      <TableRow
                        key={`${log.fecha}-${log.hour}-${i}`}
                        className={cn(mine && "bg-highlight/5")}
                      >
                        <TableCell className="text-xs text-muted-foreground tabular">
                          <div className="text-foreground">{log.hour.slice(0, 5)}</div>
                          {log.fecha}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => main && openSheet(main)}
                            disabled={!main}
                            className="flex items-center gap-2 rounded-md text-left hover:underline disabled:no-underline"
                          >
                            <ClassIcon cls={info?.class} src={info?.icon} size={22} />
                            <CharacterName cls={info?.class}>{log.personaje}</CharacterName>
                          </button>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <ItemDescription text={log.descripcion} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono font-semibold tabular",
                            log.valor >= 0 ? "text-positive" : "text-negative",
                          )}
                        >
                          {formatSigned(log.valor)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}

      <CharacterHistorySheet
        member={sheetMember}
        rank={sheetMember ? rankOf.get(sheetMember.main) : undefined}
        open={!!sheetMember}
        onOpenChange={(o) => !o && closeSheet()}
      />
    </PageBody>
  );
}

function NoResults() {
  return (
    <Empty className="py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search />
        </EmptyMedia>
        <EmptyTitle>Sin resultados</EmptyTitle>
        <EmptyDescription>Prueba con otro nombre o quita el filtro de clase.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

interface RowProps {
  member: RosterMember;
  rank: number;
  max: number;
  delta?: number;
  last?: string;
  isMe: boolean;
  onPin: () => void;
  onHistory: () => void;
}

function deltaClass(delta?: number) {
  return !delta ? "text-muted-foreground" : delta > 0 ? "text-positive" : "text-negative";
}

function RosterRow({
  member,
  rank,
  max,
  delta,
  last,
  isMe,
  open,
  onToggle,
  onPin,
  onHistory,
}: RowProps & { open: boolean; onToggle: () => void }) {
  const meta = getClassMeta(member.class);
  const alters = member.alters ?? [];
  const pct = Math.max(0, Math.min(100, (member.amount / max) * 100));

  return (
    <Fragment>
      <TableRow className={cn("h-13", isMe && "bg-highlight/5 hover:bg-highlight/10")}>
        <TableCell
          className={cn(
            "text-center font-mono tabular",
            rank <= 3 ? "text-highlight" : "text-muted-foreground",
          )}
        >
          {rank}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onToggle}
              disabled={!alters.length}
              aria-expanded={open}
              aria-label={open ? "Ocultar alters" : "Mostrar alters"}
              className={cn(!alters.length && "invisible")}
            >
              {open ? <ChevronDown /> : <ChevronRight />}
            </Button>
            <ClassIcon cls={member.class} src={member.icon} size={30} />
            <button
              type="button"
              onClick={onHistory}
              className="truncate text-left hover:underline"
            >
              <CharacterName cls={member.class} className="font-semibold">
                {member.main}
              </CharacterName>
            </button>
            {isMe && (
              <Badge className="rounded-full bg-highlight/15 text-highlight hover:bg-highlight/15">
                Tú
              </Badge>
            )}
            {alters.length > 0 && (
              <Badge variant="outline" className="rounded-full font-normal text-muted-foreground">
                +{alters.length} {alters.length === 1 ? "alter" : "alters"}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="hidden text-muted-foreground lg:table-cell">
          {meta?.name ?? member.class}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3 pr-4">
            <span className="w-14 text-right font-mono font-semibold tabular">
              {formatPoints(member.amount)}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: meta?.hex ?? "var(--primary)" }}
              />
            </div>
          </div>
        </TableCell>
        <TableCell className={cn("text-right font-mono tabular", deltaClass(delta))}>
          {delta ? formatSigned(delta) : "0"}
        </TableCell>
        <TableCell className="hidden pl-6 text-xs text-muted-foreground xl:table-cell">
          {last ?? "—"}
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onPin}
                  aria-pressed={isMe}
                  aria-label="Fijar como mi personaje"
                >
                  <Star
                    className={cn(isMe ? "fill-highlight text-highlight" : "text-muted-foreground")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isMe ? "Dejar de fijar" : "Fijar como mi personaje"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onHistory}
                  aria-label="Ver historial"
                >
                  <History className="text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver historial</TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>
      {open &&
        alters.map((alt) => (
          <TableRow key={alt.name} className="bg-muted/30 hover:bg-muted/40">
            <TableCell />
            <TableCell>
              <div className="flex items-center gap-2.5 pl-8">
                <span className="-mt-3 h-3.5 w-3 shrink-0 rounded-bl-sm border-b border-l border-border" />
                <ClassIcon cls={alt.class} src={alt.icon} size={22} />
                <CharacterName cls={alt.class} className="text-sm">
                  {alt.name}
                </CharacterName>
                <span className="text-xs text-muted-foreground">alter</span>
              </div>
            </TableCell>
            <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
              {getClassMeta(alt.class)?.name ?? alt.class}
            </TableCell>
            <TableCell colSpan={4} className="text-xs text-muted-foreground">
              Comparte puntos con el main
            </TableCell>
          </TableRow>
        ))}
    </Fragment>
  );
}

function MobileMeCard({ member, rank, delta, onHistory }: RowProps) {
  return (
    <button
      type="button"
      onClick={onHistory}
      className="flex items-center gap-3 rounded-xl border border-highlight/30 bg-card p-3 text-left"
    >
      <ClassIcon cls={member.class} src={member.icon} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <CharacterName cls={member.class} className="truncate font-semibold">
            {member.main}
          </CharacterName>
          <span className="text-xs font-medium text-highlight">· Tú</span>
        </div>
        <span className="text-xs text-muted-foreground">
          #{rank} · {delta ? `${formatSigned(delta)} esta semana` : "sin cambios esta semana"}
        </span>
      </div>
      <span className="font-mono text-xl font-semibold tabular">{formatPoints(member.amount)}</span>
    </button>
  );
}

function MobileRow({ member, rank, max, delta, onHistory }: RowProps) {
  const meta = getClassMeta(member.class);
  return (
    <button
      type="button"
      onClick={onHistory}
      className="flex min-h-14 w-full items-center gap-3 border-b text-left last:border-b-0"
    >
      <span
        className={cn(
          "w-6 font-mono text-xs tabular",
          rank <= 3 ? "text-highlight" : "text-muted-foreground",
        )}
      >
        {rank}
      </span>
      <ClassIcon cls={member.class} src={member.icon} size={32} />
      <div className="min-w-0 flex-1">
        <CharacterName cls={member.class} className="block truncate font-semibold">
          {member.main}
        </CharacterName>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full"
            style={{ width: `${(member.amount / max) * 100}%`, background: meta?.hex }}
          />
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-mono text-sm font-semibold tabular">
          {formatPoints(member.amount)}
        </span>
        <span className={cn("font-mono text-[11px] tabular", deltaClass(delta))}>
          {delta ? formatSigned(delta) : "0"}
        </span>
      </div>
    </button>
  );
}
