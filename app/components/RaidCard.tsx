"use client";

import { RaidInfo } from "../types/RaidComposition";
import RaidCompositionGrid from "./RaidCompositionGrid";
import { Clock, Shield, Swords, Ghost, Gem, Users } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

import { CLASS_HEX, CLASS_ICONS, DEFAULT_ICONS } from "../../lib/constants";

interface RaidCardProps {
  raid: RaidInfo;
  viewMode: "vertical" | "horizontal";
}

const getRaidTheme = (bossName: string) => {
  const name = bossName.toLowerCase();
  
  if (name.includes("halion")) {
    return {
      label: "Ruby Sanctum",
      short: "RS",
      color: "text-red-400",
      bgGradient: "from-red-500/10 via-orange-500/5 to-transparent",
      borderColor: "border-red-500/20",
      glowColor: "shadow-red-500/10",
      icon: Ghost
    };
  }
  
  const togcBosses = ["anub'arak", "northrend beasts", "jaraxxus", "faction champions", "val'kyr"];
  if (togcBosses.some(b => name.includes(b))) {
    return {
      label: "Trial of the Grand Crusader",
      short: "TOGC",
      color: "text-amber-400",
      bgGradient: "from-amber-500/10 via-yellow-600/5 to-transparent",
      borderColor: "border-amber-500/20",
      glowColor: "shadow-amber-500/10",
      icon: Swords
    };
  }
  
  const iccBosses = [
    "marrowgar", "deathwhisper", "gunship", "saurfang",
    "festergut", "rotface", "putricide", "blood prince",
    "lana'thel", "valithria", "sindragosa", "lich king"
  ];
  if (iccBosses.some(b => name.includes(b))) {
    return {
      label: "Icecrown Citadel",
      short: "ICC",
      color: "text-cyan-400",
      bgGradient: "from-cyan-500/10 via-blue-600/5 to-transparent",
      borderColor: "border-cyan-500/20",
      glowColor: "shadow-cyan-500/10",
      icon: Shield
    };
  }

  const ulduarBosses = [
    "ignis", "razorscale", "deconstructor", "iron council", "kologarn",
    "auriaya", "hodir", "thorim", "freya", "mimiron", "vezax", "yogg-saron", "algalon"
  ];
  if (ulduarBosses.some(b => name.includes(b))) {
    return {
      label: "Ulduar",
      short: "ULD",
      color: "text-purple-400",
      bgGradient: "from-purple-500/10 via-indigo-600/5 to-transparent",
      borderColor: "border-purple-500/20",
      glowColor: "shadow-purple-500/10",
      icon: Swords
    };
  }
  
  return {
    label: "Raid",
    short: "RAID",
    color: "text-slate-400",
    bgGradient: "from-slate-500/10 via-slate-800/5 to-transparent",
    borderColor: "border-slate-700/50",
    glowColor: "shadow-slate-500/5",
    icon: Swords
  };
};

export default function RaidCard({ raid, viewMode }: RaidCardProps) {
  const theme = getRaidTheme(raid.boss_name);
  const Icon = theme.icon;

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).$WowheadPower) {
      setTimeout(() => {
        (window as any).$WowheadPower.refreshLinks();
      }, 100);
    }
  }, [raid.items]);

  return (
    <div className={`group relative bg-slate-950/40 rounded-2xl border ${theme.borderColor} overflow-hidden mb-10 transition-colors backdrop-blur-md shadow-lg`}>
      {/* Dynamic Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradient} opacity-30 pointer-events-none`} />
      
      {/* Header */}
      <div className="relative border-b border-slate-800/50 bg-slate-900/20 px-8 py-6 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className={`p-3.5 rounded-xl bg-slate-800/40 ${theme.color} border border-white/5 shadow-inner backdrop-blur-md`}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                {raid.boss_name}
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border border-current font-black tracking-widest uppercase ${theme.color} bg-white/5 shadow-sm`}>
                {theme.short}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-400 tracking-wide uppercase">
                <Clock size={14} className="text-emerald-400" />
                {raid.raid_time.substring(0, 5)}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="flex items-center gap-2 text-xs font-bold text-slate-400 tracking-wide uppercase">
                <Users size={14} className="text-blue-400" />
                {raid.participants.length} Jugadores
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loot Section */}
      {raid.items && raid.items.length > 0 && (
        <div className="relative px-8 py-5 bg-gradient-to-r from-slate-950/20 to-transparent border-b border-slate-800/40 flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-left-4 duration-1000">
          <div className="flex items-center gap-2 mr-2">
            <Gem size={16} className="text-purple-400 animate-pulse" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">TESOROS:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {raid.items.map(item => {
              const classUpper = item.class?.toUpperCase() || "";
              const classColor = CLASS_HEX[classUpper] || "#ffffff";
              
              return (
                <div key={item.id} className="group/item flex items-center gap-3 bg-slate-900/40 backdrop-blur-md rounded-lg pl-1 pr-4 py-1.5 border border-purple-500/20 hover:border-purple-500/50 hover:bg-slate-800/60 transition-all duration-300 shadow-lg shadow-purple-500/5">
                  <div className="relative w-8 h-8 rounded border border-black/40 overflow-hidden shadow-md">
                     <Image 
                       src={`https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg`}
                       alt="item"
                       fill
                       className="object-cover opacity-50 grayscale group-hover/item:grayscale-0 group-hover/item:opacity-100 transition-all"
                     />
                     <div className="absolute inset-0 ring-1 ring-inset ring-purple-500/30" />
                  </div>
                  
                  <div className="flex flex-col">
                    <a 
                      href={`https://www.wowhead.com/wotlk/es/item=${item.id_item}`} 
                      data-wowhead="domain=wotlk" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[13px] font-bold text-purple-300 hover:text-purple-100 transition-colors drop-shadow-sm leading-tight"
                    >
                      Epic Gear
                    </a>
                    {item.personaje && (
                      <span 
                        className="text-[11px] font-medium tracking-tight flex items-center gap-1.5"
                        style={{ color: classColor }}
                      >
                        {item.personaje}
                        {item.class && (
                          <div className="w-3 h-3 relative rounded-full overflow-hidden border border-black/40">
                             <Image 
                              src={CLASS_ICONS[classUpper] || DEFAULT_ICONS.UNKNOWN} 
                              alt={item.class} 
                              fill
                             />
                          </div>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Raid Grid */}
      <div className="relative p-8 animate-in fade-in slide-in-from-bottom-2 duration-1000">
        <RaidCompositionGrid participants={raid.participants} viewMode={viewMode} />
      </div>
    </div>
  );
}
