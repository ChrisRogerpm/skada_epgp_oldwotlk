"use client";

import { RaidInfo } from "../types/RaidComposition";
import RaidCompositionGrid from "./RaidCompositionGrid";
import { Clock, Shield, Swords, Ghost, Gem, Users, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { CLASS_HEX, CLASS_ICONS, DEFAULT_ICONS } from "@/src/domain/constants/constants";

interface RaidCardProps {
  raid: RaidInfo;
  viewMode: "vertical" | "horizontal";
  halionIndex?: number;
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
      icon: Ghost,
    };
  }

  const togcBosses = [
    "anub'arak",
    "northrend beasts",
    "jaraxxus",
    "faction champions",
    "val'kyr",
  ];
  if (togcBosses.some((b) => name.includes(b))) {
    return {
      label: "Trial of the Grand Crusader",
      short: "TOGC",
      color: "text-amber-400",
      bgGradient: "from-amber-500/10 via-yellow-600/5 to-transparent",
      borderColor: "border-amber-500/20",
      glowColor: "shadow-amber-500/10",
      icon: Swords,
    };
  }

  const iccBosses = [
    "marrowgar",
    "deathwhisper",
    "gunship",
    "saurfang",
    "festergut",
    "rotface",
    "putricide",
    "blood prince",
    "lana'thel",
    "valithria",
    "sindragosa",
    "lich king",
  ];
  if (iccBosses.some((b) => name.includes(b))) {
    return {
      label: "Icecrown Citadel",
      short: "ICC",
      color: "text-cyan-400",
      bgGradient: "from-cyan-500/10 via-blue-600/5 to-transparent",
      borderColor: "border-cyan-500/20",
      glowColor: "shadow-cyan-500/10",
      icon: Shield,
    };
  }

  const ulduarBosses = [
    "ignis",
    "razorscale",
    "deconstructor",
    "iron council",
    "kologarn",
    "auriaya",
    "hodir",
    "thorim",
    "freya",
    "mimiron",
    "vezax",
    "yogg-saron",
    "algalon",
  ];
  if (ulduarBosses.some((b) => name.includes(b))) {
    return {
      label: "Ulduar",
      short: "ULD",
      color: "text-purple-400",
      bgGradient: "from-purple-500/10 via-indigo-600/5 to-transparent",
      borderColor: "border-purple-500/20",
      glowColor: "shadow-purple-500/10",
      icon: Swords,
    };
  }

  return {
    label: "Raid",
    short: "RAID",
    color: "text-slate-600 dark:text-slate-400",
    bgGradient: "from-slate-500/10 via-slate-800/5 to-transparent",
    borderColor: "border-slate-300 dark:border-slate-700/50",
    glowColor: "shadow-slate-500/5",
    icon: Swords,
  };
};

export default function RaidCard({ raid, viewMode, halionIndex }: RaidCardProps) {
  const theme = getRaidTheme(raid.boss_name);
  const Icon = theme.icon;
  const displayShort = halionIndex ? `${theme.short} #${halionIndex}` : theme.short;
  const [isExpanded, setIsExpanded] = useState(!raid.boss_name.toLowerCase().includes("halion"));

  useEffect(() => {
    if (isExpanded && typeof window !== "undefined" && (window as any).$WowheadPower) {
      setTimeout(() => {
        (window as any).$WowheadPower.refreshLinks();
      }, 100);
    }
  }, [raid.items, isExpanded]);

  return (
    <div
      className={`group relative bg-slate-50 dark:bg-slate-950/40 rounded-2xl border ${theme.borderColor} overflow-hidden mb-10 transition-colors backdrop-blur-md shadow-lg`}
    >
      {/* Dynamic Background Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradient} opacity-30 pointer-events-none`}
      />

      {/* Header */}
      <div 
        className="relative border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/20 px-8 py-6 flex flex-wrap items-center justify-between gap-6 cursor-pointer hover:bg-white dark:bg-slate-900/40 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-5">
          <div
            className={`p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 ${theme.color} border border-white/5 shadow-inner backdrop-blur-md`}
          >
            <Icon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-md">
                {raid.boss_name}
              </h3>
              <span
                className={`text-[15px] px-2 py-0.5 rounded-full border border-current font-black tracking-widest uppercase ${theme.color} bg-white/5 shadow-sm`}
              >
                {displayShort}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wide uppercase">
                <Clock size={14} className="text-emerald-400" />
                {raid.raid_time.substring(0, 5)}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 tracking-wide uppercase">
                <Users size={14} className="text-blue-400" />
                {raid.participants.length} Jugadores
              </span>
            </div>
          </div>
        </div>
        <div className="p-2 bg-slate-100 dark:bg-slate-800/40 rounded-full border border-slate-300 dark:border-slate-700/50 group-hover:bg-slate-700/60 transition-colors">
          {isExpanded ? <ChevronUp size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:text-white" /> : <ChevronDown size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:text-white" />}
        </div>
      </div>

      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Loot Section */}
      {raid.items && raid.items.length > 0 && (
        <div className="relative px-8 py-5 bg-gradient-to-r from-slate-950/20 to-transparent border-b border-slate-200 dark:border-slate-800/40 flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-left-4 duration-1000">
          <div className="flex items-center gap-2 mr-2">
            <Gem size={16} className="text-purple-400 animate-pulse" />
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">
              LOOT:
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {raid.items.map((item) => {
              const classUpper = item.class?.toUpperCase() || "";
              const classColor = CLASS_HEX[classUpper] || "#ffffff";

              return (
                <div
                  key={item.id}
                  className="group/item flex items-center gap-4 bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-xl pl-2 pr-5 py-2 border border-purple-500/20 hover:border-purple-500/50 hover:bg-slate-100 dark:bg-slate-800/80 transition-all duration-300 shadow-xl shadow-purple-500/5"
                >
                  <div className="relative w-10 h-10 rounded-lg border border-purple-500/30 overflow-hidden shadow-lg shrink-0">
                    <Image
                      src={item.items.icon}
                      alt="item"
                      fill
                      className="object-cover opacity-80 group-hover/item:opacity-100 transition-opacity"
                    />
                  </div>

                  <div className="flex flex-col min-w-15">
                    {item.personaje && (
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.class && (
                          <div className="w-4.5 h-4.5 relative rounded border border-black/40 shadow-sm shrink-0">
                            <Image
                              src={
                                CLASS_ICONS[classUpper] || DEFAULT_ICONS.UNKNOWN
                              }
                              alt={item.class}
                              fill
                            />
                          </div>
                        )}
                        <span
                          className="text-[17px] font-black tracking-tight"
                          style={{ color: classColor }}
                        >
                          {item.personaje}
                        </span>
                      </div>
                    )}
                    <a
                      href={`https://www.wowhead.com/wotlk/es/item=${item.id_item}/${item.items.name}`}
                      data-wowhead="domain=es"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[14px] font-semibold hover:brightness-125 transition-all whitespace-nowrap icontinyl q4"
                    >
                      {item.id_item}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Raid Grid */}
      <div className="relative p-8">
        <RaidCompositionGrid
          participants={raid.participants}
          viewMode={viewMode}
        />
      </div>
        </div>
      )}
    </div>
  );
}
