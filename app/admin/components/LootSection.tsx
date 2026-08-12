"use client";

import Image from "next/image";
import clsx from "clsx";
import { Edit3, Gem, History, Loader2, Plus, Search, Swords, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { LOOT_RAID_TABS } from "@/app/types/Loot";
import { useLootAdmin } from "../hooks/useLootAdmin";
import { AdminStatus } from "../types";
import ItemSearchPicker from "./shared/ItemSearchPicker";

interface LootSectionProps {
  search: string;
  onStatus: (status: AdminStatus) => void;
}

export default function LootSection({ search, onStatus }: LootSectionProps) {
  const {
    wins,
    totalItems,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    isSaving,
    isSearchingChar,
    charSearchResults,
    itemOptions,
    winForm,
    setWinForm,
    searchCharacters,
    selectSearchResult,
    editWin,
    resetForm,
    saveWin,
    deleteWin,
  } = useLootAdmin(search, onStatus);

  // Editar un registro existente siempre es de un solo ítem (es una fila);
  // registrar uno nuevo admite elegir varios de una sola vez.
  const isMultiSelect = !winForm.id;

  const toggleItem = (id_item: number) => {
    if (!isMultiSelect) {
      setWinForm((prev) => ({ ...prev, id_items: [id_item] }));
      return;
    }
    setWinForm((prev) => ({
      ...prev,
      id_items: prev.id_items.includes(id_item) ? prev.id_items.filter((id) => id !== id_item) : [...prev.id_items, id_item],
    }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORMULARIO DE REGISTRO */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="gap-0 bg-white dark:bg-slate-900/60 rounded-[2.5rem] border border-black/10 dark:border-white/10 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl border border-purple-500/20 flex items-center justify-center">
                <Plus className="text-purple-400" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {winForm.id ? "Editar Registro" : "Registrar Loot"}
                </h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quién ganó qué ítem</p>
              </div>
            </div>

            <form onSubmit={saveWin} className="space-y-6">
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Personaje</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-400 transition-colors pointer-events-none z-10" size={18} />
                  <Input
                    type="text"
                    value={winForm.personaje}
                    placeholder="Nombre del main o alter..."
                    onChange={(e) => {
                      setWinForm({ ...winForm, personaje: e.target.value });
                      searchCharacters(e.target.value);
                    }}
                    className="h-auto w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus-visible:ring-purple-500/20 focus-visible:border-purple-500/40 placeholder:text-slate-700"
                  />
                  {isSearchingChar && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 animate-spin" size={16} />
                  )}
                </div>

                {charSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] overflow-hidden animate-in fade-in slide-in-from-top-1 max-h-[280px] overflow-y-auto">
                    {charSearchResults.map((char, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectSearchResult(char)}
                        className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-black/10 dark:border-white/10 overflow-hidden shrink-0">
                          {char.url_icono ? (
                            <Image src={char.url_icono} alt={char.clase} width={32} height={32} unoptimized className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-[10px]">
                              {char.nombre_alter[0]}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate">{char.nombre_alter}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter truncate">
                            {char.main} • {char.clase}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Raid</label>
                <div className="flex gap-2">
                  {LOOT_RAID_TABS.map((tab) => (
                    <Button
                      key={tab.value}
                      type="button"
                      variant="ghost"
                      aria-pressed={winForm.raid === tab.value}
                      onClick={() => setWinForm({ ...winForm, raid: tab.value, id_items: [] })}
                      className={clsx(
                        "h-auto flex-1 gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest",
                        winForm.raid === tab.value
                          ? "bg-purple-500/10 text-purple-400 shadow-lg border border-purple-500/20 hover:bg-purple-500/10 hover:text-purple-400"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800",
                      )}
                    >
                      <Swords size={14} /> {tab.value}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  {isMultiSelect ? "Ítems (podés elegir varios)" : "Ítem"}
                </label>
                <div className="mt-2">
                  <ItemSearchPicker
                    items={itemOptions}
                    selectedIds={winForm.id_items}
                    onToggle={toggleItem}
                    multiple={isMultiSelect}
                    triggerLabel={`Selecciona ${isMultiSelect ? "uno o más ítems" : "un ítem"} de ${winForm.raid}...`}
                    emptyLabel={`Sin ítems para ${winForm.raid}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nota (opcional)</label>
                <textarea
                  value={winForm.note}
                  onChange={(e) => setWinForm({ ...winForm, note: e.target.value })}
                  placeholder="Contexto adicional, ej. reporte del oficial, loot histórico, etc."
                  rows={3}
                  className="h-auto w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus-visible:border-purple-500/50 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving || !winForm.personaje || winForm.id_items.length === 0}
                  className="h-auto flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-slate-900 dark:text-white font-black py-4 rounded-2xl shadow-xl shadow-purple-900/20 uppercase tracking-widest text-xs"
                >
                  {isSaving ? <Loader2 className="animate-spin mx-auto" size={20} /> : winForm.id ? "Actualizar" : "Registrar"}
                </Button>

                {winForm.id && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                    className="h-auto px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white font-black rounded-2xl uppercase tracking-widest text-[10px]"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>

        {/* LISTADO DE REGISTROS */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="gap-0 p-0 bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Registros de Loot</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sync automático + registros manuales</p>
              </div>
              <Badge className="rounded-full bg-white/5 text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-black/10 dark:border-white/10">
                {totalItems} Registros
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-950/40">
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ítem</TableHead>
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Personaje</TableHead>
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Raid</TableHead>
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Origen</TableHead>
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-white/5">
                  {wins.map((win) => (
                    <TableRow key={win.id} className="group">
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-lg border border-purple-500/30 overflow-hidden shrink-0">
                            {win.item_icon && <Image src={win.item_icon} alt={win.item_name} fill unoptimized sizes="36px" className="object-cover" />}
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{win.item_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{win.personaje}</span>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <div className="flex flex-col">
                          <Badge className="w-fit rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-widest">
                            {win.item_raid}
                          </Badge>
                          {win.id_raids ? (
                            <span className="text-[10px] text-slate-500 mt-1">{win.boss_name} • {win.raid_date}</span>
                          ) : (
                            <span
                              className="flex items-center gap-1 text-[10px] text-amber-500 mt-1 font-bold uppercase"
                              title={win.note || "Sin sesión de raid registrada"}
                            >
                              <History size={10} /> Legacy{win.note ? ` • ${win.note}` : ""}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <Badge
                          className={clsx(
                            "rounded uppercase tracking-widest border",
                            win.source === "manual"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/20",
                          )}
                        >
                          {win.source === "manual" ? "Manual" : "Sync"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon-sm" onClick={() => editWin(win)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            <Edit3 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => deleteWin(win.id)}
                            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {wins.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Gem className="text-slate-700" size={32} />
                          <p className="text-slate-500 text-xs font-black uppercase tracking-widest">No hay registros de loot</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="p-6 border-t border-white/5 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    ←
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    →
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
