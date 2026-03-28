"use client";

import { RaidLog } from "../types/RaidLog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CLASS_COLORS, DEFAULT_ICONS } from "../../lib/constants";

interface LogsChartProps {
  logs: RaidLog[];
  metric: "Damage" | "Healing";
}

const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const data = props.payload.value; // El nombre del personaje
  const icon = props.payload.icon; // El icono que pasaremos en el objeto

  return (
    <g transform={`translate(${x},${y})`}>
      <image
        x={-10}
        y={5}
        width={20}
        height={20}
        href={icon || DEFAULT_ICONS.UNKNOWN}
        clipPath="inset(0% round 4px)"
      />
      <text
        x={0}
        y={35}
        dy={0}
        textAnchor="end"
        fill="#94a3b8"
        fontSize={10}
        transform="rotate(-45)"
      >
        {payload.value}
      </text>
    </g>
  );
};

// Extrae el color hexadecimal de la clase de Tailwind de constantes
const getHexColor = (className: string) => {
  const match = className.match(/bg-\[#([0-9a-fA-F]{6})\]/i);
  return match ? `#${match[1]}` : "#64748b"; // fallback a slate-500
};

export default function LogsChart({ logs, metric }: LogsChartProps) {
  if (!logs || logs.length === 0) return null;

  // Tomar el top 10 para el gráfico
  const top10 = logs.slice(0, 10).map((log) => {
    let numericValue = 0;

    if (metric === "Damage") {
      // Para Daño usamos DPS (valores usualmente en K)
      const dpsRaw = log.DPS ? String(log.DPS).replace(/,/g, "") : "0";
      numericValue = parseFloat(dpsRaw);
      
      // Fallback por si el log no tiene DPS parseable
      if (numericValue === 0) {
        const rawAmount = String(log.Amount).replace(/,/g, "");
        if (rawAmount.includes("M")) numericValue = (parseFloat(rawAmount) * 1000000) / 300; // Estimado
        else if (rawAmount.includes("K")) numericValue = parseFloat(rawAmount);
        else numericValue = parseFloat(rawAmount);
      }
    } else {
      // Para Sanación usamos el Total (valores usualmente en M)
      const rawAmount = String(log.Amount).replace(/,/g, "");
      if (rawAmount.includes("M")) {
        numericValue = parseFloat(rawAmount.replace("M", "")) * 1000000;
      } else if (rawAmount.includes("K")) {
        numericValue = parseFloat(rawAmount.replace("K", "")) * 1000;
      } else {
        numericValue = parseFloat(rawAmount);
      }
    }

    return {
      name: log.Character,
      icon: log.Icon,
      classColor: getHexColor(CLASS_COLORS[log.Class.toUpperCase()] || ""),
      value: numericValue,
      displayValue: log.Amount,
      dps: log.DPS,
    };
  });

  return (
    <div className="w-full h-[450px] bg-slate-900/50 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm mb-8">
      <h3 className="text-slate-300 font-bold mb-4 uppercase tracking-widest text-xs px-4">
        Top 10 {metric === "Damage" ? "DPS (Daño por Segundo)" : "Sanación Total"}
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={top10}
          layout="horizontal"
          margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={(props) => {
              const { index } = props;
              return <CustomXAxisTick {...props} payload={{ ...props.payload, icon: top10[index]?.icon }} />;
            }}
            interval={0}
            height={80}
          />
          <YAxis 
            type="number" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickFormatter={(value) => {
              if (metric === "Damage") {
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value;
              } else {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value;
              }
            }} 
          />
          <Tooltip
            cursor={{ fill: '#334155', opacity: 0.2 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl">
                    <p className="text-white font-bold">{data.name}</p>
                    <div className="mt-1 space-y-1">
                      {metric === "Damage" ? (
                        <>
                          <p className="text-cyan-400 text-sm font-bold">DPS: {data.dps}</p>
                          <p className="text-slate-500 text-[10px] uppercase">Total: {data.displayValue}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-emerald-400 text-sm font-bold">Total: {data.displayValue}</p>
                          {data.dps && <p className="text-slate-500 text-[10px] uppercase">HPS: {data.dps}</p>}
                        </>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={35}>
            {top10.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.classColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
