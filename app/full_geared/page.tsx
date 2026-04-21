"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Trophy,
  CheckCircle2,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";
import clsx from "clsx";
import Image from "next/image";

const CLASS_COLORS: Record<string, string> = {
  DEATHKNIGHT: "#C41F3B",
  DRUID: "#FF7D0A",
  HUNTER: "#ABD473",
  MAGE: "#69CCF0",
  PALADIN: "#F58CBA",
  PRIEST: "#FFFFFF",
  ROGUE: "#FFF569",
  SHAMAN: "#0070DE",
  WARLOCK: "#9482C9",
  WARRIOR: "#C79C6E",
};

const RAID_ICONS = {
  ICC: "https://wow.zamimg.com/images/wow/icons/large/achievement_boss_lichking.jpg",
  RS: "https://wotlk.ultimowow.com/static/images/wow/icons/large/spell_shadow_twilight.jpg",
};

const CLASS_ICONS: Record<string, string> = {
  DEATHKNIGHT:
    "https://wow.zamimg.com/images/wow/icons/large/spell_deathknight_classicon.jpg",
  DRUID: "https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg",
  HUNTER: "https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg",
  MAGE: "https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg",
  PALADIN:
    "https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg",
  PRIEST: "https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg",
  ROGUE: "https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg",
  SHAMAN: "https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg",
  WARLOCK:
    "https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg",
  WARRIOR:
    "https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg",
};

