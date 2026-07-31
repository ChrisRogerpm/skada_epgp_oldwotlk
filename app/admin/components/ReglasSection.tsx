"use client";

import clsx from "clsx";
import { Database, Loader2, Save, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReglasAdmin } from "../hooks/useReglasAdmin";
import { AdminStatus } from "../types";
import LootRulesEditor from "./LootRulesEditor";
import BenePenEditor from "./BenePenEditor";

interface ReglasSectionProps {
  search: string;
  onStatus: (status: AdminStatus) => void;
}

export default function ReglasSection({ search, onStatus }: ReglasSectionProps) {
  const {
    isLoading,
    isSaving,
    activeTab,
    setActiveTab,
    benefits,
    penalties,
    expandedRaids,
    filteredLootRules,
    saveRules,
    addRaid,
    removeRaid,
    updateRaidName,
    toggleRaidExpand,
    addItemToRaid,
    cloneItem,
    updateItem,
    removeItem,
    addBenePenCategory,
    removeBenePenCategory,
    updateBenePenCategory,
    addBenePenItem,
    updateBenePenItem,
    removeBenePenItem,
  } = useReglasAdmin(search, onStatus);

  return (
    <div className="space-y-10">
      {/* Floating Save Button */}
      <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Button
          onClick={saveRules}
          disabled={isSaving || isLoading}
          className="h-auto gap-3 px-8 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-900 dark:text-white rounded-3xl font-black shadow-2xl shadow-emerald-950/50 group border border-emerald-400/20 active:scale-95"
        >
          {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} className="group-hover:scale-110 group-hover:rotate-6 transition-transform" />}
          <span className="hidden md:inline uppercase tracking-widest text-xs">{isSaving ? "Guardando Cambios..." : "Guardar Todo"}</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
            <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 w-8 h-8 opacity-50" />
          </div>
          <div className="text-center">
            <p className="text-slate-900 dark:text-white font-black tracking-widest text-sm uppercase">Sincronizando Datos</p>
            <p className="text-slate-600 text-[10px] font-black uppercase mt-1">Conectando con Supabase Engine...</p>
          </div>
        </div>
      ) : (
        <>
          {/* SUB-TABS NAVIGATION */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900/50 rounded-2xl border border-white/5 w-fit">
            <Button
              variant="ghost"
              aria-pressed={activeTab === "loteo"}
              onClick={() => setActiveTab("loteo")}
              className={clsx(
                "h-auto gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest",
                activeTab === "loteo" ? "bg-orange-500/10 text-orange-400 shadow-lg border border-orange-500/20 hover:bg-orange-500/10 hover:text-orange-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-300",
              )}
            >
              <Trophy size={14} /> Loteo
            </Button>
            <Button
              variant="ghost"
              aria-pressed={activeTab === "beneficios"}
              onClick={() => setActiveTab("beneficios")}
              className={clsx(
                "h-auto gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest",
                activeTab === "beneficios" ? "bg-emerald-500/10 text-emerald-400 shadow-lg border border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-300",
              )}
            >
              <TrendingUp size={14} /> Bonos
            </Button>
            <Button
              variant="ghost"
              aria-pressed={activeTab === "sanciones"}
              onClick={() => setActiveTab("sanciones")}
              className={clsx(
                "h-auto gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest",
                activeTab === "sanciones" ? "bg-red-500/10 text-red-400 shadow-lg border border-red-500/20 hover:bg-red-500/10 hover:text-red-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-300",
              )}
            >
              <TrendingDown size={14} /> Sanciones
            </Button>
          </div>

          {activeTab === "loteo" && (
            <LootRulesEditor
              raids={filteredLootRules}
              expandedRaids={expandedRaids}
              onAddRaid={addRaid}
              onRemoveRaid={removeRaid}
              onUpdateRaidName={updateRaidName}
              onToggleExpand={toggleRaidExpand}
              onAddItem={addItemToRaid}
              onCloneItem={cloneItem}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
            />
          )}

          {activeTab === "beneficios" && (
            <BenePenEditor
              type="benefits"
              categories={benefits}
              onAddCategory={() => addBenePenCategory("benefits")}
              onRemoveCategory={(catIndex) => removeBenePenCategory("benefits", catIndex)}
              onUpdateCategory={(catIndex, category) => updateBenePenCategory("benefits", catIndex, category)}
              onAddItem={(catIndex) => addBenePenItem("benefits", catIndex)}
              onRemoveItem={(catIndex, itemIndex) => removeBenePenItem("benefits", catIndex, itemIndex)}
              onUpdateItem={(catIndex, itemIndex, field, value) => updateBenePenItem("benefits", catIndex, itemIndex, field, value)}
            />
          )}

          {activeTab === "sanciones" && (
            <BenePenEditor
              type="penalties"
              categories={penalties}
              onAddCategory={() => addBenePenCategory("penalties")}
              onRemoveCategory={(catIndex) => removeBenePenCategory("penalties", catIndex)}
              onUpdateCategory={(catIndex, category) => updateBenePenCategory("penalties", catIndex, category)}
              onAddItem={(catIndex) => addBenePenItem("penalties", catIndex)}
              onRemoveItem={(catIndex, itemIndex) => removeBenePenItem("penalties", catIndex, itemIndex)}
              onUpdateItem={(catIndex, itemIndex, field, value) => updateBenePenItem("penalties", catIndex, itemIndex, field, value)}
            />
          )}
        </>
      )}
    </div>
  );
}
