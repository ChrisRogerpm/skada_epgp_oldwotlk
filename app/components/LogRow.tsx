"use client";

import { RaidLog } from "../types/RaidLog";
import Image from "next/image";
import { CLASS_COLORS, DEFAULT_ICONS } from "@/src/domain/constants/constants";

interface LogRowProps {
  log: RaidLog;
  index: number;
  metric?: "Damage" | "Healing";
}

export default function LogRow({ log, index, metric = "Damage" }: LogRowProps) {
  const badgeClass =
    CLASS_COLORS[log.Class.toUpperCase()] || "bg-slate-700 text-slate-900 dark:text-white";

  return (
    <tr className="border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:bg-slate-800/50 transition-colors group">
      <td className="py-1 px-4 text-sm text-slate-700 dark:text-slate-300 font-mono">
        <span
          className={`flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-slate-900 border text-xs ${log.Rank <= 3 ? "border-yellow-500/50 text-yellow-400" : "border-slate-300 dark:border-slate-700"}`}
        >
          {log.Rank}
        </span>
      </td>
      <td className="py-1 px-4">
        <div className="flex items-center space-x-2">
          <div className="relative w-7 h-7 overflow-hidden rounded-full ring-2 ring-slate-200 dark:ring-slate-800 group-hover:ring-slate-400 dark:group-hover:ring-slate-600 transition-all shrink-0">
            <Image
              src={log.Icon || DEFAULT_ICONS.UNKNOWN}
              alt={log.Character}
              layout="fill"
              objectFit="cover"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_ICONS.UNKNOWN;
              }}
            />
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{log.Character}</div>
            <div className="text-xs text-slate-500">{log.Talent}</div>
          </div>
        </div>
      </td>
      <td className="py-1 px-4">
        <span
          className={`px-2 py-0.5 rounded-md text-xs font-bold tracking-wide uppercase ${badgeClass}`}
        >
          {log.Class}
        </span>
      </td>
      <td className="py-1 px-4">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{log.Amount}</div>
      </td>
      {metric === "Damage" && (
        <td className="py-1 px-4">
          <div className="text-sm font-medium text-emerald-400">{log.DPS}</div>
        </td>
      )}
    </tr>
  );
}
