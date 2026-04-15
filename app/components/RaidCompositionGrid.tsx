"use client";

import Image from "next/image";
import { RaidParticipant } from "../types/RaidComposition";
import { CLASS_HEX, CLASS_ICONS, DEFAULT_ICONS } from "../../lib/constants";

interface RaidCompositionGridProps {
  participants: RaidParticipant[];
}

export default function RaidCompositionGrid({ participants }: RaidCompositionGridProps) {
  // Group participants by group number (1-5, or more if applicable)
  const groups: Record<number, RaidParticipant[]> = {};
  participants.forEach((p) => {
    if (!groups[p.player_group]) {
      groups[p.player_group] = [];
    }
    groups[p.player_group].push(p);
  });

  // Sort groups by group number
  const sortedGroupNumbers = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {sortedGroupNumbers.map((groupNum) => (
        <div key={groupNum} className="bg-slate-900/20 rounded-lg border border-slate-800/40 overflow-hidden shadow-inner">
          <div className="bg-slate-800/50 px-3 py-1.5 text-center border-b border-slate-700/30">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Grupo {groupNum}
            </span>
          </div>
          <div className="p-2 space-y-1.5">
            {groups[groupNum].map((player) => {
              const classUpper = player.player_class.toUpperCase();
              const hex = CLASS_HEX[classUpper] || "#334155";
              const classIcon = CLASS_ICONS[classUpper] || DEFAULT_ICONS.UNKNOWN;
              
              return (
                <div
                  key={player.id}
                  className="relative flex items-center gap-2.5 px-2 py-1.5 rounded-md border transition-all duration-200 group overflow-hidden"
                  style={{
                    backgroundColor: `${hex}1a`, // 10% opacity background
                    borderColor: `${hex}33`,     // 20% opacity border
                  }}
                >
                  {/* Left accent border */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 opacity-60"
                    style={{ backgroundColor: hex }}
                  />

                  <div className="relative w-5 h-5 shrink-0 overflow-hidden rounded border border-black/20 group-hover:scale-105 transition-transform">
                    <Image
                      src={classIcon}
                      alt={player.player_class}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                  
                  <span className="text-[13px] font-bold text-slate-100 truncate drop-shadow-sm" title={`${player.player_name} (${player.player_class})`}>
                    {player.player_name}
                  </span>
                  
                  {/* Subtle class label on hover */}
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400">
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
  );
}
