"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { AdminStatus } from "../types";

interface AdminStatusToastProps {
  status: AdminStatus | null;
  onClose: () => void;
}

export default function AdminStatusToast({ status, onClose }: AdminStatusToastProps) {
  if (!status) return null;

  return (
    <div className="fixed top-8 right-8 z-[100] w-full max-w-sm animate-in fade-in slide-in-from-right-8 duration-500">
      <div
        className={clsx(
          "p-5 rounded-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-start gap-4 backdrop-blur-2xl",
          status.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border-red-500/20 text-red-400",
        )}
      >
        <div className={clsx("p-2 rounded-xl shrink-0", status.type === "success" ? "bg-emerald-500/20" : "bg-red-500/20")}>
          {status.type === "success" ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm uppercase tracking-tight">
            {status.type === "success" ? "¡Sincronización Exitosa!" : "Error de Sistema"}
          </p>
          <p className="text-xs opacity-80 font-medium leading-relaxed mt-1">
            {status.type === "success"
              ? "Los datos se han actualizado correctamente en la base de datos de Supabase."
              : status.message}
          </p>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onClose} className="shrink-0 hover:bg-white/10">
          <X size={16} />
        </Button>
      </div>
    </div>
  );
}
