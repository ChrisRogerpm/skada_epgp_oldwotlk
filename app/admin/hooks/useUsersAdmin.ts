"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/infrastructure/config/supabase";
import { AdminStatus, AdminUserListItem, UserRegistrationForm } from "../types";

const EMPTY_FORM: UserRegistrationForm = {
  email: "",
  password: "",
  role: "user",
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

export function useUsersAdmin(search: string, onStatus: (status: AdminStatus) => void) {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [userForm, setUserForm] = useState<UserRegistrationForm>(EMPTY_FORM);

  const limit = 10;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await authedFetch(
        `/api/admin/users?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(search)}`,
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al obtener usuarios");
      setUsers(result.data || []);
      setTotalItems(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al cargar usuarios" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search]);

  const resetForm = () => setUserForm(EMPTY_FORM);

  const registerUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authedFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al registrar usuario");

      onStatus({ type: "success", message: "Usuario registrado correctamente" });
      resetForm();
      setCurrentPage(1);
      fetchUsers();
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al registrar usuario" });
    } finally {
      setIsSaving(false);
    }
  };

  const changeRole = async (id: string, newRole: "admin" | "user") => {
    const action = newRole === "admin" ? "promover a admin" : "quitar el rol de admin";
    if (!confirm(`¿Seguro que deseas ${action} a este usuario?`)) return;

    setIsSaving(true);
    try {
      const res = await authedFetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: newRole }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al actualizar el rol");

      onStatus({ type: "success", message: "Rol actualizado correctamente" });
      fetchUsers();
    } catch (error) {
      onStatus({ type: "error", message: error instanceof Error ? error.message : "Error al actualizar el rol" });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    users,
    totalItems,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    isSaving,
    userForm,
    setUserForm,
    resetForm,
    registerUser,
    changeRole,
  };
}
