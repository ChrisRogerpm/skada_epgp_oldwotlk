"use client";

import { confirmDialog } from "@/components/confirm-dialog";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LootRuleUIItem, RaidCode } from "@/app/types/Reglas";
import { AdminStatus } from "../types";
import { adminJson } from "../lib/api";
import { useLootRules } from "./useLootRules";

export interface LootRuleForm {
  id: string | null;
  raidCode: RaidCode;
  categoria: string;
  nombreItem: string;
  iconUrl: string;
  idItem: number | null;
  valorMinimo: number;
  requisitos: string[];
}

export const EMPTY_RULE_FORM: LootRuleForm = {
  id: null,
  raidCode: "ICC",
  categoria: "",
  nombreItem: "",
  iconUrl: "",
  idItem: null,
  valorMinimo: 100,
  requisitos: [],
};

export function ruleToForm(rule: LootRuleUIItem, fallbackRaid: RaidCode): LootRuleForm {
  return {
    id: rule.id,
    raidCode: rule.raidCode || fallbackRaid,
    categoria: rule.category,
    nombreItem: rule.name,
    iconUrl: rule.icon,
    idItem: rule.idItem,
    valorMinimo: rule.valueMin,
    requisitos: rule.requirement,
  };
}

/** Alta, edición y baja de reglas de loteo; la lista sale de /api/reglas (compartida con /reglas). */
export function useReglasLoteoAdmin(onStatus: (status: AdminStatus) => void) {
  const queryClient = useQueryClient();
  const { rules, isLoading } = useLootRules();
  const [isSaving, setIsSaving] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["reglas"] });
    queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
    queryClient.invalidateQueries({ queryKey: ["adminActivity"] });
  };

  const categories = Array.from(new Set(rules.map((r) => r.category).filter(Boolean))).sort();
  const requirementOptions = Array.from(new Set(rules.flatMap((r) => r.requirement))).sort();

  const saveRule = async (form: LootRuleForm) => {
    setIsSaving(true);
    try {
      await adminJson("/api/reglas/loteo", {
        method: form.id ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onStatus({
        type: "success",
        message: form.id ? "Regla actualizada" : "Regla creada",
        description: `${form.nombreItem} · mínimo ${form.valorMinimo}`,
      });
      await adminJson("/api/admin/overview?fresh=1").catch(() => null);
      refresh();
      return true;
    } catch (error) {
      onStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Error al guardar",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRule = async (rule: { id: string; name: string }) => {
    const ok = await confirmDialog({
      title: `¿Eliminar la regla de ${rule.name}?`,
      description: "El ítem quedará sin mínimo de puntos para lotear.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return false;
    try {
      await adminJson(`/api/reglas/loteo?id=${rule.id}`, { method: "DELETE" });
      onStatus({ type: "success", message: "Regla eliminada" });
      await adminJson("/api/admin/overview?fresh=1").catch(() => null);
      refresh();
      return true;
    } catch (error) {
      onStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Error al eliminar",
      });
      return false;
    }
  };

  return { rules, isLoading, isSaving, categories, requirementOptions, saveRule, deleteRule };
}
