"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/infrastructure/config/supabase";
import { AdminStatus, EpgpSearchResult, LootItemOption, LootWinForm } from "../types";

const EMPTY_FORM: LootWinForm = {
  id: null,
  personaje: "",
  class: "",
  raid: "RS",
  id_items: [],
  id_raids: "",
  note: "",
};

interface LootWinListItem {
  id: number;
  personaje: string;
  class: string | null;
  id_item: number;
  id_raids: string | null;
  source?: "sync" | "manual";
  note?: string | null;
  created_at?: string;
  item_name: string;
  item_icon: string;
  item_raid: string;
  raid_date: string;
  boss_name: string;
}

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

export function useLootAdmin(search: string, onStatus: (status: AdminStatus) => void) {
  const [wins, setWins] = useState<LootWinListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isSearchingChar, setIsSearchingChar] = useState(false);
  const [charSearchResults, setCharSearchResults] = useState<EpgpSearchResult[]>([]);

  const [itemOptions, setItemOptions] = useState<LootItemOption[]>([]);

  const [winForm, setWinForm] = useState<LootWinForm>(EMPTY_FORM);

  const limit = 10;

  const fetchWins = async () => {
    setIsLoading(true);
    try {
      const res = await authedFetch(`/api/loot?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(search)}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al obtener registros de loot");
      setWins(result.data || []);
      setTotalItems(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Error fetching loot wins:", error);
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al cargar registros" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search]);

  // Ítems disponibles para el raid seleccionado en el formulario
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`/api/loot/matrix?raid=${winForm.raid}`);
        if (!res.ok) return;
        const data = await res.json();
        setItemOptions(data.items || []);
      } catch (err) {
        console.error("Error fetching item options:", err);
      }
    };
    fetchItems();
  }, [winForm.raid]);

  const searchCharacters = async (q: string) => {
    if (!q || q.length < 2) {
      setCharSearchResults([]);
      return;
    }
    setIsSearchingChar(true);
    try {
      const res = await fetch(`/api/epgp/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setCharSearchResults(data.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingChar(false);
    }
  };

  const selectSearchResult = (char: EpgpSearchResult) => {
    setWinForm((prev) => ({ ...prev, personaje: char.nombre_alter, class: char.clase }));
    setCharSearchResults([]);
  };

  const editWin = (win: LootWinListItem) => {
    setWinForm({
      id: win.id,
      personaje: win.personaje,
      class: win.class || "",
      raid: win.item_raid || "RS",
      id_items: [win.id_item],
      id_raids: win.id_raids || "",
      note: win.note || "",
    });
  };

  const resetForm = () => setWinForm(EMPTY_FORM);

  const saveWin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const method = winForm.id ? "PUT" : "POST";
      // El form ya no ofrece elegir sesión de raid; se preserva la que ya
      // tenía el registro (si se está editando uno del sync), o queda null.
      const sharedFields = {
        personaje: winForm.personaje,
        class: winForm.class,
        id_raids: winForm.id_raids || null,
        note: winForm.note || null,
      };
      const payload = winForm.id
        ? { id: winForm.id, ...sharedFields, id_item: winForm.id_items[0] }
        : { ...sharedFields, id_items: winForm.id_items };

      const res = await authedFetch("/api/loot", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al guardar");

      const count = winForm.id_items.length;
      onStatus({
        type: "success",
        message: winForm.id ? "Registro actualizado correctamente" : `${count} ítem${count > 1 ? "s" : ""} registrado${count > 1 ? "s" : ""} correctamente`,
      });
      resetForm();
      setCurrentPage(1);
      fetchWins();
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al guardar" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteWin = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este registro de loot?")) return;

    setIsSaving(true);
    try {
      const res = await authedFetch(`/api/loot?id=${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al eliminar");
      onStatus({ type: "success", message: "Registro eliminado" });
      fetchWins();
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al eliminar" });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    wins,
    totalItems,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    isSaving,
    isSearchingChar,
    charSearchResults,
    itemOptions,
    winForm,
    setWinForm,
    searchCharacters,
    selectSearchResult,
    editWin,
    resetForm,
    saveWin,
    deleteWin,
  };
}
