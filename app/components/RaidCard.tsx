"use client";

import { RaidInfo } from "../types/RaidComposition";
import RaidCompositionGrid from "./RaidCompositionGrid";
import { Clock, Shield, Swords, Ghost } from "lucide-react";
import Image from "next/image";

import { CLASS_HEX, CLASS_ICONS, DEFAULT_ICONS } from "../../lib/constants";

interface RaidCardProps {
  raid: RaidInfo;
}

const getRaidType = (bossName: string) => {
  console.log(bossName)
  const rsBosses = ["Halion"];
  const togcBosses = ["Anub'arak", "The Northrend Beasts", "Lord Jaraxxus", "Faction Champions", "Twin Val'kyr"];
  const iccBosses = [
    "Lord Marrowgar", "Lady Deathwhisper", "Gunship Battle", "Deathbringer Saurfang",
    "Festergut", "Rotface", "Professor Putricide", "Blood Prince Council",
    "Blood-Queen Lana'thel", "Valithria Dreamwalker", "Sindragosa", "The Lich King"
  ];
  const ulduarBosses = [
    "Ignis the Furnace Master",
    "Razorscale",
    "XT-002 Deconstructor",
    "The Iron Council",
    "Kologarn",
    "Auriaya",
    "Hodir",
    "Thorim",
    "Freya",
    "Mimiron",
    "General Vezax",
    "Yogg-Saron",
    "Algalon the Observer"
  ];

  if (rsBosses.some(b => bossName.includes(b))) return { label: "RS", color: "text-red-400", icon: Ghost };
  if (togcBosses.some(b => bossName.includes(b))) return { label: "TOGC", color: "text-amber-400", icon: Swords };
  if (iccBosses.some(b => bossName.includes(b))) return { label: "ICC", color: "text-cyan-400", icon: Shield };
  if (ulduarBosses.some(b => bossName.includes(b))) return { label: "Ulduar", color: "text-purple-400", icon: Swords };
  
  return { label: "Raid", color: "text-slate-400", icon: Swords };
};

import { useEffect } from "react";

export default function RaidCard({ raid }: RaidCardProps) {
  const raidType = getRaidType(raid.boss_name);
  const Icon = raidType.icon;

  useEffect(() => {
    // Cuando cambian los items o se monta el componente, forzamos a Wowhead a recargar los tooltips
    if (typeof window !== "undefined" && (window as any).$WowheadPower) {
      // Necesitamos un pequeño timeout para asegurar que el DOM ya se dibujó
      setTimeout(() => {
        (window as any).$WowheadPower.refreshLinks();
      }, 100);
    }
  }, [raid.items]);

  return (
    <div className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden mb-8 shadow-lg backdrop-blur-sm">
      <div className="border-b border-slate-800 bg-slate-900/40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg bg-slate-800/50 ${raidType.color} border border-slate-700/50`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {raid.boss_name}
              <span className={`text-[10px] px-1.5 py-0.5 rounded border border-current font-black tracking-widest uppercase ${raidType.color} bg-opacity-10`}>
                {raidType.label}
              </span>
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Clock size={14} className="text-emerald-500" />
                {raid.raid_time.substring(0, 5)}
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs font-medium text-slate-400">
                {raid.participants.length} Jugadores
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {raid.items && raid.items.length > 0 && (
        <div className="px-6 py-3 bg-slate-900/30 border-b border-slate-800/60 flex flex-wrap gap-4 items-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loot:</span>
          {raid.items.map(item => {
            const classUpper = item.class?.toUpperCase() || "";
            const hex = CLASS_HEX[classUpper] || "#94a3b8"; // fallback to slate-400
            
            return (
              <div key={item.id} className="flex items-center gap-2.5 bg-slate-950/60 rounded drop-shadow-md px-3 py-2 border border-slate-800/80">
                <a 
                  href={`https://www.wowhead.com/wotlk/es/item=${item.id_item}`} 
                  data-wowhead="domain=wotlk" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[14px] font-semibold hover:brightness-125 transition-all whitespace-nowrap"
                >
                  Item
                </a>
                {item.personaje && (
                  <>
                    <span className="text-slate-600 text-sm font-bold">-</span>
                    <span 
                      className="text-[14px] capitalize flex items-center gap-1.5 text-white tracking-wide leading-none"
                      style={{ 
                        
                        textShadow: "1px 1px 2px rgba(0,0,0,0.9)",
                      }}
                      title={classUpper} /* El color de la clase se mantiene en el tooltip por si acaso */
                    >
                      {item.class && (
                        <div className="relative w-5 h-5 rounded-sm overflow-hidden border border-black/60 shadow-sm">
                          <Image 
                            src={CLASS_ICONS[classUpper] || DEFAULT_ICONS.UNKNOWN} 
                            alt={item.class} 
                            layout="fill" 
                            objectFit="cover" 
                          />
                        </div>
                      )}
                      {item.personaje}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="p-6">
        <RaidCompositionGrid participants={raid.participants} />
      </div>
    </div>
  );
}
