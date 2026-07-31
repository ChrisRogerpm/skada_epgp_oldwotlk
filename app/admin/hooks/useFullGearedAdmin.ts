"use client";

import { useEffect, useState } from "react";
import { FullGearedCharacter } from "@/src/domain/entities/FullGeared";
import { AdminStatus, EpgpSearchResult, FullGearedForm } from "../types";

const EMPTY_FORM: FullGearedForm = {
  id: null,
  name: "",
  class: "",
  icc: false,
  rs: false,
  gs: 0,
  main: "",
};

export function useFullGearedAdmin(search: string, onStatus: (status: AdminStatus) => void) {
  const [characters, setCharacters] = useState<FullGearedCharacter[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isSearchingChar, setIsSearchingChar] = useState(false);
  const [charSearchResults, setCharSearchResults] = useState<EpgpSearchResult[]>([]);
  const [charForm, setCharForm] = useState<FullGearedForm>(EMPTY_FORM);

  const limit = 10;

  const fetchCharacters = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/full-geared?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(search)}`,
      );
      if (!res.ok) throw new Error("Error al obtener personajes");
      const result = await res.json();
      setCharacters(result.data || []);
      setTotalItems(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Error fetching full geared:", error);
      onStatus({ type: "error", message: "Error al cargar personajes" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search]);

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
    setCharForm((prev) => ({
      ...prev,
      name: char.nombre_alter,
      class: char.clase,
      main: char.main,
    }));
    setCharSearchResults([]);
  };

  const editCharacter = (char: FullGearedCharacter) => {
    setCharForm({
      id: char.id ?? null,
      name: char.name,
      class: char.class,
      icc: char.icc,
      rs: char.rs,
      gs: char.gs,
      main: char.main,
    });
  };

  const resetForm = () => setCharForm(EMPTY_FORM);

  const saveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const method = charForm.id ? "PUT" : "POST";
      const res = await fetch("/api/full-geared", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(charForm),
      });

      if (!res.ok) throw new Error("Error al guardar");

      onStatus({ type: "success", message: "Personaje guardado correctamente" });
      resetForm();
      fetchCharacters();
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al guardar" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCharacter = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este personaje?")) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/full-geared?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      onStatus({ type: "success", message: "Personaje eliminado" });
      fetchCharacters();
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al eliminar" });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    characters,
    totalItems,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    isSaving,
    isSearchingChar,
    charSearchResults,
    charForm,
    setCharForm,
    searchCharacters,
    selectSearchResult,
    editCharacter,
    resetForm,
    saveCharacter,
    deleteCharacter,
    limit,
  };
}
