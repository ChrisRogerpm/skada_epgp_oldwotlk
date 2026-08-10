"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReglasPuntosAdmin } from "../hooks/useReglasPuntosAdmin";
import { AdminStatus } from "../types";
import ReglasLoteoSection from "./ReglasLoteoSection";
import BenePenEditor from "./BenePenEditor";

interface ReglasSectionProps {
  search: string;
  onStatus: (status: AdminStatus) => void;
}

export default function ReglasSection({ search, onStatus }: ReglasSectionProps) {
  const [activeTab, setActiveTab] = useState<"loteo" | "beneficios" | "sanciones">("loteo");

  const benefits = useReglasPuntosAdmin("beneficio", search, onStatus);
  const penalties = useReglasPuntosAdmin("perjuicio", search, onStatus);

  return (
    <div className="space-y-10">
      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900/50 rounded-2xl border border-white/5 w-fit">
        <Button
          variant="ghost"
          aria-pressed={activeTab === "loteo"}
          onClick={() => setActiveTab("loteo")}
          className={`h-auto gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest ${
            activeTab === "loteo"
              ? "bg-orange-500/10 text-orange-400 shadow-lg border border-orange-500/20 hover:bg-orange-500/10 hover:text-orange-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
          }`}
        >
          <Trophy size={14} /> Loteo
        </Button>
        <Button
          variant="ghost"
          aria-pressed={activeTab === "beneficios"}
          onClick={() => setActiveTab("beneficios")}
          className={`h-auto gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest ${
            activeTab === "beneficios"
              ? "bg-emerald-500/10 text-emerald-400 shadow-lg border border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
          }`}
        >
          <TrendingUp size={14} /> Bonos
        </Button>
        <Button
          variant="ghost"
          aria-pressed={activeTab === "sanciones"}
          onClick={() => setActiveTab("sanciones")}
          className={`h-auto gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest ${
            activeTab === "sanciones"
              ? "bg-red-500/10 text-red-400 shadow-lg border border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
          }`}
        >
          <TrendingDown size={14} /> Sanciones
        </Button>
      </div>

      {activeTab === "loteo" && <ReglasLoteoSection search={search} onStatus={onStatus} />}

      {activeTab === "beneficios" && (
        <BenePenEditor
          type="benefits"
          categorized={benefits.categorized}
          onAddCategory={benefits.addCategory}
          onRemoveCategory={benefits.removeCategory}
          onRenameCategory={benefits.renameCategory}
          onAddItem={benefits.addItem}
          onRemoveItem={benefits.removeItem}
          onUpdateItemLocal={benefits.updateItemLocal}
          onPersistItem={benefits.persistItem}
        />
      )}

      {activeTab === "sanciones" && (
        <BenePenEditor
          type="penalties"
          categorized={penalties.categorized}
          onAddCategory={penalties.addCategory}
          onRemoveCategory={penalties.removeCategory}
          onRenameCategory={penalties.renameCategory}
          onAddItem={penalties.addItem}
          onRemoveItem={penalties.removeItem}
          onUpdateItemLocal={penalties.updateItemLocal}
          onPersistItem={penalties.persistItem}
        />
      )}
    </div>
  );
}
