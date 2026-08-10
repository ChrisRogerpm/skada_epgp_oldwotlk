"use client";

import { Fragment, useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Gem, Search, CheckCircle2, Loader2, History, ChevronDown, ChevronUp, ChevronsDownUp, ChevronsUpDown, Sparkles, Filter } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CLASS_ICONS, CLASS_HEX, DEFAULT_ICONS } from "@/src/domain/constants/constants";
import { LootMatrix, LOOT_RAID_TABS } from "../types/Loot";
import LootHistoryModal from "../components/LootHistoryModal";

export default function LootPage() {
  const [raid, setRaid] = useState(LOOT_RAID_TABS[0].value);
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedMember, setSelectedMember] = useState<{ main: string; alters: string[] } | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Filtro por ítems: acota las columnas visibles y, si hay alguno elegido,
  // solo muestra a los personajes que ganaron al menos uno de ellos.
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [isItemFilterOpen, setIsItemFilterOpen] = useState(false);
  const [itemFilterSearch, setItemFilterSearch] = useState("");

  const { data, isLoading } = useQuery<LootMatrix>({
    queryKey: ["lootMatrix", raid],
    queryFn: async () => {
      const res = await fetch(`/api/loot/matrix?raid=${raid}`);
      if (!res.ok) throw new Error("Error al obtener la matriz de loot");
      return res.json();
    },
  });

  const items = useMemo(() => data?.items || [], [data?.items]);
  const characters = data?.characters;

  // Mapa "personaje en minúsculas -> Set de id_item ganados" para O(1) lookup por celda.
  const winsMap = useMemo(() => {
    const map = new Map<string, Set<number>>();
    (data?.wins || []).forEach((win) => {
      const key = win.personaje.toLowerCase();
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(win.id_item);
    });
    return map;
  }, [data?.wins]);

  const hasWon = (personaje: string, id_item: number) => !!winsMap.get(personaje.toLowerCase())?.has(id_item);
  const wonAnySelectedItem = (personaje: string) => selectedItemIds.some((id) => hasWon(personaje, id));

  // Columnas visibles: todos los ítems del raid, o solo los elegidos en el filtro.
  const visibleItems = useMemo(
    () => (selectedItemIds.length > 0 ? items.filter((i) => selectedItemIds.includes(i.id_item)) : items),
    [items, selectedItemIds],
  );

  const itemFilterResults = useMemo(() => {
    if (!itemFilterSearch) return items;
    const lower = itemFilterSearch.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(lower));
  }, [items, itemFilterSearch]);

  const filteredCharacters = useMemo(() => {
    const list = characters || [];
    if (!search) return list;
    const lower = search.toLowerCase();
    return list.filter(
      (c) => c.main.toLowerCase().includes(lower) || c.alters.some((a) => a.name.toLowerCase().includes(lower)),
    );
  }, [characters, search]);

  // Con filtro de ítems activo, no interesa el árbol main→alters completo:
  // se arma una lista plana con SOLO los personajes (main o alt puntual) que
  // ganaron alguno de los ítems elegidos.
  const itemFilterWinners = useMemo(() => {
    if (selectedItemIds.length === 0) return null;

    const winners: { name: string; class: string; icon: string; mainName: string; isMain: boolean }[] = [];
    (characters || []).forEach((c) => {
      if (wonAnySelectedItem(c.main)) {
        winners.push({ name: c.main, class: c.class, icon: c.icon, mainName: c.main, isMain: true });
      }
      c.alters.forEach((a) => {
        if (wonAnySelectedItem(a.name)) {
          winners.push({ name: a.name, class: a.class, icon: a.icon, mainName: c.main, isMain: false });
        }
      });
    });

    if (!search) return winners;
    const lower = search.toLowerCase();
    return winners.filter((w) => w.name.toLowerCase().includes(lower));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters, selectedItemIds, search, winsMap]);

  const toggleItemFilter = (id_item: number) => {
    setSelectedItemIds((prev) => (prev.includes(id_item) ? prev.filter((id) => id !== id_item) : [...prev, id_item]));
  };

  const toggleRow = (main: string) => {
    const next = new Set(expandedRows);
    if (next.has(main)) next.delete(main);
    else next.add(main);
    setExpandedRows(next);
  };

  // Mains con alters (los únicos que realmente colapsan/expanden algo).
  const expandableMains = useMemo(() => (characters || []).filter((c) => c.alters.length > 0).map((c) => c.main), [characters]);
  const allExpanded = expandableMains.length > 0 && expandableMains.every((m) => expandedRows.has(m));

  const toggleExpandAll = () => {
    setExpandedRows(allExpanded ? new Set() : new Set(expandableMains));
  };

  const openHistory = (main: string, alters: string[]) => {
    setSelectedMember({ main, alters });
    setIsHistoryOpen(true);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-black text-slate-800 dark:text-slate-200 p-4 md:p-8 lg:p-12 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-md">
                <Gem className="text-purple-400" size={28} />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 font-display">
                Registro de Loot
              </h1>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Sparkles size={14} className="text-purple-500" />
              <p className="text-sm font-bold tracking-wide uppercase opacity-80">
                Quién ganó qué ítem, por raid.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="flex bg-white dark:bg-slate-900/80 p-1.5 rounded-xl border border-slate-300 dark:border-slate-700/60 shadow-inner w-full sm:w-auto">
              {LOOT_RAID_TABS.map((tab) => (
                <Button
                  key={tab.value}
                  variant="ghost"
                  aria-pressed={raid === tab.value}
                  onClick={() => {
                    setRaid(tab.value);
                    setSelectedItemIds([]);
                    setItemFilterSearch("");
                    setIsItemFilterOpen(false);
                  }}
                  className={clsx(
                    "h-auto flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold font-display uppercase tracking-wide",
                    raid === tab.value
                      ? "bg-slate-100 dark:bg-slate-800 text-purple-400 shadow-md border border-slate-300 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-purple-400"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50",
                  )}
                >
                  {tab.value}
                </Button>
              ))}
            </div>
            <div className="relative group w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
              </div>
              <Input
                type="text"
                placeholder="Buscar personaje..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-auto bg-white dark:bg-slate-900/80 border-slate-300 dark:border-slate-700/60 rounded-xl py-2 pl-9 pr-4 text-sm placeholder-slate-500 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 shadow-inner"
              />
            </div>

            <div className="relative shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsItemFilterOpen((v) => !v)}
                aria-expanded={isItemFilterOpen}
                className={clsx(
                  "h-auto gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide",
                  selectedItemIds.length > 0
                    ? "bg-purple-500/10 border-purple-500/40 text-purple-400 hover:bg-purple-500/10 hover:text-purple-400"
                    : "bg-white dark:bg-slate-900/80 border-slate-300 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-purple-400 hover:border-purple-500/40",
                )}
              >
                <Filter size={16} />
                <span className="hidden sm:inline">Filtrar ítems</span>
                {selectedItemIds.length > 0 && (
                  <Badge className="rounded-full bg-purple-500/20 text-purple-400 border-none px-1.5">{selectedItemIds.length}</Badge>
                )}
              </Button>

              {isItemFilterOpen && (
                <div className="absolute z-50 right-0 mt-1 w-72 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] overflow-hidden animate-in fade-in slide-in-from-top-1 flex flex-col">
                  <div className="p-2 border-b border-white/5 relative shrink-0">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                    <input
                      type="text"
                      autoFocus
                      value={itemFilterSearch}
                      onChange={(e) => setItemFilterSearch(e.target.value)}
                      placeholder="Buscar ítem..."
                      className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none focus-visible:border-purple-500/50"
                    />
                  </div>

                  <div className="max-h-[280px] overflow-y-auto">
                    {itemFilterResults.map((item) => {
                      const isSelected = selectedItemIds.includes(item.id_item);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleItemFilter(item.id_item)}
                          className={clsx(
                            "w-full flex items-center gap-3 p-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none text-left",
                            isSelected && "bg-purple-500/5",
                          )}
                        >
                          <div className="relative w-8 h-8 rounded-lg border border-purple-500/30 overflow-hidden shrink-0">
                            <Image src={item.icon} alt={item.name} fill sizes="32px" className="object-cover" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate flex-1">{item.name}</span>
                          {isSelected && <CheckCircle2 className="text-purple-400 shrink-0" size={16} />}
                        </button>
                      );
                    })}
                    {itemFilterResults.length === 0 && (
                      <p className="p-3 text-xs text-slate-500 font-bold uppercase">Sin resultados</p>
                    )}
                  </div>

                  <div className="p-2 border-t border-white/5 flex gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={selectedItemIds.length === 0}
                      onClick={() => setSelectedItemIds([])}
                      className="h-auto flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-lg uppercase tracking-widest text-[10px] hover:text-slate-900 dark:hover:text-white"
                    >
                      Limpiar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsItemFilterOpen(false)}
                      className="h-auto flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-lg uppercase tracking-widest text-[10px]"
                    >
                      Listo
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={toggleExpandAll}
              disabled={expandableMains.length === 0 || itemFilterWinners !== null}
              className="h-auto gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900/80 border-slate-300 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wide shrink-0 hover:text-purple-400 hover:border-purple-500/40 disabled:opacity-40"
              title={allExpanded ? "Colapsar todos los alters" : "Expandir todos los alters"}
            >
              {allExpanded ? <ChevronsDownUp size={16} /> : <ChevronsUpDown size={16} />}
              <span className="hidden sm:inline">{allExpanded ? "Colapsar todo" : "Expandir todo"}</span>
            </Button>
          </div>
        </header>

        <Card className="gap-0 p-0 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-xl backdrop-blur-sm min-h-[50vh] relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Cargando matriz de {raid}...</p>
            </div>
          ) : (
            <>
              <Table containerClassName="overflow-y-auto max-h-[calc(100vh-260px)]">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold select-none">
                    <TableHead className="sticky top-0 left-0 z-30 bg-slate-50 dark:bg-slate-950 shadow-[0_1px_0_0] shadow-slate-200 dark:shadow-slate-800 px-4 py-3 min-w-[220px]">
                      Personaje
                    </TableHead>
                    {visibleItems.map((item) => (
                      <TableHead key={item.id} className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 shadow-[0_1px_0_0] shadow-slate-200 dark:shadow-slate-800 px-2 py-3 text-center min-w-[56px]">
                        <a
                          href={`https://wotlk.ultimowow.com/es/?item=${item.id_item}`}
                          target="_blank"
                          rel="noreferrer"
                          title={item.name}
                          className="flex flex-col items-center gap-1 group/head"
                        >
                          <div className="relative w-8 h-8 rounded-lg border border-purple-500/30 overflow-hidden shrink-0 shadow group-hover/head:border-purple-500/70 transition-colors">
                            <Image src={item.icon} alt={item.name} fill sizes="32px" className="object-cover" />
                          </div>
                        </a>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-800/40">
                  {itemFilterWinners !== null ? (
                    itemFilterWinners.length > 0 ? (
                      itemFilterWinners.map((winner) => {
                        const classUpper = winner.class?.toUpperCase() || "";
                        return (
                          <TableRow key={winner.name} className="group">
                            <TableCell className="sticky left-0 z-10 bg-white dark:bg-slate-900/95 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="relative w-7 h-7 rounded border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                  <Image
                                    src={CLASS_ICONS[classUpper] || DEFAULT_ICONS.UNKNOWN}
                                    alt={winner.class}
                                    fill
                                    sizes="28px"
                                    className="object-cover"
                                  />
                                </div>
                                <span className="font-semibold text-sm truncate" style={{ color: CLASS_HEX[classUpper] }}>
                                  {winner.name}
                                </span>
                                {!winner.isMain && (
                                  <Badge className="rounded font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700/50 shrink-0">
                                    alt de {winner.mainName}
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => openHistory(winner.name, [])}
                                  className="ml-auto rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-400 shrink-0"
                                  title="Ver historial de loot"
                                >
                                  <History size={13} />
                                </Button>
                              </div>
                            </TableCell>
                            {visibleItems.map((item) => (
                              <TableCell key={item.id} className="px-2 py-2.5 text-center">
                                {hasWon(winner.name, item.id_item) ? (
                                  <CheckCircle2 className="mx-auto text-emerald-400" size={18} />
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700">—</span>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={visibleItems.length + 1} className="px-4 py-16 text-center text-slate-600 dark:text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Gem size={32} className="text-slate-600" />
                            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Nadie ganó los ítems elegidos todavía</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  ) : filteredCharacters.length > 0 ? (
                    filteredCharacters.map((member) => {
                      const classUpper = member.class?.toUpperCase() || "";
                      const isExpanded = expandedRows.has(member.main);
                      return (
                        <Fragment key={member.main}>
                          <TableRow className="group">
                            <TableCell className="sticky left-0 z-10 bg-white dark:bg-slate-900/95 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60 px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                {member.alters.length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleRow(member.main)}
                                    aria-expanded={isExpanded}
                                    className="text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0"
                                  >
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </button>
                                ) : (
                                  <span className="w-4 shrink-0" />
                                )}
                                <div className="relative w-7 h-7 rounded border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                  <Image
                                    src={CLASS_ICONS[classUpper] || DEFAULT_ICONS.UNKNOWN}
                                    alt={member.class}
                                    fill
                                    sizes="28px"
                                    className="object-cover"
                                  />
                                </div>
                                <span className="font-semibold text-sm truncate" style={{ color: CLASS_HEX[classUpper] }}>
                                  {member.main}
                                </span>
                                {member.alters.length > 0 && (
                                  <Badge className="rounded font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700/50 shrink-0">
                                    +{member.alters.length}
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => openHistory(member.main, member.alters.map((a) => a.name))}
                                  className="ml-auto rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-400 shrink-0"
                                  title="Ver historial de loot"
                                >
                                  <History size={13} />
                                </Button>
                              </div>
                            </TableCell>
                            {visibleItems.map((item) => (
                              <TableCell key={item.id} className="px-2 py-2.5 text-center">
                                {hasWon(member.main, item.id_item) ? (
                                  <CheckCircle2 className="mx-auto text-emerald-400" size={18} />
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-700">—</span>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>

                          {isExpanded &&
                            member.alters.map((alt) => {
                              const altClassUpper = alt.class?.toUpperCase() || "";
                              return (
                                <TableRow key={`${member.main}-${alt.name}`} className="bg-slate-50/50 dark:bg-slate-950/40">
                                  <TableCell className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-950/95 px-4 py-2">
                                    <div className="flex items-center gap-2 pl-6">
                                      <div className="relative w-6 h-6 rounded border border-slate-300 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                        <Image
                                          src={CLASS_ICONS[altClassUpper] || DEFAULT_ICONS.UNKNOWN}
                                          alt={alt.class}
                                          fill
                                          sizes="24px"
                                          className="object-cover"
                                        />
                                      </div>
                                      <span className="text-xs font-bold truncate" style={{ color: CLASS_HEX[altClassUpper] }}>
                                        {alt.name}
                                      </span>
                                    </div>
                                  </TableCell>
                                  {visibleItems.map((item) => (
                                    <TableCell key={item.id} className="px-2 py-2 text-center">
                                      {hasWon(alt.name, item.id_item) ? (
                                        <CheckCircle2 className="mx-auto text-emerald-400" size={16} />
                                      ) : (
                                        <span className="text-slate-300 dark:text-slate-700">—</span>
                                      )}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              );
                            })}
                        </Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={visibleItems.length + 1} className="px-4 py-16 text-center text-slate-600 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Search size={32} className="text-slate-600" />
                          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">No se encontraron personajes</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </Card>
      </div>

      <LootHistoryModal
        mainName={selectedMember?.main || ""}
        alters={selectedMember?.alters || []}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </main>
  );
}
