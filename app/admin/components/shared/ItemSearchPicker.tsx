"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { CheckCircle2, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ItemSearchOption {
  id: number | string;
  id_item: number;
  name: string;
  icon: string;
}

interface ItemSearchPickerProps {
  items: ItemSearchOption[];
  selectedIds: number[];
  onToggle: (idItem: number) => void;
  /** Permite elegir varios a la vez (chips + no cierra al elegir). Por defecto, uno solo. */
  multiple?: boolean;
  triggerLabel: string;
  emptyLabel?: string;
  /**
   * Nombre/ícono a mostrar en el botón cuando no hay match en `items` pero ya
   * existe un valor guardado sin vincular al catálogo (filas viejas cargadas
   * a mano, antes de que existiera este selector).
   */
  fallbackLabel?: string;
  fallbackIcon?: string;
}

/**
 * Selector de ítem con buscador + ícono, reusado por el admin de Loot y el
 * de Reglas de Loteo: en vez de tipear nombre/URL de ícono a mano, se elige
 * del catálogo real y ambos se completan solos.
 */
export default function ItemSearchPicker({
  items,
  selectedIds,
  onToggle,
  multiple = false,
  triggerLabel,
  emptyLabel = "Sin ítems disponibles",
  fallbackLabel,
  fallbackIcon,
}: ItemSearchPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedItems = items.filter((item) => selectedIds.includes(item.id_item));

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(lower));
  }, [items, search]);

  const close = () => {
    setIsOpen(false);
    setSearch("");
  };

  const handlePick = (idItem: number) => {
    onToggle(idItem);
    if (!multiple) close();
  };

  return (
    <div className="space-y-2 relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="h-auto w-full flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus-visible:border-purple-500/50 text-left"
      >
        {selectedItems.length === 0 && fallbackLabel ? (
          <>
            <div className="relative w-8 h-8 rounded-lg border border-amber-500/30 overflow-hidden shrink-0">
              {fallbackIcon && <Image src={fallbackIcon} alt={fallbackLabel} fill unoptimized sizes="32px" className="object-cover" />}
            </div>
            <span className="truncate">{fallbackLabel}</span>
            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest shrink-0">sin vincular</span>
          </>
        ) : selectedItems.length === 0 ? (
          <span className="text-slate-500 font-medium">{triggerLabel}</span>
        ) : !multiple || selectedItems.length === 1 ? (
          <>
            <div className="relative w-8 h-8 rounded-lg border border-purple-500/30 overflow-hidden shrink-0">
              <Image src={selectedItems[0].icon} alt={selectedItems[0].name} fill unoptimized sizes="32px" className="object-cover" />
            </div>
            <span className="truncate">{selectedItems[0].name}</span>
          </>
        ) : (
          <span>
            {selectedItems.length} ítem{selectedItems.length > 1 ? "s" : ""} seleccionado{selectedItems.length > 1 ? "s" : ""}
          </span>
        )}
        <ChevronDown className={clsx("ml-auto text-slate-500 shrink-0 transition-transform", isOpen && "rotate-180")} size={16} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] overflow-hidden animate-in fade-in slide-in-from-top-1 flex flex-col">
          <div className="p-2 border-b border-white/5 relative shrink-0">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ítem..."
              className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none focus-visible:border-purple-500/50"
            />
          </div>

          <div className="max-h-[240px] overflow-y-auto">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id_item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePick(item.id_item)}
                  className={clsx(
                    "w-full flex items-center gap-3 p-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none text-left",
                    isSelected && "bg-purple-500/5",
                  )}
                >
                  <div className="relative w-8 h-8 rounded-lg border border-purple-500/30 overflow-hidden shrink-0">
                    <Image src={item.icon} alt={item.name} fill unoptimized sizes="32px" className="object-cover" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate flex-1">{item.name}</span>
                  {isSelected && <CheckCircle2 className="text-purple-400 shrink-0" size={16} />}
                </button>
              );
            })}
            {filteredItems.length === 0 && <p className="p-3 text-xs text-slate-500 font-bold uppercase">{emptyLabel}</p>}
          </div>

          {multiple && (
            <div className="p-2 border-t border-white/5 shrink-0">
              <Button
                type="button"
                variant="secondary"
                onClick={close}
                className="h-auto w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-lg uppercase tracking-widest text-[10px]"
              >
                Listo
              </Button>
            </div>
          )}
        </div>
      )}

      {multiple && selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedItems.map((item) => (
            <span
              key={item.id_item}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400"
            >
              <div className="relative w-4.5 h-4.5 rounded overflow-hidden shrink-0">
                <Image src={item.icon} alt={item.name} fill unoptimized sizes="18px" className="object-cover" />
              </div>
              <span className="truncate max-w-[110px]">{item.name}</span>
              <button type="button" onClick={() => onToggle(item.id_item)} className="hover:text-red-400 shrink-0">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