export default function FullGearedPage() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<"cards" | "skada">("cards");
  const limit = 12;

  useEffect(() => {
    fetchCharacters();
  }, [currentPage, searchTerm]);

  const fetchCharacters = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/full-geared?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`,
      );
      const result = await res.json();
      setCharacters(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotalItems(result.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchCharacters();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-12 lg:p-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-12 md:space-y-16 relative z-10">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-purple-500/20 blur-2xl group-hover:bg-purple-500/40 transition-all duration-1000" />
            <div className="relative p-5 bg-slate-900/80 rounded-3xl border border-white/10 mb-2 shadow-2xl">
              <Trophy
                className="text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.5)]"
                size={40}
              />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
              Salón de la{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400">
                Fama
              </span>
            </h1>
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[8px] md:text-xs">
              Mitos de Old Legends • ICC & RS Heroic
            </p>
          </div>
          <div className="flex justify-center gap-4 pt-2">
            <span className="px-6 py-2 bg-slate-900/60 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border border-white/5 shadow-2xl backdrop-blur-xl">
              Total Honorables:{" "}
              <span className="text-white ml-2">{totalItems}</span>
            </span>
          </div>
        </div>

        {/* Filters and Toggle */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="relative w-full max-w-xl group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative">
              <Search
                className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-purple-400 transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar por nombre, main o clase..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/40 border border-white/5 rounded-[2rem] py-5 pl-16 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-slate-900/80 transition-all text-white placeholder:text-slate-700 backdrop-blur-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 p-1.5 bg-slate-900/60 border border-white/5 rounded-[1.5rem] backdrop-blur-xl">
            <button
              onClick={() => setViewMode("cards")}
              className={clsx(
                "p-3 rounded-xl transition-all duration-300",
                viewMode === "cards"
                  ? "bg-purple-500/20 text-purple-400 shadow-inner"
                  : "text-slate-600 hover:text-slate-400",
              )}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode("skada")}
              className={clsx(
                "p-3 rounded-xl transition-all duration-300",
                viewMode === "skada"
                  ? "bg-purple-500/20 text-purple-400 shadow-inner"
                  : "text-slate-600 hover:text-slate-400",
              )}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin shadow-[0_0_20px_rgba(168,85,247,0.2)]" />
              <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-500 w-10 h-10 opacity-50" />
            </div>
            <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">
              Sincronizando Archivos Históricos...
            </p>
          </div>
        ) : (
          <>
            {viewMode === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {characters.map((char) => {
                  const classColor =
                    CLASS_COLORS[char.class.toUpperCase()] || "#94a3b8";
                  return (
                    <div key={char.id} className="group relative">
                      {/* Glow Effect */}
                      <div
                        className="absolute inset-0 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                        style={{ backgroundColor: classColor }}
                      />

                      <div className="relative bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6 md:p-8 hover:border-white/20 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 backdrop-blur-xl flex flex-col h-full shadow-2xl">
                        {/* Class Background Text */}
                        <div
                          className="absolute top-4 right-6 text-[10px] font-black uppercase tracking-widest opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
                          style={{ color: classColor }}
                        >
                          {char.class}
                        </div>

                        <div className="flex-1 space-y-6 md:space-y-8">
                          <div className="flex items-center gap-4 md:gap-5">
                            <div className="relative shrink-0">
                              <div
                                className="absolute inset-0 rounded-2xl blur-lg opacity-40"
                                style={{ backgroundColor: classColor }}
                              />
                              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-800 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative z-10 group-hover:border-white/30 transition-colors">
                                {CLASS_ICONS[char.class.toUpperCase()] ? (
                                  <Image
                                    src={CLASS_ICONS[char.class.toUpperCase()]}
                                    alt={char.class}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-2xl font-black text-white">
                                    {char.name[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase leading-none mb-1.5 truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all">
                                {char.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full animate-pulse"
                                  style={{ backgroundColor: classColor }}
                                />
                                <p
                                  className="text-[10px] font-black uppercase tracking-widest"
                                  style={{ color: classColor }}
                                >
                                  {char.class}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-end justify-between">
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                                  Main Legendario
                                </p>
                                <p className="text-sm font-bold text-slate-400">
                                  {char.main}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="inline-block px-4 py-2 bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 rounded-2xl shadow-xl">
                                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">
                                    Gear Score
                                  </p>
                                  <p className="text-xl font-black text-emerald-400 tracking-tighter leading-none italic">
                                    {char.gs}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            {char.icc === 1 ? (
                              <div className="flex flex-col items-center justify-center py-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl group-hover:bg-purple-500/20 transition-all shadow-inner relative overflow-hidden group/raid">
                                <Image
                                  src={RAID_ICONS.ICC}
                                  alt="ICC"
                                  width={32}
                                  height={32}
                                  className="w-6 h-6 md:w-8 md:h-8 rounded-lg mb-1 shadow-lg border border-purple-500/30"
                                />
                                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest relative z-10">
                                  Full ICC
                                </span>
                                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover/raid:opacity-100 transition-opacity" />
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-3 bg-slate-950/40 border border-white/5 rounded-2xl opacity-30 grayscale">
                                <Shield
                                  className="text-slate-600 mb-1"
                                  size={16}
                                />
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                  ICC Pending
                                </span>
                              </div>
                            )}
                            {char.rs === 1 ? (
                              <div className="flex flex-col items-center justify-center py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl group-hover:bg-blue-500/20 transition-all shadow-inner relative overflow-hidden group/raid">
                                <Image
                                  src={RAID_ICONS.RS}
                                  alt="RS"
                                  width={32}
                                  height={32}
                                  className="w-6 h-6 md:w-8 md:h-8 rounded-lg mb-1 shadow-lg border border-blue-500/30"
                                />
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest relative z-10">
                                  Full RS
                                </span>
                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/raid:opacity-100 transition-opacity" />
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-3 bg-slate-950/40 border border-white/5 rounded-2xl opacity-30 grayscale">
                                <Shield
                                  className="text-slate-600 mb-1"
                                  size={16}
                                />
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                  RS Pending
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* SKADA LIST VIEW */
              <div className="max-w-4xl mx-auto space-y-2 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-slate-900/80 rounded-2xl border border-white/10 mb-6 backdrop-blur-xl shadow-2xl">
                  <div className="flex gap-4 md:gap-12">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Personaje
                    </p>
                    <p className="hidden sm:block text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Main
                    </p>
                  </div>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Méritos & GS
                  </p>
                </div>

                {characters.map((char, idx) => {
                  const classColor =
                    CLASS_COLORS[char.class.toUpperCase()] || "#94a3b8";
                  // Calculate bar width based on GS (max 7000)
                  const barWidth = Math.min(100, (char.gs / 7000) * 100);

                  return (
                    <div
                      key={char.id}
                      className="group relative h-14 bg-slate-900/30 rounded-xl overflow-hidden border border-white/[0.03] hover:border-white/10 transition-all"
                    >
                      {/* Skada Bar */}
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out opacity-20 group-hover:opacity-30"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: classColor,
                          boxShadow: `inset -10px 0 20px rgba(0,0,0,0.2)`,
                        }}
                      />

                      <div className="relative h-full flex items-center justify-between px-3 md:px-4 z-10">
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                          <span className="hidden xs:block text-[10px] font-mono text-slate-600 w-4">
                            {(currentPage - 1) * limit + idx + 1}
                          </span>
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                            {CLASS_ICONS[char.class.toUpperCase()] ? (
                              <Image
                                src={CLASS_ICONS[char.class.toUpperCase()]}
                                alt={char.class}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-black text-white">
                                {char.name[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 truncate">
                            <h4
                              className="text-xs md:text-sm font-black text-white uppercase tracking-tight truncate"
                              style={{ color: classColor }}
                            >
                              {char.name}
                            </h4>
                            <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase truncate">
                              {char.main}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 md:gap-6 shrink-0">
                          <div className="flex gap-1.5 md:gap-2">
                            {char.icc === 1 && (
                              <div
                                className="w-6 h-6 md:w-7 md:h-7 rounded-md overflow-hidden border border-purple-500/30 shadow-lg"
                                title="Full ICC"
                              >
                                <Image
                                  src={RAID_ICONS.ICC}
                                  alt="ICC"
                                  width={28}
                                  height={28}
                                />
                              </div>
                            )}
                            {char.rs === 1 && (
                              <div
                                className="w-6 h-6 md:w-7 md:h-7 rounded-md overflow-hidden border border-blue-500/30 shadow-lg"
                                title="Full RS"
                              >
                                <Image
                                  src={RAID_ICONS.RS}
                                  alt="RS"
                                  width={28}
                                  height={28}
                                />
                              </div>
                            )}
                          </div>
                          <div className="text-right min-w-[50px] md:min-w-[60px]">
                            <span className="text-base md:text-lg font-black text-emerald-400 tracking-tighter italic drop-shadow-md">
                              {char.gs}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {characters.length === 0 && (
              <div className="col-span-full py-40 text-center bg-slate-900/10 border border-dashed border-white/5 rounded-[4rem] backdrop-blur-sm">
                <div className="w-24 h-24 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-2xl">
                  <Shield className="text-slate-800" size={48} />
                </div>
                <h3 className="text-white font-black uppercase tracking-tight text-2xl">
                  Sin rastro en los archivos
                </h3>
                <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px] mt-4 max-w-xs mx-auto leading-relaxed">
                  Ningún guerrero cumple con los criterios de búsqueda actuales.
                  Intenta otro nombre.
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 md:gap-8 pt-12 md:pt-20">
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === 1}
                  className="group flex items-center gap-2 md:gap-3 px-4 md:px-6 py-4 bg-slate-900/60 border border-white/5 rounded-[1.5rem] text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-10 disabled:cursor-not-allowed transition-all shadow-2xl"
                >
                  <ChevronLeft
                    className="group-hover:-translate-x-1 transition-transform"
                    size={20}
                  />
                  <span className="hidden xs:inline text-[10px] font-black uppercase tracking-widest">
                    Anterior
                  </span>
                </button>

                <div className="flex items-center gap-2 md:gap-4">
                  <span className="px-4 md:px-6 py-4 bg-purple-500/10 border border-purple-500/20 rounded-[1.5rem] text-xs md:text-sm font-black text-white min-w-[3rem] md:min-w-[4rem] text-center shadow-2xl shadow-purple-900/20 relative">
                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-purple-500 rounded-full blur-lg opacity-50" />
                    {currentPage}
                  </span>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                    de {totalPages}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={currentPage === totalPages}
                  className="group flex items-center gap-2 md:gap-3 px-4 md:px-6 py-4 bg-slate-900/60 border border-white/5 rounded-[1.5rem] text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-10 disabled:cursor-not-allowed transition-all shadow-2xl"
                >
                  <span className="hidden xs:inline text-[10px] font-black uppercase tracking-widest">
                    Siguiente
                  </span>
                  <ChevronRight
                    className="group-hover:translate-x-1 transition-transform"
                    size={20}
                  />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
