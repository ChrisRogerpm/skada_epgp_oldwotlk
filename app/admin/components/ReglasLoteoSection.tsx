"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { Edit3, ExternalLink, Loader2, Plus, Swords, Trash2, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { REGLAS_RAID_TABS } from "@/app/types/Reglas";
import { useReglasLoteoAdmin } from "../hooks/useReglasLoteoAdmin";
import { AdminStatus } from "../types";
import ItemSearchPicker from "./shared/ItemSearchPicker";

interface ReglasLoteoSectionProps {
  search: string;
  onStatus: (status: AdminStatus) => void;
}

export default function ReglasLoteoSection({ search, onStatus }: ReglasLoteoSectionProps) {
  const {
    rulesForActiveRaid,
    isLoading,
    isSaving,
    activeRaid,
    setActiveRaid,
    isDrawerOpen,
    form,
    setForm,
    itemOptions,
    categories,
    openCreate,
    openEdit,
    closeDrawer,
    pickItem,
    addRequirement,
    removeRequirement,
    saveItem,
    deleteItem,
  } = useReglasLoteoAdmin(search, onStatus);

  const [isNewCategory, setIsNewCategory] = useState(false);
  const [reqDraft, setReqDraft] = useState("");

  const submitRequirement = () => {
    addRequirement(reqDraft);
    setReqDraft("");
  };

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl border border-orange-500/20 flex items-center justify-center shadow-lg">
            <Trophy className="text-orange-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Reglas de Loteo</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prioridad de ítems por raid</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-50 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {REGLAS_RAID_TABS.map((tab) => (
              <Button
                key={tab.value}
                type="button"
                variant="ghost"
                aria-pressed={activeRaid === tab.value}
                onClick={() => setActiveRaid(tab.value)}
                className={clsx(
                  "h-auto gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest",
                  activeRaid === tab.value
                    ? "bg-white dark:bg-slate-800 text-orange-400 shadow"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                )}
              >
                <Swords size={14} /> {tab.value}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            onClick={openCreate}
            className="h-auto gap-3 px-6 py-3 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:text-orange-400 rounded-2xl text-[10px] font-black border border-orange-500/30 uppercase tracking-[0.15em] active:scale-95"
          >
            <Plus size={18} /> Agregar Ítem
          </Button>
        </div>
      </div>

      <Card className="gap-0 p-0 bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-950/40">
                <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ítem</TableHead>
                <TableHead className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoría</TableHead>
                <TableHead className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">EP mín.</TableHead>
                <TableHead className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Requisitos</TableHead>
                <TableHead className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/5">
              {rulesForActiveRaid.map((rule) => (
                <TableRow key={rule.id} className="group">
                  <TableCell className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl border border-orange-500/30 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                        <Image src={rule.icon} alt={rule.name} fill sizes="40px" className="object-cover" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[220px]">{rule.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge className="rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-widest">
                      {rule.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <span className="text-sm font-black text-emerald-400 tracking-tighter">{rule.valueMin}</span>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <span className="text-xs font-bold text-slate-500">
                      {rule.requirement.length > 0 ? `${rule.requirement.length} línea${rule.requirement.length > 1 ? "s" : ""}` : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(rule)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                        <Edit3 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteItem(rule.id)}
                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rulesForActiveRaid.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Trophy className="text-slate-700" size={32} />
                      <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Sin reglas cargadas para {activeRaid}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="px-8 py-20 text-center">
                    <Loader2 className="mx-auto animate-spin text-orange-400" size={28} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* PANEL LATERAL DE CARGA / EDICIÓN */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeDrawer} />
          <div className="relative w-full sm:w-[440px] h-full bg-white dark:bg-slate-950 border-l border-black/10 dark:border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-black/10 dark:border-white/10">
              <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {form.id ? "Editar Ítem" : "Agregar Ítem"}
              </h4>
              <Button variant="ghost" size="icon-sm" onClick={closeDrawer} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={saveItem} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Raid</label>
                <div className="flex gap-2">
                  {REGLAS_RAID_TABS.map((tab) => (
                    <Button
                      key={tab.value}
                      type="button"
                      variant="ghost"
                      aria-pressed={form.raidCode === tab.value}
                      onClick={() => setForm({ ...form, raidCode: tab.value, idItem: null })}
                      className={clsx(
                        "h-auto flex-1 gap-2 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest",
                        form.raidCode === tab.value
                          ? "bg-orange-500/10 text-orange-400 shadow-lg border border-orange-500/20 hover:bg-orange-500/10 hover:text-orange-400"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800",
                      )}
                    >
                      {tab.value}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ítem</label>
                <div className="mt-2">
                  <ItemSearchPicker
                    items={itemOptions}
                    selectedIds={form.idItem !== null ? [form.idItem] : []}
                    onToggle={pickItem}
                    triggerLabel={`Selecciona un ítem de ${form.raidCode}...`}
                    emptyLabel={`Sin ítems para ${form.raidCode}`}
                    fallbackLabel={form.idItem === null ? form.nombreItem || undefined : undefined}
                    fallbackIcon={form.iconUrl}
                  />
                </div>
                <a
                  href={`https://wotlk.ultimowow.com/es/?search=${encodeURIComponent(form.nombreItem)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-orange-400"
                >
                  <ExternalLink size={11} /> Ver en base de datos
                </a>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
                  <button
                    type="button"
                    onClick={() => setIsNewCategory((v) => !v)}
                    className="text-[10px] font-bold text-orange-400 hover:underline"
                  >
                    {isNewCategory ? "elegir existente" : "+ nueva"}
                  </button>
                </div>
                {isNewCategory ? (
                  <input
                    type="text"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    placeholder="Nombre de categoría..."
                    className="h-auto w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus-visible:border-orange-500/50"
                  />
                ) : (
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="h-auto w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus-visible:border-orange-500/50"
                  >
                    <option value="" disabled>
                      Selecciona una categoría...
                    </option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">EP mínimo</label>
                <input
                  type="number"
                  value={form.valorMinimo}
                  onChange={(e) => setForm({ ...form, valorMinimo: parseInt(e.target.value) || 0 })}
                  className="h-auto w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm text-emerald-400 font-black focus:outline-none focus-visible:border-orange-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Requisitos</label>
                <div className="flex flex-col gap-2">
                  {form.requisitos.map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2"
                    >
                      <span className="flex-1 text-xs text-slate-700 dark:text-slate-300">{req}</span>
                      <button type="button" onClick={() => removeRequirement(idx)} className="text-slate-500 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={reqDraft}
                    onChange={(e) => setReqDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitRequirement();
                      }
                    }}
                    placeholder="Agregar una línea de requisito..."
                    className="flex-1 h-auto bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus-visible:border-orange-500/50"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={submitRequirement}
                    className="h-auto px-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-xl"
                  >
                    +
                  </Button>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-black/10 dark:border-white/10 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={closeDrawer}
                className="h-auto flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-2xl uppercase tracking-widest text-[10px]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => saveItem()}
                disabled={isSaving || !form.categoria || !form.nombreItem}
                className="h-auto flex-1 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black rounded-2xl shadow-xl shadow-orange-900/20 uppercase tracking-widest text-[10px]"
              >
                {isSaving ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Guardar Ítem"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
