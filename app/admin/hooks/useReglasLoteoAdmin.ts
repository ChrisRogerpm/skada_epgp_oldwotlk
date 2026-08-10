"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/infrastructure/config/supabase";
import { LootRuleUIItem, RaidCode, REGLAS_RAID_TABS } from "@/app/types/Reglas";
import { AdminStatus, LootItemOption } from "../types";

interface LootRuleForm {
  id: string | null;
  raidCode: RaidCode;
  categoria: string;
  nombreItem: string;
  iconUrl: string;
  idItem: number | null;
  valorMinimo: number;
  requisitos: string[];
}

const EMPTY_FORM: LootRuleForm = {
  id: null,
  raidCode: REGLAS_RAID_TABS[0].value,
  categoria: "",
  nombreItem: "",
  iconUrl: "",
  idItem: null,
  valorMinimo: 100,
  requisitos: [],
};

async function authedFetch(url: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    },
  });
}

export function useReglasLoteoAdmin(search: string, onStatus: (status: AdminStatus) => void) {
  const [rules, setRules] = useState<LootRuleUIItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeRaid, setActiveRaid] = useState<RaidCode>(REGLAS_RAID_TABS[0].value);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState<LootRuleForm>(EMPTY_FORM);
  const [itemOptions, setItemOptions] = useState<LootItemOption[]>([]);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reglas");
      if (!res.ok) throw new Error("Error al obtener reglas");
      const data = await res.json();
      const lootSection = data.find((s: Record<string, unknown>) => s["Reglas de Loteo"])?.["Reglas de Loteo"] || [];

      const flat: LootRuleUIItem[] = [];
      lootSection.forEach((raidGroup: any) => {
        (raidGroup.items || []).forEach((item: any) => {
          flat.push({
            id: item.id,
            raidCode: item.raidCode,
            category: item.category,
            name: item.item,
            icon: item.icon,
            idItem: item.idItem ?? null,
            valueMin: item.valueMin,
            requirement: item.requirement || [],
          });
        });
      });
      setRules(flat);
    } catch (error) {
      console.error("Error fetching loot rules:", error);
      onStatus({ type: "error", message: "Error al cargar reglas de loteo" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Catálogo de ítems para el raid elegido en el formulario (mismo endpoint que usa /loot).
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`/api/loot/matrix?raid=${form.raidCode}`);
        if (!res.ok) return;
        const data = await res.json();
        setItemOptions(data.items || []);
      } catch (err) {
        console.error("Error fetching item catalog:", err);
      }
    };
    fetchItems();
  }, [form.raidCode]);

  const categories = useMemo(
    () => Array.from(new Set(rules.map((r) => r.category).filter(Boolean))).sort(),
    [rules],
  );

  const rulesForActiveRaid = useMemo(() => {
    let list = rules.filter((r) => r.raidCode === activeRaid);
    if (search) {
      const lower = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(lower) || r.category.toLowerCase().includes(lower));
    }
    return list;
  }, [rules, activeRaid, search]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, raidCode: activeRaid, categoria: categories[0] || "" });
    setIsDrawerOpen(true);
  };

  const openEdit = (rule: LootRuleUIItem) => {
    setForm({
      id: rule.id,
      raidCode: rule.raidCode || activeRaid,
      categoria: rule.category,
      nombreItem: rule.name,
      iconUrl: rule.icon,
      idItem: rule.idItem,
      valorMinimo: rule.valueMin,
      requisitos: rule.requirement,
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  const pickItem = (idItem: number) => {
    const item = itemOptions.find((i) => i.id_item === idItem);
    if (!item) return;
    setForm((prev) => ({ ...prev, idItem, nombreItem: item.name, iconUrl: item.icon }));
  };

  const addRequirement = (text: string) => {
    if (!text.trim()) return;
    setForm((prev) => ({ ...prev, requisitos: [...prev.requisitos, text.trim()] }));
  };

  const removeRequirement = (index: number) => {
    setForm((prev) => ({ ...prev, requisitos: prev.requisitos.filter((_, i) => i !== index) }));
  };

  const saveItem = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      const method = form.id ? "PUT" : "POST";
      const payload = {
        id: form.id,
        raidCode: form.raidCode,
        categoria: form.categoria,
        nombreItem: form.nombreItem,
        iconUrl: form.iconUrl,
        idItem: form.idItem,
        valorMinimo: form.valorMinimo,
        requisitos: form.requisitos,
      };

      const res = await authedFetch("/api/reglas/loteo", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al guardar");

      onStatus({ type: "success", message: form.id ? "Regla actualizada" : "Regla registrada" });
      closeDrawer();
      fetchRules();
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al guardar" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("¿Eliminar esta regla de loteo?")) return;
    try {
      const res = await authedFetch(`/api/reglas/loteo?id=${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al eliminar");
      onStatus({ type: "success", message: "Regla eliminada" });
      fetchRules();
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al eliminar" });
    }
  };

  return {
    rules,
    rulesForActiveRaid,
    isLoading,
    isSaving,
    activeRaid,
    setActiveRaid,
    isDrawerOpen,
    form,
    setForm,
    itemOptions,
    categories,
    openCreate,
    openEdit,
    closeDrawer,
    pickItem,
    addRequirement,
    removeRequirement,
    saveItem,
    deleteItem,
  };
}
