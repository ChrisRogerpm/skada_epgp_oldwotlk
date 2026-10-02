"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { ClassIcon } from "@/components/wow/class-icon";
import { CharacterName } from "@/components/wow/character-name";
import { getClassMeta } from "@/lib/wow";
import type { EpgpSearchResult } from "../../types";

interface CharacterSearchInputProps {
  id?: string;
  value: string;
  valueClass?: string;
  results: EpgpSearchResult[];
  loading: boolean;
  onChange: (text: string) => void;
  onSelect: (result: EpgpSearchResult) => void;
  placeholder?: string;
}

/** Campo de personaje con sugerencias del roster EPGP (main o alter). */
export default function CharacterSearchInput({
  id,
  value,
  valueClass,
  results,
  loading,
  onChange,
  onSelect,
  placeholder = "Nombre del main o alter…",
}: CharacterSearchInputProps) {
  const [focused, setFocused] = useState(false);
  const open = focused && results.length > 0;
  const known = getClassMeta(valueClass);

  return (
    <Popover open={open}>
      <PopoverAnchor asChild>
        <div className="relative">
          {known ? (
            <ClassIcon
              cls={valueClass}
              size={22}
              className="absolute top-1/2 left-2 -translate-y-1/2"
            />
          ) : (
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={placeholder}
            autoComplete="off"
            className="h-10 pl-9"
          />
          {loading && (
            <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-64 p-1"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ul role="listbox" aria-label="Personajes">
          {results.map((r) => (
            <li key={`${r.main}-${r.nombre_alter}`}>
              <button
                type="button"
                role="option"
                aria-selected={r.nombre_alter === value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(r);
                  setFocused(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-accent"
              >
                <ClassIcon cls={r.clase} src={r.url_icono} size={26} />
                <span className="min-w-0 flex-1">
                  <CharacterName cls={r.clase} className="block truncate text-sm font-semibold">
                    {r.nombre_alter}
                  </CharacterName>
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.main === r.nombre_alter ? "Main" : `Alter de ${r.main}`} ·{" "}
                    {getClassMeta(r.clase)?.name ?? r.clase}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
