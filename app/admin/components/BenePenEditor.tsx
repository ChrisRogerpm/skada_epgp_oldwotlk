"use client";

import Image from "next/image";
import { Plus, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import { BenefitCategory, PenaltyCategory } from "@/app/types/Reglas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type BenePenType = "benefits" | "penalties";

interface BenePenEditorProps {
  type: BenePenType;
  categories: BenefitCategory[] | PenaltyCategory[];
  onAddCategory: () => void;
  onRemoveCategory: (catIndex: number) => void;
  onUpdateCategory: (catIndex: number, category: string) => void;
  onAddItem: (catIndex: number) => void;
  onRemoveItem: (catIndex: number, itemIndex: number) => void;
  onUpdateItem: (catIndex: number, itemIndex: number, field: "descripcion" | "icon" | "valor", value: string | number) => void;
}

// Tailwind necesita ver las clases completas de forma literal en el código fuente
// para poder generarlas; por eso no se arma el color dinámicamente con template strings.
const THEME = {
  benefits: {
    title: "Bonificaciones",
    subtitle: "Incrementos de EP",
    icon: TrendingUp,
    itemPlaceholder: "Descripción del bono...",
    addLabel: "+ Añadir Bonificación",
    iconWrap: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-400",
    addCategoryButton: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400 border-emerald-500/30",
    categoryFocus: "focus-visible:border-emerald-500/50",
    iconHoverBorder: "hover:border-emerald-500",
    valueText: "text-emerald-400",
    valueFocus: "focus-visible:border-emerald-500/50",
    addItemButton: "hover:text-emerald-400 hover:bg-emerald-500/5",
  },
  penalties: {
    title: "Sanciones",
    subtitle: "Descuentos de EP",
    icon: TrendingDown,
    itemPlaceholder: "Descripción de la sanción...",
    addLabel: "+ Añadir Sanción",
    iconWrap: "bg-red-500/10 border-red-500/20",
    iconColor: "text-red-400",
    addCategoryButton: "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-400 border-red-500/30",
    categoryFocus: "focus-visible:border-red-500/50",
    iconHoverBorder: "hover:border-red-500",
    valueText: "text-red-400",
    valueFocus: "focus-visible:border-red-500/50",
    addItemButton: "hover:text-red-400 hover:bg-red-500/5",
  },
} as const;

export default function BenePenEditor({
  type,
  categories,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategory,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: BenePenEditorProps) {
  const theme = THEME[type];
  const Icon = theme.icon;

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg ${theme.iconWrap}`}>
            <Icon className={theme.iconColor} size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{theme.title}</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{theme.subtitle}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={onAddCategory}
          className={`h-auto gap-3 px-6 py-3 rounded-2xl text-[10px] font-black border uppercase tracking-[0.15em] active:scale-95 ${theme.addCategoryButton}`}
        >
          <Plus size={18} /> Nueva Categoría
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {categories.map((cat, cIdx) => (
          <Card key={cIdx} className="gap-6 bg-white dark:bg-slate-900/40 rounded-[2rem] border border-white/5 p-6 shadow-xl hover:border-black/10 dark:hover:border-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <Input
                value={cat.category}
                onChange={(e) => onUpdateCategory(cIdx, e.target.value)}
                className={`h-auto bg-slate-50 dark:bg-slate-950/60 border-white/5 rounded-xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white w-full uppercase tracking-wider ${theme.categoryFocus}`}
              />
              <Button variant="ghost" size="icon-sm" onClick={() => onRemoveCategory(cIdx)} className="text-slate-700 hover:text-red-400">
                <Trash2 size={18} />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {cat.items.map((item, iIdx) => (
                <div key={iIdx} className="group/item bg-slate-50 dark:bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-4 hover:bg-white dark:hover:bg-slate-900/60 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <Image
                        src={item.icon || "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"}
                        alt={item.descripcion || theme.title}
                        width={48}
                        height={48}
                        className={`w-12 h-12 rounded-xl border border-black/10 dark:border-white/10 object-cover bg-white dark:bg-slate-900 shadow-lg transition-all ${theme.iconHoverBorder}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input
                        value={item.descripcion}
                        onChange={(e) => onUpdateItem(cIdx, iIdx, "descripcion", e.target.value)}
                        placeholder={theme.itemPlaceholder}
                        className="bg-transparent border-none text-xs w-full text-slate-900 dark:text-white focus:ring-0 outline-none font-bold p-0"
                      />
                      <input
                        value={item.icon}
                        onChange={(e) => onUpdateItem(cIdx, iIdx, "icon", e.target.value)}
                        placeholder="URL del icono..."
                        className="bg-transparent border-none text-[9px] w-full text-slate-600 dark:text-slate-400 focus:ring-0 outline-none font-mono p-0"
                      />
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <Input
                        type="number"
                        value={item.valor}
                        onChange={(e) => onUpdateItem(cIdx, iIdx, "valor", parseInt(e.target.value) || 0)}
                        className={`h-auto bg-slate-50 dark:bg-slate-950 border-white/5 rounded-xl px-3 py-2 text-sm w-20 font-black text-right ${theme.valueText} ${theme.valueFocus}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onRemoveItem(cIdx, iIdx)}
                        className="text-slate-800 opacity-0 group-hover/item:opacity-100 hover:text-red-400 hover:bg-transparent active:scale-90"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                onClick={() => onAddItem(cIdx)}
                className={`h-auto w-full py-3 border border-dashed border-white/5 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ${theme.addItemButton}`}
              >
                {theme.addLabel}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
