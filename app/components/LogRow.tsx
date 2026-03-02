"use client";

import { RaidLog } from "../types/RaidLog";
import Image from "next/image";

const CLASS_COLORS: Record<string, string> = {
  WARRIOR: "bg-[#C79C6E] text-white",
  PALADIN: "bg-[#F58CBA] text-white",
  HUNTER: "bg-[#ABD473] text-black",
  ROGUE: "bg-[#FFF569] text-black",
  PRIEST: "bg-[#FFFFFF] text-black",
  DEATHKNIGHT: "bg-[#C41F3B] text-white",
  SHAMAN: "bg-[#0070DE] text-white",
  MAGE: "bg-[#69CCF0] text-black",
  WARLOCK: "bg-[#9482C9] text-white",
  MONK: "bg-[#00FF96] text-black",
  DRUID: "bg-[#FF7D0A] text-white",
  DEMONHUNTER: "bg-[#A330C9] text-white",
};

interface LogRowProps {
  log: RaidLog;
  index: number;
}

export default function LogRow({ log, index }: LogRowProps) {
  const badgeClass =
    CLASS_COLORS[log.Class.toUpperCase()] || "bg-slate-700 text-white";

  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors group">
      <td className="py-2.5 px-4 text-sm text-slate-300 font-mono">
        <span
          className={`flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border ${log.Rank <= 3 ? "border-yellow-500/50 text-yellow-400" : "border-slate-700"}`}
        >
          {log.Rank}
        </span>
      </td>
      <td className="py-2.5 px-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 overflow-hidden rounded-full ring-2 ring-slate-800 group-hover:ring-slate-600 transition-all">
            <Image
              src={log.Icon || "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"}
              alt={log.Character}
              layout="fill"
              objectFit="cover"
              onError={(e) => {
                e.currentTarget.src =
                  "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
              }}
            />
          </div>
          <div>
            <div className="font-semibold text-slate-100">{log.Character}</div>
            <div className="text-xs text-slate-500 mt-0.5">{log.Talent}</div>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-4">
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${badgeClass}`}
        >
          {log.Class}
        </span>
      </td>
      <td className="py-2.5 px-4">
        <div className="text-sm font-semibold text-slate-200">{log.Amount}</div>
      </td>
      <td className="py-2.5 px-4">
        <div className="text-sm font-medium text-emerald-400">{log.DPS}</div>
      </td>
      <td className="py-2.5 px-4 text-right">
        <div className="text-xs text-slate-500">
          <div className="text-slate-400">{log.boss}</div>
          <div className="truncate w-32 ml-auto" title={log.raidInstance}>
            {log.raidInstance}
          </div>
          <div>{new Date(log.date).toLocaleDateString()}</div>
        </div>
      </td>
    </tr>
  );
}
