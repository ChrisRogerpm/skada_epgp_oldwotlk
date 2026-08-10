"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { Plus, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import { PuntoUIItem } from "@/app/types/Reglas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type BenePenType = "benefits" | "penalties";

interface CategoryGroup {
  category: string;
  items: PuntoUIItem[];
}

interface BenePenEditorProps {
  type: BenePenType;
  categorized: CategoryGroup[];
  onAddCategory: () => void;
  onRemoveCategory: (category: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onAddItem: (category: string) => void;
  onRemoveItem: (id: string) => void;
  onUpdateItemLocal: (id: string, field: "descripcion" | "icon" | "valor", value: string | number) => void;
  onPersistItem: (id: string) => void;
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
    fallbackIcon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_02.jpg",
    iconWrap: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-400",
    addCategoryButton: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400 border-emerald-500/30",
    categoryFocus: "focus-visible:border-emerald-500/50",
    iconHoverBorder: "hover:border-emerald-500",
    valueText: "text-emerald-400",
    valueFocus: "focus-visible:border-emerald-500/50",
    addItemButton: "hover:text-emerald-400 hover:bg-emerald-500/5",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  penalties: {
    title: "Sanciones",
    subtitle: "Descuentos de EP",
    icon: TrendingDown,
    itemPlaceholder: "Descripción de la sanción...",
    addLabel: "+ Añadir Sanción",
    fallbackIcon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_orc_01.jpg",
    iconWrap: "bg-red-500/10 border-red-500/20",
    iconColor: "text-red-400",
    addCategoryButton: "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-400 border-red-500/30",
    categoryFocus: "focus-visible:border-red-500/50",
    iconHoverBorder: "hover:border-red-500",
    valueText: "text-red-400",
    valueFocus: "focus-visible:border-red-500/50",
    addItemButton: "hover:text-red-400 hover:bg-red-500/5",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
  },
} as const;

export default function BenePenEditor({
  type,
  categorized,
  onAddCategory,
  onRemoveCategory,
  onRenameCategory,
  onAddItem,
  onRemoveItem,
  onUpdateItemLocal,
  onPersistItem,
}: BenePenEditorProps) {
  const theme = THEME[type];
  const Icon = theme.icon;
  const [openIconId, setOpenIconId] = useState<string | null>(null);

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
        {categorized.map((cat) => (
          <Card
            key={cat.category}
            className="gap-0 p-0 bg-white dark:bg-slate-900/40 rounded-[2rem] border border-white/5 overflow-hidden shadow-xl hover:border-black/10 dark:hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-3 p-5 border-b border-white/5">
              <Input
                key={cat.category}
                defaultValue={cat.category}
                onBlur={(e) => onRenameCategory(cat.category, e.target.value)}
                className={`h-auto bg-slate-50 dark:bg-slate-950/60 border-white/5 rounded-xl px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white flex-1 uppercase tracking-wider ${theme.categoryFocus}`}
              />
              <Badge className={clsx("rounded-full uppercase tracking-widest shrink-0", theme.badge)}>{cat.items.length}</Badge>
              <Button variant="ghost" size="icon-sm" onClick={() => onRemoveCategory(cat.category)} className="text-slate-700 hover:text-red-400 shrink-0">
                <Trash2 size={18} />
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-950/40">
                  <TableHead className="px-5 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Ítem</TableHead>
                  <TableHead className="px-3 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Valor</TableHead>
                  <TableHead className="px-3 py-2.5 w-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/5">
                {cat.items.map((item) => (
                  <TableRow key={item.id} className="group/item">
                    <TableCell className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setOpenIconId(openIconId === item.id ? null : item.id)}
                            className={clsx(
                              "block w-9 h-9 rounded-lg border border-black/10 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-slate-900 shadow transition-all",
                              theme.iconHoverBorder,
                            )}
                            title="Cambiar ícono"
                          >
                            <Image
                              src={item.icon || theme.fallbackIcon}
                              alt={item.descripcion || theme.title}
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                            />
                          </button>

                          {openIconId === item.id && (
                            <div className="absolute z-50 top-full left-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] p-4 space-y-3 animate-in fade-in slide-in-from-top-1">
                              <div className="relative w-16 h-16 mx-auto rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-slate-950">
                                <Image src={item.icon || theme.fallbackIcon} alt="" fill sizes="64px" className="object-cover" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">URL del ícono</label>
                                <input
                                  autoFocus
                                  value={item.icon}
                                  onChange={(e) => onUpdateItemLocal(item.id, "icon", e.target.value)}
                                  onBlur={() => onPersistItem(item.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      (e.target as HTMLInputElement).blur();
                                      setOpenIconId(null);
                                    }
                                  }}
                                  placeholder="https://..."
                                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-[10px] font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus-visible:border-slate-400"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setOpenIconId(null)}
                                className="h-auto w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-lg uppercase tracking-widest text-[9px]"
                              >
                                Listo
                              </Button>
                            </div>
                          )}
                        </div>

                        <input
                          value={item.descripcion}
                          onChange={(e) => onUpdateItemLocal(item.id, "descripcion", e.target.value)}
                          onBlur={() => onPersistItem(item.id)}
                          placeholder={theme.itemPlaceholder}
                          className="flex-1 min-w-0 bg-transparent border-none text-xs text-slate-900 dark:text-white focus:ring-0 outline-none font-bold p-0"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-right">
                      <input
                        type="number"
                        value={item.valor}
                        onChange={(e) => onUpdateItemLocal(item.id, "valor", parseInt(e.target.value) || 0)}
                        onBlur={() => onPersistItem(item.id)}
                        className={`h-auto w-16 bg-transparent border-none text-sm font-black text-right focus:ring-0 outline-none ${theme.valueText}`}
                      />
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-slate-500 opacity-0 group-hover/item:opacity-100 hover:text-red-400 active:scale-90"
                      >
                        <X size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {cat.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="px-5 py-8 text-center">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Sin ítems todavía</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="p-4">
              <Button
                variant="ghost"
                onClick={() => onAddItem(cat.category)}
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
