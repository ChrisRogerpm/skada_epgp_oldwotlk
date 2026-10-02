"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "my_character";
const EVENT = "my-character-change";

function read() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Personaje fijado por el usuario ("Mi personaje"), compartido entre páginas. */
export function useMyCharacter() {
  const myCharacter = useSyncExternalStore(subscribe, read, () => "");

  const setMyCharacter = useCallback((name: string) => {
    try {
      if (name) localStorage.setItem(KEY, name);
      else localStorage.removeItem(KEY);
    } catch {
      // almacenamiento bloqueado: el fijado solo dura esta sesión de pestaña
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const toggleMyCharacter = useCallback(
    (name: string) => setMyCharacter(read() === name ? "" : name),
    [setMyCharacter],
  );

  return { myCharacter, setMyCharacter, toggleMyCharacter };
}
