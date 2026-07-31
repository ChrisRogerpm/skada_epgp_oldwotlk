"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/src/infrastructure/config/supabase";
import {
  BenefitCategory,
  PenaltyCategory,
  RaidRule,
} from "@/app/types/Reglas";
import { AdminStatus } from "../types";

type BenePenType = "benefits" | "penalties";

export function useReglasAdmin(search: string, onStatus: (status: AdminStatus) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lootRules, setLootRules] = useState<RaidRule[]>([]);
  const [benefits, setBenefits] = useState<BenefitCategory[]>([]);
  const [penalties, setPenalties] = useState<PenaltyCategory[]>([]);
  const [expandedRaids, setExpandedRaids] = useState<Set<number>>(new Set([0]));
  const [activeTab, setActiveTab] = useState<"loteo" | "beneficios" | "sanciones">("loteo");
  const fetchedRef = useRef(false);

  const fetchRules = async () => {
    if (fetchedRef.current || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/reglas");
      if (!res.ok) throw new Error("Error al obtener reglas");
      const data = await res.json();

      const loot = data.find((s: Record<string, unknown>) => s["Reglas de Loteo"])?.["Reglas de Loteo"] || [];
      const bene = data.find((s: Record<string, unknown>) => s["Beneficios"])?.["Beneficios"] || [];
      const perj = data.find((s: Record<string, unknown>) => s["Perjuicios"])?.["Perjuicios"] || [];

      setLootRules(loot);
      setBenefits(bene);
      setPenalties(perj);
      fetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching rules:", error);
      onStatus({ type: "error", message: "Error al cargar datos del servidor" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveRules = async () => {
    setIsSaving(true);
    try {
      const { error: delLootError } = await supabase.from("reglas_loteo").delete().not("raid", "is", null);
      if (delLootError) {
        throw new Error(`Error al limpiar Loteo: ${delLootError.message || delLootError.code || JSON.stringify(delLootError)}`);
      }

      const { error: delPointsError } = await supabase.from("reglas_puntos").delete().not("tipo", "is", null);
      if (delPointsError) {
        throw new Error(`Error al limpiar Bonos/Sanciones: ${delPointsError.message || delPointsError.code || JSON.stringify(delPointsError)}`);
      }

      const flatLootItems = lootRules.flatMap((raid) =>
        raid.items.map((item) => ({
          raid: raid.raid,
          categoria_item: item.category,
          nombre_item: item.item,
          requisitos: item.requirement,
          valor_minimo: item.valueMin,
          icon_url: item.icon,
        })),
      );

      if (flatLootItems.length > 0) {
        const { error: lootInsertError } = await supabase.from("reglas_loteo").insert(flatLootItems);
        if (lootInsertError) throw lootInsertError;
      }

      const formattedPoints = [
        ...benefits.flatMap((b) =>
          b.items.map((item) => ({
            tipo: "beneficio",
            categoria: b.category,
            descripcion: item.descripcion,
            valor: item.valor,
            icon_url: item.icon,
          })),
        ),
        ...penalties.flatMap((p) =>
          p.items.map((item) => ({
            tipo: "perjuicio",
            categoria: p.category,
            descripcion: item.descripcion,
            valor: item.valor,
            icon_url: item.icon,
          })),
        ),
      ];

      if (formattedPoints.length > 0) {
        const { error: pointsError } = await supabase.from("reglas_puntos").insert(formattedPoints);
        if (pointsError) throw pointsError;
      }

      onStatus({ type: "success", message: "Cambios guardados correctamente en la base de datos" });
    } catch (error) {
      console.error("Error crítico detallado:", error);
      const errorMessage =
        error instanceof Error ? error.message : typeof error === "object" ? JSON.stringify(error) : String(error);
      onStatus({ type: "error", message: "Error al guardar: " + errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const addRaid = () => {
    setLootRules([{ raid: "Nueva Raid", items: [] }, ...lootRules]);
    setExpandedRaids(new Set([0, ...Array.from(expandedRaids).map((i) => i + 1)]));
  };

  const removeRaid = (raidIndex: number) => {
    setLootRules(lootRules.filter((_, i) => i !== raidIndex));
  };

  const updateRaidName = (raidIndex: number, name: string) => {
    setLootRules((prev) => {
      const next = [...prev];
      next[raidIndex] = { ...next[raidIndex], raid: name };
      return next;
    });
  };

  const toggleRaidExpand = (index: number) => {
    const next = new Set(expandedRaids);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedRaids(next);
  };

  const addItemToRaid = (raidIndex: number) => {
    setLootRules((prev) => {
      const newList = [...prev];
      newList[raidIndex] = {
        ...newList[raidIndex],
        items: [
          ...newList[raidIndex].items,
          {
            category: "ITEM BIS",
            item: "Nuevo Ítem",
            requirement: [],
            valueMin: 100,
            icon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg",
          },
        ],
      };
      return newList;
    });
  };

  const cloneItem = (raidIndex: number, itemIndex: number) => {
    setLootRules((prev) => {
      const newList = [...prev];
      const items = [...newList[raidIndex].items];
      const itemToClone = JSON.parse(JSON.stringify(items[itemIndex]));
      itemToClone.item = `${itemToClone.item} (Copia)`;
      items.splice(itemIndex + 1, 0, itemToClone);
      newList[raidIndex] = { ...newList[raidIndex], items };
      return newList;
    });
  };

  const updateItem = (raidIndex: number, itemIndex: number, field: string, value: string | number) => {
    setLootRules((prev) => {
      const newList = [...prev];
      const items = [...newList[raidIndex].items];
      let newValue: unknown = value;
      if (field === "requirement" && typeof value === "string") {
        newValue = value.split("\n").filter((s) => s.trim() !== "");
      }
      items[itemIndex] = { ...items[itemIndex], [field]: newValue };
      newList[raidIndex] = { ...newList[raidIndex], items };
      return newList;
    });
  };

  const removeItem = (raidIndex: number, itemIndex: number) => {
    setLootRules((prev) => {
      const newList = [...prev];
      const items = newList[raidIndex].items.filter((_, i) => i !== itemIndex);
      newList[raidIndex] = { ...newList[raidIndex], items };
      return newList;
    });
  };

  const addBenePenCategory = (type: BenePenType) => {
    const setter = type === "benefits" ? setBenefits : setPenalties;
    setter((prev) => [...prev, { category: "Nueva Categoría", items: [] }]);
  };

  const removeBenePenCategory = (type: BenePenType, catIndex: number) => {
    const setter = type === "benefits" ? setBenefits : setPenalties;
    setter((prev) => prev.filter((_, i) => i !== catIndex));
  };

  const updateBenePenCategory = (type: BenePenType, index: number, category: string) => {
    const setter = type === "benefits" ? setBenefits : setPenalties;
    setter((prev) => {
      const newData = [...prev];
      newData[index] = { ...newData[index], category };
      return newData;
    });
  };

  const addBenePenItem = (type: BenePenType, catIndex: number) => {
    const setter = type === "benefits" ? setBenefits : setPenalties;
    setter((prev) => {
      const newData = [...prev];
      const items = [
        ...newData[catIndex].items,
        {
          descripcion: type === "benefits" ? "Nuevo Beneficio" : "Nuevo Perjuicio",
          valor: type === "benefits" ? 50 : -50,
          icon:
            type === "benefits"
              ? "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_02.jpg"
              : "https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_orc_01.jpg",
        },
      ];
      newData[catIndex] = { ...newData[catIndex], items };
      return newData;
    });
  };

  const updateBenePenItem = (
    type: BenePenType,
    catIndex: number,
    itemIndex: number,
    field: "descripcion" | "icon" | "valor",
    value: string | number,
  ) => {
    const setter = type === "benefits" ? setBenefits : setPenalties;
    setter((prev) => {
      const newData = [...prev];
      const items = [...newData[catIndex].items];
      items[itemIndex] = { ...items[itemIndex], [field]: value };
      newData[catIndex] = { ...newData[catIndex], items };
      return newData;
    });
  };

  const removeBenePenItem = (type: BenePenType, catIndex: number, itemIndex: number) => {
    const setter = type === "benefits" ? setBenefits : setPenalties;
    setter((prev) => {
      const newData = [...prev];
      newData[catIndex] = {
        ...newData[catIndex],
        items: newData[catIndex].items.filter((_, i) => i !== itemIndex),
      };
      return newData;
    });
  };

  const filteredLootRules = useMemo(() => {
    if (!search) return lootRules;
    const term = search.toLowerCase();
    return lootRules
      .map((raid) => ({
        ...raid,
        items: raid.items.filter(
          (item) =>
            item.item.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term) ||
            raid.raid.toLowerCase().includes(term),
        ),
      }))
      .filter((raid) => raid.items.length > 0 || raid.raid.toLowerCase().includes(term));
  }, [lootRules, search]);

  return {
    isLoading,
    isSaving,
    activeTab,
    setActiveTab,
    lootRules,
    benefits,
    penalties,
    expandedRaids,
    filteredLootRules,
    saveRules,
    addRaid,
    removeRaid,
    updateRaidName,
    toggleRaidExpand,
    addItemToRaid,
    cloneItem,
    updateItem,
    removeItem,
    addBenePenCategory,
    removeBenePenCategory,
    updateBenePenCategory,
    addBenePenItem,
    updateBenePenItem,
    removeBenePenItem,
  };
}
