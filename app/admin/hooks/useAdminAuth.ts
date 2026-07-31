"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/infrastructure/config/supabase";
import type { User, Session } from "@supabase/supabase-js";

async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) return false;
    return data.role === "admin";
  } catch (err) {
    console.error("Excepción al verificar rol:", err);
    return false;
  }
}

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const checkAuth = async (session: Session | null) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        const isUserAdmin = await checkAdminRole(currentUser.id);
        if (isUserAdmin) {
          setUser(currentUser);
          setIsAdmin(true);
        } else {
          await supabase.auth.signOut();
          setUser(null);
          setIsAdmin(false);
          setLoginError("Acceso denegado. No tienes permisos de administrador.");
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setAuthLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAuth(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuth(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        const isUserAdmin = await checkAdminRole(data.user.id);
        if (!isUserAdmin) {
          await supabase.auth.signOut();
          throw new Error("Acceso denegado. Se requiere rol de administrador.");
        }
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Error al intentar iniciar sesión.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    user,
    isAdmin,
    authLoading,
    email,
    setEmail,
    password,
    setPassword,
    loginError,
    isLoggingIn,
    handleLogin,
    handleLogout,
  };
}
