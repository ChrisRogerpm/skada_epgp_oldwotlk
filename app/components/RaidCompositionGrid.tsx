"use client";

import Image from "next/image";
import { RaidParticipant } from "../types/RaidComposition";
import { CLASS_HEX, CLASS_ICONS, DEFAULT_ICONS } from "@/src/domain/constants/constants";
import { useMemo } from "react";

interface RaidCompositionGridProps {
  participants: RaidParticipant[];
  viewMode: "vertical" | "horizontal";
}

export default function RaidCompositionGrid({ participants, viewMode }: RaidCompositionGridProps) {
  // Group participants by group number
  const groups = useMemo(() => {
    const g: Record<number, RaidParticipant[]> = {};
    participants.forEach((p) => {
      if (!g[p.player_group]) {
        g[p.player_group] = [];
      }
      g[p.player_group].push(p);
    });
    return g;
  }, [participants]);

  // Sort groups by group number
  const sortedGroupNumbers = useMemo(() => 
    Object.keys(groups).map(Number).sort((a, b) => a - b),
  [groups]);

  return (
    <div className="space-y-6">
      {/* Composition Layout */}
      <div className={
        viewMode === "vertical" 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6" 
          : "flex flex-col gap-4"
      }>
        {sortedGroupNumbers.map((groupNum) => (
          <div 
            key={groupNum} 
            className={`group/group bg-white dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-800/50 overflow-hidden shadow-lg transition-all ${
              viewMode === "horizontal" ? "flex flex-col sm:flex-row items-stretch" : ""
            }`}
          >
            <div className={`bg-slate-100 dark:bg-slate-800/40 px-4 py-2 text-center border-slate-300 dark:border-slate-700/40 transition-colors flex items-center justify-center ${
              viewMode === "vertical" ? "border-b" : "border-b sm:border-b-0 sm:border-r min-w-[120px]"
            }`}>
              <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.25em]">
                Grupo {groupNum}
              </span>
            </div>
            <div className={`p-3 ${
              viewMode === "vertical" 
                ? "space-y-1.5" 
                : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 flex-1"
            }`}>
              {groups[groupNum].map((player) => {
                const classUpper = player.player_class.toUpperCase();
                const hex = CLASS_HEX[classUpper] || "#334155";
                const classIcon = CLASS_ICONS[classUpper] || DEFAULT_ICONS.UNKNOWN;
                
                return (
                  <div
                    key={player.id}
                    className="relative flex items-center gap-3 px-3 py-1.5 rounded-lg border border-transparent transition-all duration-300 group/player overflow-hidden"
                    style={{
                      backgroundColor: `${hex}12`, 
                    }}
                  >
                    {/* Background accent */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover/player:opacity-5 transition-opacity"
                      style={{ backgroundColor: hex }}
                    />
                    
                    {/* Left accent border */}
                    <div 
                      className="absolute left-0 top-1 bottom-1 w-1 rounded-full scale-y-0 group-hover/player:scale-y-100 transition-transform duration-300"
                      style={{ backgroundColor: hex, boxShadow: `0 0-8px ${hex}88` }}
                    />

                    <div className="relative w-5 h-5 shrink-0 overflow-hidden rounded shadow-sm border border-black/20">
                      <Image
                        src={classIcon}
                        alt={player.player_class}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    
                    <span 
                      className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate drop-shadow-sm transition-all" 
                      title={`${player.player_name} (${player.player_class})`}
                    >
                      {player.player_name}
                    </span>
                    
                    {/* Class badge on hover */}
                    <div className="ml-auto opacity-0 translate-x-2 group-hover/player:opacity-100 group-hover/player:translate-x-0 transition-all duration-300">
                       <span 
                         className="text-[8px] font-black px-1 py-0.5 rounded border border-current uppercase tracking-tighter"
                         style={{ color: hex, backgroundColor: `${hex}1a` }}
                       >
                          {player.player_class.substring(0, 3)}
                       </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
