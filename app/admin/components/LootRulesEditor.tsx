"use client";

import Image from "next/image";
import clsx from "clsx";
import { ChevronDown, Copy, ExternalLink, Plus, Search, Shield, Trash2, Trophy } from "lucide-react";
import { RaidRule } from "@/app/types/Reglas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LootRulesEditorProps {
  raids: RaidRule[];
  expandedRaids: Set<number>;
  onAddRaid: () => void;
  onRemoveRaid: (raidIndex: number) => void;
  onUpdateRaidName: (raidIndex: number, name: string) => void;
  onToggleExpand: (raidIndex: number) => void;
  onAddItem: (raidIndex: number) => void;
  onCloneItem: (raidIndex: number, itemIndex: number) => void;
  onUpdateItem: (raidIndex: number, itemIndex: number, field: string, value: string | number) => void;
  onRemoveItem: (raidIndex: number, itemIndex: number) => void;
}

export default function LootRulesEditor({
  raids,
  expandedRaids,
  onAddRaid,
  onRemoveRaid,
  onUpdateRaidName,
  onToggleExpand,
  onAddItem,
  onCloneItem,
  onUpdateItem,
  onRemoveItem,
}: LootRulesEditorProps) {
  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl border border-orange-500/20 flex items-center justify-center shadow-lg">
            <Trophy className="text-orange-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Reglas de Loteo</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gestión de prioridad por Raid</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={onAddRaid}
          className="h-auto gap-3 px-6 py-3 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:text-orange-400 rounded-2xl text-[10px] font-black border border-orange-500/30 uppercase tracking-[0.15em] active:scale-95"
        >
          <Plus size={18} /> Nueva Raid
        </Button>
      </div>

      <div className="space-y-6">
        {raids.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/20 border border-dashed border-white/5 rounded-[2rem] p-20 text-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-700 border border-white/5 shadow-inner">
              <Search size={32} />
            </div>
            <h4 className="text-slate-900 dark:text-white font-black uppercase mb-2">No se encontraron resultados</h4>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">Ajusta tu búsqueda o crea una nueva configuración de raid.</p>
          </div>
        ) : (
          raids.map((raid, rIdx) => {
            const isExpanded = expandedRaids.has(rIdx);
            return (
              <div
                key={rIdx}
                className={clsx(
                  "group bg-white dark:bg-slate-900/40 rounded-[2.5rem] border transition-all duration-500 overflow-hidden",
                  isExpanded ? "border-black/10 dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900/60" : "border-white/5 hover:border-black/10 dark:hover:border-white/10",
                )}
              >
                <div
                  onClick={() => onToggleExpand(rIdx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggleExpand(rIdx);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950/40 border-b border-white/5 flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
                >
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div
                      className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                        isExpanded ? "bg-orange-500/20 text-orange-400 rotate-6" : "bg-slate-100 dark:bg-slate-800/50 text-slate-600",
                      )}
                    >
                      <Shield size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        value={raid.raid}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateRaidName(rIdx, e.target.value)}
                        className="bg-transparent border-none text-2xl font-black text-slate-900 dark:text-white focus:ring-0 outline-none w-full p-0 placeholder-slate-800 uppercase tracking-tighter"
                        placeholder="Nombre de la Raid"
                      />
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">
                          {raid.items.length} Objetos Registrados
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("¿Eliminar permanentemente esta raid y todos sus ítems?")) onRemoveRaid(rIdx);
                      }}
                      title="Eliminar Raid"
                      className="text-slate-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </Button>
                    <div className={clsx("p-2 rounded-full transition-transform duration-500 bg-white/5", isExpanded && "rotate-180")}>
                      <ChevronDown size={20} className="text-slate-500" />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 md:p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 gap-4">
                      {raid.items.map((item, iIdx) => (
                        <div key={iIdx} className="bg-slate-50 dark:bg-slate-950/60 border border-white/5 rounded-[1.5rem] p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start group/item hover:border-black/10 dark:hover:border-white/10 hover:bg-white dark:hover:bg-slate-900/60 transition-all shadow-inner">
                          <div className="md:col-span-1 flex justify-center">
                            <div className="relative group/icon">
                              <Image
                                src={item.icon || "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"}
                                alt={item.item}
                                width={56}
                                height={56}
                                className="w-14 h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-800 mx-auto object-cover bg-white dark:bg-slate-900 group-hover/icon:border-emerald-500 transition-all shadow-2xl"
                              />
                            </div>
                          </div>

                          <div className="md:col-span-4 space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Identificador Ítem</label>
                              <Input
                                value={item.item}
                                onChange={(e) => onUpdateItem(rIdx, iIdx, "item", e.target.value)}
                                className="h-auto w-full bg-white dark:bg-slate-900/50 border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-black focus-visible:border-emerald-500/50 shadow-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Icon URL</label>
                              <div className="flex gap-2">
                                <Input
                                  value={item.icon}
                                  onChange={(e) => onUpdateItem(rIdx, iIdx, "icon", e.target.value)}
                                  placeholder="https://..."
                                  className="h-auto flex-1 bg-white dark:bg-slate-900/30 border-white/5 rounded-xl px-4 py-2 text-[10px] text-slate-500 focus-visible:text-slate-700 dark:focus-visible:text-slate-300 font-mono shadow-none"
                                />
                                <a href={item.icon} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-xl text-slate-500 hover:text-emerald-400 transition-colors">
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-2 space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Categoría</label>
                              <Input
                                value={item.category}
                                onChange={(e) => onUpdateItem(rIdx, iIdx, "category", e.target.value)}
                                className="h-auto w-full bg-white dark:bg-slate-900/50 border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 uppercase font-black focus-visible:border-emerald-500/50 shadow-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">EP Mínimo</label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={item.valueMin}
                                  onChange={(e) => onUpdateItem(rIdx, iIdx, "valueMin", parseInt(e.target.value) || 0)}
                                  className="h-auto w-full bg-slate-50 dark:bg-slate-950/50 border-white/5 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-black focus-visible:border-emerald-500/50 pr-10 shadow-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-900/60 uppercase">pts</span>
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-4 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Requisitos Específicos</label>
                            <textarea
                              value={item.requirement.join("\n")}
                              onChange={(e) => onUpdateItem(rIdx, iIdx, "requirement", e.target.value)}
                              rows={4}
                              placeholder={"Ej: Solo Tanques Principal\nMínimo 4/5 Tier 10\nAsistencia 80%+"}
                              className="w-full bg-white dark:bg-slate-900/50 border border-white/5 rounded-2xl px-4 py-3 text-xs text-slate-700 dark:text-slate-300 resize-none focus:border-emerald-500/50 outline-none leading-relaxed transition-all placeholder:text-slate-800"
                            />
                          </div>

                          <div className="md:col-span-1 flex flex-row md:flex-col justify-end items-center gap-2 h-full py-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onCloneItem(rIdx, iIdx)}
                              title="Duplicar ítem"
                              className="text-slate-600 hover:text-cyan-400 bg-white/[0.02] hover:bg-cyan-500/10 rounded-2xl border border-white/5 hover:border-cyan-500/20 active:scale-90"
                            >
                              <Copy size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onRemoveItem(rIdx, iIdx)}
                              title="Eliminar ítem"
                              className="text-slate-600 hover:text-red-400 bg-white/[0.02] hover:bg-red-500/10 rounded-2xl border border-white/5 hover:border-red-500/20 active:scale-90"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button
                        variant="ghost"
                        onClick={() => onAddItem(rIdx)}
                        className="h-auto w-full py-6 border-2 border-dashed border-white/5 hover:border-emerald-500/30 rounded-[1.5rem] text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/5 group overflow-hidden relative"
                      >
                        <div className="flex items-center justify-center gap-3 relative z-10">
                          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                          <span className="text-xs font-black uppercase tracking-[0.2em]">Registrar Nuevo Objeto en {raid.raid}</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/[0.03] to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
