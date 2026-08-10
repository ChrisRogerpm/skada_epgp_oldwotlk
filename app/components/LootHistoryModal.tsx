"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { X, Gem, Loader2, Info, Calendar, Swords } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import clsx from "clsx";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LootWinDetailed } from "../types/Loot";

interface LootHistoryModalProps {
  mainName: string;
  alters?: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function LootHistoryModal({ mainName, alters = [], isOpen, onClose }: LootHistoryModalProps) {
  const allNames = [mainName, ...alters];
  const namesQuery = allNames.join(",");

  const { data: history = [], isLoading } = useQuery<LootWinDetailed[]>({
    queryKey: ["lootHistory", namesQuery],
    queryFn: async () => {
      const res = await fetch(`/api/loot/history?names=${encodeURIComponent(namesQuery)}`);
      if (!res.ok) throw new Error("Failed to fetch loot history");
      return res.json();
    },
    enabled: isOpen && !!mainName,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] p-0 gap-0"
      >
        <DialogHeader className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800 flex-row items-center justify-between bg-white dark:bg-slate-900/50 space-y-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Gem size={26} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{mainName}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                Historial de Loot ({allNames.length} Personajes)
              </DialogDescription>
            </div>
          </div>
          <DialogClose asChild>
            <button aria-label="Cerrar" className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
              <X size={24} className="text-slate-500" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="animate-spin text-purple-500" size={40} />
              <p className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cargando historial...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <Info className="mx-auto text-slate-700 mb-4" size={48} />
              <p className="text-slate-600 dark:text-slate-400 font-bold uppercase text-xs">Este jugador y sus alters aún no han ganado ítems.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {history.map((win) => (
                <div
                  key={win.id}
                  className="bg-slate-50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900/60 transition-colors border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="relative w-11 h-11 rounded-xl border border-purple-500/30 overflow-hidden shrink-0 shadow-lg">
                    {win.item_icon ? (
                      <Image src={win.item_icon} alt={win.item_name} fill sizes="44px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`https://wotlk.ultimowow.com/es/?item=${win.id_item}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-purple-400 transition-colors truncate"
                      >
                        {win.item_name}
                      </a>
                      <span
                        className={clsx(
                          "text-[8px] px-1.5 py-0.5 rounded font-black border uppercase shrink-0",
                          win.personaje === mainName ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-purple-500/10 border-purple-500/30 text-purple-400",
                        )}
                      >
                        {win.personaje}
                      </span>
                      {win.source === "manual" && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-black border uppercase shrink-0 bg-amber-500/10 border-amber-500/30 text-amber-400">
                          Manual
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                        <Swords size={12} className="text-slate-500" />
                        {win.boss_name || win.item_raid}
                      </span>
                      {win.raid_date ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                          <Calendar size={12} className="text-slate-500" />
                          {format(parseISO(win.raid_date), "PPP", { locale: es })}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-500 uppercase">Sin sesión registrada (legacy)</span>
                      )}
                    </div>
                    {!win.id_raids && win.note && (
                      <p className="text-[10px] text-slate-500 italic mt-1">&ldquo;{win.note}&rdquo;</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Registro de Loot • Old Legends</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
