"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Filter,
  Gem,
  History,
  Search,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { LootHistorySheet } from "@/components/loot/loot-history-sheet";
import { LootMatrix, LOOT_RAID_TABS, type LootCharacter, type LootItem } from "../types/Loot";
import { useMyCharacter } from "@/hooks/use-my-character";
import { useRoster } from "@/hooks/use-roster";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { formatPoints, itemQuality, itemUrl, refreshWowheadLinks } from "@/lib/wow";

type CellState = "own" | "alter" | "none";

export default function LootPage() {
  const [raid, setRaid] = useState(LOOT_RAID_TABS[0].value);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [itemFilter, setItemFilter] = useState<number[]>([]);
  const [focusItem, setFocusItem] = useState<number | null>(null);
  const [historyFor, setHistoryFor] = useState<LootCharacter | null>(null);
  const { myCharacter } = useMyCharacter();
  const { memberByName } = useRoster();
  const now = useNow();
  const [period, setPeriod] = useState<"all" | "30" | "7">("all");
  const [onlyWithWinner, setOnlyWithWinner] = useState(false);

  const { data, isLoading } = useQuery<LootMatrix>({
    queryKey: ["lootMatrix", raid],
    queryFn: async () => {
      const res = await fetch(`/api/loot/matrix?raid=${raid}`);
      if (!res.ok) throw new Error("Error al obtener la matriz de loot");
      return res.json();
    },
  });

  const { data: rules } = useQuery<Record<string, unknown>[]>({
    queryKey: ["reglas"],
    queryFn: async () => {
      const res = await fetch("/api/reglas");
      if (!res.ok) throw new Error("Error al obtener las reglas");
      return res.json();
    },
  });

  // Mínimo de puntos de cada ítem según las reglas de loteo (por id o por nombre).
  const minByItem = useMemo(() => {
    const map = new Map<string, number>();
    const section = (rules ?? []).find((r) => r["Reglas de Loteo"])?.["Reglas de Loteo"] as
      { items: { item: string; idItem?: number | null; valueMin: number }[] }[] | undefined;
    section?.forEach((r) =>
      r.items?.forEach((i) => {
        if (i.idItem) map.set(`id:${i.idItem}`, i.valueMin);
        map.set(`name:${i.item.toLowerCase()}`, i.valueMin);
      }),
    );
    return map;
  }, [rules]);
  const minFor = (item: LootItem) =>
    minByItem.get(`id:${item.id_item}`) ?? minByItem.get(`name:${item.name.toLowerCase()}`);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const characters = useMemo(() => data?.characters ?? [], [data?.characters]);

  // Los registros sin fecha (anteriores a la auditoría) solo cuentan en "Todo el historial".
  const periodWins = useMemo(() => {
    const wins = data?.wins ?? [];
    if (period === "all") return wins;
    const since = now - Number(period) * 24 * 3600 * 1000;
    return wins.filter((w) => w.created_at && parseISO(w.created_at).getTime() >= since);
  }, [data?.wins, period, now]);

  // personaje (minúsculas) → ítems ganados
  const winsByName = useMemo(() => {
    const map = new Map<string, Set<number>>();
    periodWins.forEach((w) => {
      const k = w.personaje.toLowerCase();
      if (!map.has(k)) map.set(k, new Set());
      map.get(k)!.add(w.id_item);
    });
    return map;
  }, [periodWins]);

  const won = (name: string, id: number) => !!winsByName.get(name.toLowerCase())?.has(id);

  const mainCell = (c: LootCharacter, id: number): CellState =>
    won(c.main, id) ? "own" : c.alters.some((a) => won(a.name, id)) ? "alter" : "none";

  // Ganadores por ítem (main o alter), para el panel lateral y los contadores.
  const winnersByItem = useMemo(() => {
    const map = new Map<number, { name: string; class: string; icon: string; main: string }[]>();
    characters.forEach((c) => {
      [{ name: c.main, class: c.class, icon: c.icon }, ...c.alters].forEach((p) => {
        winsByName.get(p.name.toLowerCase())?.forEach((id) => {
          if (!map.has(id)) map.set(id, []);
          map.get(id)!.push({ ...p, main: c.main });
        });
      });
    });
    return map;
  }, [characters, winsByName]);

  const visibleItems = useMemo(
    () =>
      (itemFilter.length ? items.filter((i) => itemFilter.includes(i.id_item)) : items).filter(
        (i) => !onlyWithWinner || (winnersByItem.get(i.id_item)?.length ?? 0) > 0,
      ),
    [items, itemFilter, onlyWithWinner, winnersByItem],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return characters
      .filter(
        (c) =>
          !q ||
          c.main.toLowerCase().includes(q) ||
          c.alters.some((a) => a.name.toLowerCase().includes(q)),
      )
      .filter((c) => !itemFilter.length || itemFilter.some((id) => mainCell(c, id) !== "none"))
      .sort((a, b) => (a.main === myCharacter ? -1 : b.main === myCharacter ? 1 : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters, search, itemFilter, myCharacter, winsByName]);

  const expandable = useMemo(
    () => characters.filter((c) => c.alters.length).map((c) => c.main),
    [characters],
  );
  const allExpanded = expandable.length > 0 && expandable.every((m) => expanded.has(m));

  // Por defecto se enfoca el ítem más repartido.
  const defaultFocus = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          (winnersByItem.get(b.id_item)?.length ?? 0) - (winnersByItem.get(a.id_item)?.length ?? 0),
      )[0]?.id_item ?? null,
    [items, winnersByItem],
  );
  const focusId = focusItem ?? defaultFocus;
  const focused = focusId != null ? items.find((i) => i.id_item === focusId) : undefined;
  const focusedMin = focused ? minFor(focused) : undefined;

  // Mains que alcanzan el mínimo de puntos del ítem y aún no lo tienen (ni ellos ni sus alters).
  const eligible = useMemo(() => {
    if (!focused || focusedMin == null) return [];
    return characters
      .filter(
        (c) =>
          (memberByName.get(c.main.toLowerCase())?.amount ?? 0) >= focusedMin &&
          mainCell(c, focused.id_item) === "none",
      )
      .sort(
        (a, b) =>
          (memberByName.get(b.main.toLowerCase())?.amount ?? 0) -
          (memberByName.get(a.main.toLowerCase())?.amount ?? 0),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, focusedMin, characters, memberByName, winsByName]);

  const classOf = useMemo(() => {
    const map = new Map<string, { class: string; icon: string }>();
    characters.forEach((c) => {
      map.set(c.main.toLowerCase(), { class: c.class, icon: c.icon });
      c.alters.forEach((a) => map.set(a.name.toLowerCase(), { class: a.class, icon: a.icon }));
    });
    return map;
  }, [characters]);

  const recent = useMemo(
    () =>
      [...periodWins]
        .filter((w) => w.created_at)
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
        .slice(0, 8)
        .map((w) => ({ ...w, item: items.find((i) => i.id_item === w.id_item) })),
    [periodWins, items],
  );

  useEffect(() => {
    refreshWowheadLinks();
  }, [data, focusId]);

  const changeRaid = (value: string) => {
    setRaid(value);
    setItemFilter([]);
    setFocusItem(null);
    setOnlyWithWinner(false);
  };

  return (
    <PageBody className="max-w-[1600px]">
      <PageHeader
        title="Matriz de botín"
        description="Quién tiene qué en cada raid. Pasa el cursor por un ícono para ver el tooltip del ítem."
        actions={
          <Tabs value={raid} onValueChange={changeRaid}>
            <TabsList>
              {LOOT_RAID_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value} title={t.label}>
                  <span className="sm:hidden">{t.short}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar personaje…"
            aria-label="Buscar personaje"
            className="h-9 pl-8"
          />
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="h-9! w-44 bg-card" aria-label="Periodo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el historial</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="7">Últimos 7 días</SelectItem>
          </SelectContent>
        </Select>
        <Label className="flex h-9 items-center gap-2 font-normal">
          <Switch checked={onlyWithWinner} onCheckedChange={setOnlyWithWinner} />
          Solo ítems con ganador
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9">
              <Filter /> Filtrar ítems
              {itemFilter.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5">{itemFilter.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar ítem…" />
              <CommandList>
                <CommandEmpty>Sin resultados.</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => {
                    const on = itemFilter.includes(item.id_item);
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.name}
                        onSelect={() =>
                          setItemFilter((prev) =>
                            on ? prev.filter((id) => id !== item.id_item) : [...prev, item.id_item],
                          )
                        }
                      >
                        <ItemIcon
                          src={item.icon}
                          name={item.name}
                          quality={itemQuality(item.id_item)}
                          size={24}
                        />
                        <span className="flex-1 truncate">{item.name}</span>
                        <Check className={cn("size-4", on ? "opacity-100" : "opacity-0")} />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {itemFilter.length > 0 && (
          <Button variant="ghost" className="h-9" onClick={() => setItemFilter([])}>
            <X /> Quitar filtro
          </Button>
        )}
        <Button
          variant="outline"
          className="h-9"
          onClick={() => setExpanded(allExpanded ? new Set() : new Set(expandable))}
          disabled={!expandable.length}
        >
          {allExpanded ? <ChevronsDownUp /> : <ChevronsUpDown />}
          {allExpanded ? "Colapsar alters" : "Expandir alters"}
        </Button>
        <div className="ml-auto hidden items-center gap-4 text-xs text-muted-foreground md:flex">
          <span className="flex items-center gap-1.5">
            <CellMark state="own" small /> Ganado
          </span>
          <span className="flex items-center gap-1.5">
            <CellMark state="alter" small /> Ganado por un alter
          </span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="gap-0 overflow-hidden p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Gem />
                </EmptyMedia>
                <EmptyTitle>
                  {itemFilter.length ? "Nadie ganó esos ítems todavía" : "Sin resultados"}
                </EmptyTitle>
                <EmptyDescription>Prueba con otro nombre o cambia el filtro.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="max-h-[calc(100svh-260px)] overflow-auto">
              <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th className="sticky top-0 left-0 z-30 min-w-56 border-b bg-card px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                      Jugador
                    </th>
                    {visibleItems.map((item) => (
                      <th
                        key={item.id}
                        className={cn(
                          "sticky top-0 z-20 border-b bg-card px-1 py-2",
                          focusId === item.id_item && "bg-primary/10",
                        )}
                      >
                        <ItemHeader
                          item={item}
                          count={winnersByItem.get(item.id_item)?.length ?? 0}
                          active={focusId === item.id_item}
                          onClick={() =>
                            setFocusItem(focusId === item.id_item ? null : item.id_item)
                          }
                        />
                      </th>
                    ))}
                    <th className="sticky top-0 z-20 border-b bg-card px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => {
                    const open = expanded.has(c.main);
                    const isMe = c.main === myCharacter;
                    const total = visibleItems.filter((i) => won(c.main, i.id_item)).length;
                    return (
                      <Fragment key={c.main}>
                        <tr className={cn("group", isMe && "bg-highlight/5")}>
                          <td
                            className={cn(
                              "sticky left-0 z-10 border-b bg-card px-3 py-1.5 group-hover:bg-muted",
                              isMe && "bg-highlight/5",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className={cn(!c.alters.length && "invisible")}
                                onClick={() =>
                                  setExpanded((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(c.main)) next.delete(c.main);
                                    else next.add(c.main);
                                    return next;
                                  })
                                }
                                aria-expanded={open}
                                aria-label={open ? "Ocultar alters" : "Mostrar alters"}
                              >
                                {open ? <ChevronDown /> : <ChevronRight />}
                              </Button>
                              <ClassIcon cls={c.class} src={c.icon} size={26} />
                              <CharacterName cls={c.class} className="truncate font-semibold">
                                {c.main}
                              </CharacterName>
                              {c.alters.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  +{c.alters.length}
                                </span>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="ml-auto text-muted-foreground"
                                    onClick={() => setHistoryFor(c)}
                                    aria-label={`Historial de loot de ${c.main}`}
                                  >
                                    <History />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Historial de loot</TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                          {visibleItems.map((item) => (
                            <td
                              key={item.id}
                              className={cn(
                                "border-b px-1 py-1.5 text-center group-hover:bg-muted/60",
                                focusId === item.id_item && "bg-primary/5",
                              )}
                            >
                              <CellMark state={mainCell(c, item.id_item)} />
                            </td>
                          ))}
                          <td className="border-b px-4 text-right font-mono font-semibold tabular group-hover:bg-muted/60">
                            {total}
                          </td>
                        </tr>
                        {open &&
                          c.alters.map((a) => (
                            <tr key={a.name} className="bg-muted/30">
                              <td className="sticky left-0 z-10 border-b bg-muted px-3 py-1.5">
                                <div className="flex items-center gap-2 pl-8">
                                  <ClassIcon cls={a.class} src={a.icon} size={20} />
                                  <CharacterName cls={a.class} className="truncate text-xs">
                                    {a.name}
                                  </CharacterName>
                                </div>
                              </td>
                              {visibleItems.map((item) => (
                                <td key={item.id} className="border-b px-1 py-1.5 text-center">
                                  <CellMark
                                    state={won(a.name, item.id_item) ? "own" : "none"}
                                    small
                                  />
                                </td>
                              ))}
                              <td className="border-b px-4 text-right font-mono text-xs text-muted-foreground tabular">
                                {visibleItems.filter((i) => won(a.name, i.id_item)).length}
                              </td>
                            </tr>
                          ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <aside className="flex flex-col overflow-hidden rounded-xl border bg-card xl:max-h-[calc(100svh-200px)]">
          {focused && (
            <>
              <div className="flex items-center gap-3 border-b p-4">
                <ItemIcon
                  src={focused.icon}
                  name={focused.name}
                  quality={itemQuality(focused.id_item)}
                  size={40}
                />
                <div className="min-w-0">
                  <a
                    href={itemUrl(focused.id_item)}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "block truncate font-semibold hover:underline",
                      itemNameClass(itemQuality(focused.id_item)),
                    )}
                  >
                    {focused.name}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {raid} · {winnersByItem.get(focused.id_item)?.length ?? 0} ganadores
                    {focusedMin != null && ` · mín. ${formatPoints(focusedMin)} pts`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 border-b p-4">
                <span className="text-xs font-medium text-muted-foreground">Ganadores</span>
                <div className="flex flex-wrap gap-1.5">
                  {(winnersByItem.get(focused.id_item) ?? []).map((w) => (
                    <span
                      key={w.name}
                      className="flex h-7 items-center gap-1.5 rounded-md border pr-2 pl-1 text-xs"
                    >
                      <ClassIcon cls={w.class} src={w.icon} size={20} />
                      <CharacterName cls={w.class}>{w.name}</CharacterName>
                    </span>
                  ))}
                  {!winnersByItem.get(focused.id_item)?.length && (
                    <p className="text-sm text-muted-foreground">Nadie lo ha ganado todavía.</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 border-b p-4">
                <span className="text-xs font-medium text-muted-foreground">
                  Pueden lotearla{" "}
                  {focusedMin != null ? "(alcanzan el mínimo y aún no la tienen)" : ""}
                </span>
                {focusedMin == null ? (
                  <p className="text-sm text-muted-foreground">
                    Este ítem no tiene regla de loteo.
                  </p>
                ) : eligible.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nadie cumple el mínimo.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {eligible.slice(0, 12).map((c) => (
                      <span
                        key={c.main}
                        className="flex h-7 items-center gap-1.5 rounded-md border pr-2 pl-1 text-xs"
                      >
                        <ClassIcon cls={c.class} src={c.icon} size={20} />
                        <CharacterName cls={c.class}>{c.main}</CharacterName>
                      </span>
                    ))}
                    {eligible.length > 12 && (
                      <span className="flex h-7 items-center rounded-md px-2 text-xs text-muted-foreground">
                        +{eligible.length - 12} más
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
          <div className="px-4 pt-4 pb-1 text-xs font-medium text-muted-foreground">
            Historial reciente
          </div>
          {recent.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-muted-foreground">
              {isLoading ? "Cargando…" : "Sin registros con fecha en este periodo."}
            </p>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {recent.map((w) => {
                const who = classOf.get(w.personaje.toLowerCase());
                return (
                  <li key={w.id} className="flex gap-2.5 border-b px-4 py-2.5 last:border-b-0">
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        w.source === "manual" ? "bg-highlight" : "bg-primary",
                      )}
                    />
                    <div className="min-w-0 text-sm">
                      <p>
                        <CharacterName cls={who?.class} className="font-medium">
                          {w.personaje}
                        </CharacterName>
                        <span className="text-muted-foreground"> ganó </span>
                        <span className={itemNameClass(itemQuality(w.id_item))}>
                          {w.item?.name ?? `#${w.id_item}`}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(w.created_at!), "d MMM, HH:mm", { locale: es })}
                        {w.source === "manual" && " · registro manual"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>

      <LootHistorySheet
        main={
          historyFor
            ? {
                name: historyFor.main,
                class: historyFor.class,
                icon: historyFor.icon,
                alters: historyFor.alters.map((a) => a.name),
              }
            : null
        }
        open={!!historyFor}
        onOpenChange={(o) => !o && setHistoryFor(null)}
      />
    </PageBody>
  );
}

function ItemHeader({
  item,
  count,
  active,
  onClick,
}: {
  item: LootItem;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-pressed={active}
          aria-label={item.name}
          className="mx-auto flex w-11 flex-col items-center gap-1 rounded-md py-0.5 hover:bg-muted"
        >
          <ItemIcon
            src={item.icon}
            name={item.name}
            quality={itemQuality(item.id_item)}
            size={30}
          />
          <span className="font-mono text-[10px] text-muted-foreground tabular">{count}×</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{item.name}</TooltipContent>
    </Tooltip>
  );
}

function CellMark({ state, small }: { state: CellState; small?: boolean }) {
  const size = small ? "size-4" : "size-5";
  if (state === "none")
    return (
      <span
        className={cn("mx-auto block rounded-md border border-dashed border-border/70", size)}
      />
    );
  return (
    <span
      className={cn(
        "mx-auto flex items-center justify-center rounded-md",
        size,
        state === "own"
          ? "bg-primary text-primary-foreground"
          : "bg-primary/15 text-primary ring-1 ring-primary ring-inset",
      )}
      aria-label={state === "own" ? "Ganado" : "Ganado por un alter"}
    >
      <Check className={small ? "size-3" : "size-3.5"} strokeWidth={3} />
    </span>
  );
}
