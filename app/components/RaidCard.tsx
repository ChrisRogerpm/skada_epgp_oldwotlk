"use client";

import { RaidInfo } from "../types/RaidComposition";
import RaidCompositionGrid from "./RaidCompositionGrid";
import { Clock, Shield, Swords, Ghost } from "lucide-react";

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

export default function RaidCard({ raid }: RaidCardProps) {
  const raidType = getRaidType(raid.boss_name);
  const Icon = raidType.icon;

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
      
      <div className="p-6">
        <RaidCompositionGrid participants={raid.participants} />
      </div>
    </div>
  );
}
