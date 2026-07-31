"use client";

import Image from "next/image";
import clsx from "clsx";
import { CheckCircle2, ChevronLeft, ChevronRight, Edit3, Loader2, Plus, Search, Shield, Trash2 } from "lucide-react";
import { FullGearedCharacter } from "@/src/domain/entities/FullGeared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useFullGearedAdmin } from "../hooks/useFullGearedAdmin";
import { AdminStatus } from "../types";

const CLASS_ICONS: Record<string, string> = {
  DEATHKNIGHT: "https://wow.zamimg.com/images/wow/icons/large/spell_deathknight_classicon.jpg",
  DRUID: "https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg",
  HUNTER: "https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg",
  MAGE: "https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg",
  PALADIN: "https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg",
  PRIEST: "https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg",
  ROGUE: "https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg",
  SHAMAN: "https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg",
  WARLOCK: "https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg",
  WARRIOR: "https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg",
};

interface FullGearedSectionProps {
  search: string;
  onStatus: (status: AdminStatus) => void;
}

export default function FullGearedSection({ search, onStatus }: FullGearedSectionProps) {
  const {
    characters,
    totalItems,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    isSaving,
    isSearchingChar,
    charSearchResults,
    charForm,
    setCharForm,
    searchCharacters,
    selectSearchResult,
    editCharacter,
    resetForm,
    saveCharacter,
    deleteCharacter,
  } = useFullGearedAdmin(search, onStatus);

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
                  {charForm.id ? "Editar Personaje" : "Registrar Personaje"}
                </h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ICC & RS Milestone</p>
              </div>
            </div>

            <form onSubmit={saveCharacter} className="space-y-6">
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Buscar en EPGP</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-400 transition-colors pointer-events-none z-10" size={18} />
                  <Input
                    type="text"
                    placeholder="Nombre del main o alter..."
                    onChange={(e) => searchCharacters(e.target.value)}
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
                            <Image src={char.url_icono} alt={char.clase} width={32} height={32} className="w-full h-full object-cover" />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Personaje</label>
                  <Input
                    readOnly
                    value={charForm.name}
                    className="h-auto w-full bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800/50 rounded-xl py-3 px-4 text-xs text-slate-600 dark:text-slate-400 font-bold shadow-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Clase</label>
                  <Input
                    readOnly
                    value={charForm.class}
                    className="h-auto w-full bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800/50 rounded-xl py-3 px-4 text-xs text-slate-600 dark:text-slate-400 font-bold shadow-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Main (EPGP)</label>
                <Input
                  readOnly
                  value={charForm.main}
                  className="h-auto w-full bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800/50 rounded-xl py-3 px-4 text-xs text-slate-600 dark:text-slate-400 font-bold shadow-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gear Score (GS)</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={charForm.gs}
                    onChange={(e) => setCharForm({ ...charForm, gs: parseInt(e.target.value) || 0 })}
                    className="h-auto w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-xl py-4 px-4 text-sm text-slate-900 dark:text-white font-black focus-visible:border-purple-500/50"
                  />
                  <Shield className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-800 pointer-events-none" size={20} />
                </div>
              </div>

              <div className="flex gap-6 py-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={!!charForm.icc}
                      onChange={(e) => setCharForm({ ...charForm, icc: e.target.checked })}
                      className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-6 h-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-lg peer-checked:bg-purple-600 peer-checked:border-purple-600 transition-all flex items-center justify-center">
                      <CheckCircle2 className={clsx("text-slate-900 dark:text-white transition-transform", !!charForm.icc ? "scale-100" : "scale-0")} size={14} />
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest group-hover:text-slate-900 dark:text-white transition-colors">Full ICC</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={!!charForm.rs}
                      onChange={(e) => setCharForm({ ...charForm, rs: e.target.checked })}
                      className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-6 h-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-lg peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                      <CheckCircle2 className={clsx("text-slate-900 dark:text-white transition-transform", !!charForm.rs ? "scale-100" : "scale-0")} size={14} />
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest group-hover:text-slate-900 dark:text-white transition-colors">Full RS</span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving || !charForm.name}
                  className="h-auto flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-slate-900 dark:text-white font-black py-4 rounded-2xl shadow-xl shadow-purple-900/20 uppercase tracking-widest text-xs"
                >
                  {isSaving ? <Loader2 className="animate-spin mx-auto" size={20} /> : charForm.id ? "Actualizar" : "Registrar"}
                </Button>

                {charForm.id && (
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

        {/* LISTADO DE PERSONAJES */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="gap-0 p-0 bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Personajes Registrados</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Listado de méritos</p>
              </div>
              <Badge className="rounded-full bg-white/5 text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-black/10 dark:border-white/10">
                {totalItems} Personajes
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-950/40">
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Personaje</TableHead>
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Main</TableHead>
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">GS</TableHead>
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Méritos</TableHead>
                    <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-white/5">
                  {characters.map((char: FullGearedCharacter) => (
                    <TableRow key={char.id} className="group">
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-black/10 dark:border-white/10 flex items-center justify-center overflow-hidden">
                            {CLASS_ICONS[char.class.toUpperCase()] ? (
                              <Image src={CLASS_ICONS[char.class.toUpperCase()]} alt={char.class} width={40} height={40} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-black text-purple-400">{char.name[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{char.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{char.class}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{char.main}</span>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <span className="text-sm font-black text-emerald-400 tracking-tighter">{char.gs}</span>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <div className="flex gap-2">
                          {!!char.icc && (
                            <Badge className="rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-widest">ICC</Badge>
                          )}
                          {!!char.rs && (
                            <Badge className="rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">RS</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon-sm" onClick={() => editCharacter(char)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            <Edit3 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => char.id && deleteCharacter(char.id)}
                            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {characters.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="px-8 py-20 text-center">
                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">No hay personajes registrados</p>
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
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-white/5 border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ChevronRight size={16} />
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
