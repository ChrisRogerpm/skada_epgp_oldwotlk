"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/src/infrastructure/config/supabase";
import { PuntoUIItem } from "@/app/types/Reglas";
import { AdminStatus } from "../types";

type PuntoTipo = "beneficio" | "perjuicio";

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

const DEFAULT_ICON: Record<PuntoTipo, string> = {
  beneficio: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_coin_02.jpg",
  perjuicio: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_orc_01.jpg",
};

export function useReglasPuntosAdmin(tipo: PuntoTipo, search: string, onStatus: (status: AdminStatus) => void) {
  const [items, setItems] = useState<PuntoUIItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Categorías "en blanco" agregadas en esta sesión que todavía no tienen
  // ningún ítem (y por lo tanto no existen como fila real en la base).
  const [draftCategories, setDraftCategories] = useState<string[]>([]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reglas");
      if (!res.ok) throw new Error("Error al obtener reglas");
      const data = await res.json();
      const sectionKey = tipo === "beneficio" ? "Beneficios" : "Perjuicios";
      const section = data.find((s: Record<string, unknown>) => s[sectionKey])?.[sectionKey] || [];

      const flat: PuntoUIItem[] = [];
      section.forEach((cat: any) => {
        (cat.items || []).forEach((item: any) => {
          flat.push({
            id: item.id,
            categoria: cat.category,
            descripcion: item.descripcion,
            valor: item.valor,
            icon: item.icon,
            sortOrder: item.sortOrder ?? 0,
          });
        });
      });
      setItems(flat);
    } catch (error) {
      console.error(`Error fetching ${tipo}:`, error);
      onStatus({ type: "error", message: "Error al cargar datos del servidor" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  const categorized = useMemo(() => {
    const map = new Map<string, PuntoUIItem[]>();
    draftCategories.forEach((cat) => map.set(cat, []));
    items.forEach((item) => {
      if (!map.has(item.categoria)) map.set(item.categoria, []);
      map.get(item.categoria)!.push(item);
    });

    let entries = Array.from(map.entries()).map(([category, categoryItems]) => ({
      category,
      // Se reordena acá (no solo al llegar del fetch) para que subir/bajar
      // se refleje al toque: moveItem cambia el sortOrder en el estado pero
      // no reordena el array `items` en sí.
      items: [...categoryItems].sort((a, b) => a.sortOrder - b.sortOrder),
    }));
    if (search) {
      const lower = search.toLowerCase();
      entries = entries
        .map((cat) => ({ ...cat, items: cat.items.filter((i) => i.descripcion.toLowerCase().includes(lower)) }))
        .filter((cat) => cat.items.length > 0 || cat.category.toLowerCase().includes(lower));
    }
    return entries;
  }, [items, draftCategories, search]);

  const addCategory = () => {
    const name = `Nueva categoría ${draftCategories.length + 1}`;
    setDraftCategories((prev) => [...prev, name]);
  };

  const removeCategory = async (category: string) => {
    const categoryItems = items.filter((i) => i.categoria === category);
    if (categoryItems.length === 0) {
      setDraftCategories((prev) => prev.filter((c) => c !== category));
      return;
    }
    if (!confirm(`¿Eliminar la categoría "${category}" y sus ${categoryItems.length} ítems?`)) return;

    try {
      await Promise.all(categoryItems.map((i) => authedFetch(`/api/reglas/puntos?id=${i.id}`, { method: "DELETE" })));
      onStatus({ type: "success", message: "Categoría eliminada" });
      fetchItems();
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al eliminar la categoría" });
    }
  };

  const renameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) return;
    if (draftCategories.includes(oldName)) {
      setDraftCategories((prev) => prev.map((c) => (c === oldName ? newName : c)));
      return;
    }
    const categoryItems = items.filter((i) => i.categoria === oldName);
    setItems((prev) => prev.map((i) => (i.categoria === oldName ? { ...i, categoria: newName } : i)));
    try {
      await Promise.all(
        categoryItems.map((i) =>
          authedFetch("/api/reglas/puntos", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: i.id, tipo, categoria: newName, descripcion: i.descripcion, valor: i.valor, iconUrl: i.icon }),
          }),
        ),
      );
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al renombrar la categoría" });
      fetchItems();
    }
  };

  const addItem = async (category: string) => {
    try {
      const res = await authedFetch("/api/reglas/puntos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          categoria: category,
          descripcion: tipo === "beneficio" ? "Nuevo beneficio" : "Nuevo perjuicio",
          valor: tipo === "beneficio" ? 50 : -50,
          iconUrl: DEFAULT_ICON[tipo],
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al crear");

      setDraftCategories((prev) => prev.filter((c) => c !== category));
      setItems((prev) => [
        ...prev,
        {
          id: result.id,
          categoria: category,
          descripcion: result.descripcion,
          valor: result.valor,
          icon: result.iconUrl,
          sortOrder: result.sortOrder ?? 0,
        },
      ]);
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al agregar el ítem" });
    }
  };

  const updateItemLocal = (id: string, field: "descripcion" | "icon" | "valor", value: string | number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const persistItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    try {
      const res = await authedFetch("/api/reglas/puntos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, tipo, categoria: item.categoria, descripcion: item.descripcion, valor: item.valor, iconUrl: item.icon }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al guardar");
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al guardar el ítem" });
    }
  };

  // Sube/baja un ítem intercambiando su sort_order con el vecino dentro de
  // la misma categoría (el orden es global en la tabla, pero acá solo nos
  // importa el orden relativo entre los ítems ya agrupados de esa categoría).
  const persistOrder = async (item: PuntoUIItem) => {
    try {
      const res = await authedFetch("/api/reglas/puntos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          tipo,
          categoria: item.categoria,
          descripcion: item.descripcion,
          valor: item.valor,
          iconUrl: item.icon,
          sortOrder: item.sortOrder,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al guardar el orden");
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al guardar el orden" });
      fetchItems();
    }
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    const current = items.find((i) => i.id === id);
    if (!current) return;

    const siblings = items
      .filter((i) => i.categoria === current.categoria)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const index = siblings.findIndex((i) => i.id === id);
    const neighborIndex = direction === "up" ? index - 1 : index + 1;
    if (neighborIndex < 0 || neighborIndex >= siblings.length) return;

    const neighbor = siblings[neighborIndex];
    const swappedCurrent = { ...current, sortOrder: neighbor.sortOrder };
    const swappedNeighbor = { ...neighbor, sortOrder: current.sortOrder };

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === swappedCurrent.id) return swappedCurrent;
        if (i.id === swappedNeighbor.id) return swappedNeighbor;
        return i;
      }),
    );

    persistOrder(swappedCurrent);
    persistOrder(swappedNeighbor);
  };

  const removeItem = async (id: string) => {
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await authedFetch(`/api/reglas/puntos?id=${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al eliminar");
    } catch (error) {
      setItems(previous);
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al eliminar el ítem" });
    }
  };

  return {
    isLoading,
    categorized,
    addCategory,
    removeCategory,
    renameCategory,
    addItem,
    updateItemLocal,
    persistItem,
    moveItem,
    removeItem,
  };
}
