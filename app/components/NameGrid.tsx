"use client";

import { useState, useMemo } from "react";
import { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  isDrawing: boolean;
  drawnWinnerIds: Set<string>;
  currentHighlight: string | null;
  onStartDraw: (count: number, mode: "single" | "bulk") => void;
}

export default function NameGrid({
  participants,
  isDrawing,
  drawnWinnerIds,
  currentHighlight,
  onStartDraw,
}: Props) {
  const [count, setCount] = useState(1);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [selectedColumn, setSelectedColumn] = useState<string>("all");

  // Get unique columns
  const columns = useMemo(() => {
    const cols = new Set<string>();
    participants.forEach((p) => {
      if (p.column) cols.add(p.column);
    });
    return Array.from(cols).sort();
  }, [participants]);

  // Filter by selected column
  const filteredParticipants = useMemo(() => {
    if (selectedColumn === "all") return participants;
    return participants.filter((p) => p.column === selectedColumn);
  }, [participants, selectedColumn]);

  const eligible = filteredParticipants.filter((p) => !drawnWinnerIds.has(p.id));
  const maxPossible = Math.max(1, eligible.length);
  const canDraw = !isDrawing && eligible.length > 0 && count > 0;

  const handleModeChange = (newMode: "single" | "bulk") => {
    setMode(newMode);
    if (newMode === "single") {
      setCount(1);
    } else {
      setCount((prev) => Math.min(Math.max(2, prev), maxPossible));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Control bar */}
      <div className="bg-surface border border-line shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-4 px-5 py-4 rounded-2xl">
        {/* Mode toggle + Column filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-cream rounded-xl border border-line p-1">
            <button
              onClick={() => handleModeChange("single")}
              disabled={isDrawing}
              className={`px-4 py-2 rounded-lg text-[11px] font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                mode === "single"
                  ? "bg-gold/15 text-gold-dark border border-gold/30 shadow-xs"
                  : "text-muted hover:text-ink border border-transparent"
              }`}
            >
              Satu per Satu
            </button>
            <button
              onClick={() => handleModeChange("bulk")}
              disabled={isDrawing}
              className={`px-4 py-2 rounded-lg text-[11px] font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                mode === "bulk"
                  ? "bg-gold/15 text-gold-dark border border-gold/30 shadow-xs"
                  : "text-muted hover:text-ink border border-transparent"
              }`}
            >
              Sekaligus
            </button>
          </div>

          {/* Column filter dropdown */}
          {columns.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-faint uppercase tracking-wider font-semibold">Kolom</span>
              <select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
                disabled={isDrawing}
                className="px-3 py-2 rounded-lg bg-cream border border-line text-xs font-medium text-ink focus:outline-none focus:border-gold/50 disabled:opacity-50 cursor-pointer"
              >
                <option value="all">Semua Kolom</option>
                {columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Count stepper & Stats */}
        <div className="flex items-center justify-between lg:justify-end gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono tracking-wider text-faint">
              Sisa {eligible.length} dari {filteredParticipants.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-faint uppercase tracking-wider font-semibold">
              Jumlah
            </span>
            <div className="flex items-center gap-0.5 bg-cream rounded-xl border border-line p-0.5 shadow-inner">
              <button
                onClick={() => setCount((c) => Math.max(1, c - 1))}
                disabled={isDrawing || count <= 1 || mode === "single"}
                aria-label="Kurangi jumlah undian"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-line/40 transition-colors disabled:opacity-20 cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              <div className="w-12 text-center">
                <input
                  type="number"
                  min={1}
                  max={mode === "single" ? 1 : maxPossible}
                  value={mode === "single" ? 1 : count}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setCount(Math.max(1, Math.min(maxPossible, val)));
                  }}
                  disabled={isDrawing || mode === "single"}
                  className="w-full bg-transparent text-center text-sm font-mono font-bold text-ink focus:outline-none disabled:opacity-60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <button
                onClick={() => setCount((c) => Math.min(maxPossible, c + 1))}
                disabled={isDrawing || count >= maxPossible || mode === "single"}
                aria-label="Tambah jumlah undian"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-line/40 transition-colors disabled:opacity-20 cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Draw button */}
          <button
            onClick={() => onStartDraw(mode === "single" ? 1 : Math.min(count, eligible.length), mode)}
            disabled={!canDraw}
            className={`px-7 py-3 rounded-xl text-xs font-bold tracking-[0.15em] uppercase transition-all cursor-pointer flex items-center gap-2 ${
              canDraw
                ? "bg-gradient-to-r from-gold to-gold-dark text-white hover:brightness-105 shadow-md shadow-gold/25 active:scale-95"
                : "bg-line/60 text-faint cursor-not-allowed border border-line"
            }`}
          >
            {isDrawing ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span>Mengundi...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Mulai Undian</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredParticipants.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-faint/60 border border-dashed border-line rounded-2xl gap-4 p-8">
          <div className="w-16 h-16 rounded-2xl bg-cream flex items-center justify-center text-gold/60 border border-line">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink">Belum Ada Peserta Terdaftar</p>
            <p className="text-xs text-muted mt-1">Buka panel kiri untuk menambah atau mengunggah daftar nama peserta</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filteredParticipants.map((p) => {
              const isWinner = drawnWinnerIds.has(p.id);
              const isHL = currentHighlight === p.id;
              const dim = isDrawing && !isHL && !isWinner;

              return (
                <div
                  key={p.id}
                  className={`relative px-3.5 py-3 rounded-xl border text-center transition-all duration-200 select-none ${
                    isWinner
                      ? "tile-winner"
                      : isHL
                      ? "tile-drawing scale-105 z-10 shadow-lg shadow-gold/20"
                      : "border-line/70 bg-surface hover:border-gold/30 hover:shadow-xs"
                  } ${dim ? "opacity-20 scale-95" : ""}`}
                >
                  <span
                    className={`text-xs font-semibold block truncate ${
                      isWinner
                        ? "text-gold-dark font-bold"
                        : isHL
                        ? "text-ink font-bold scale-105"
                        : "text-muted"
                    }`}
                  >
                    {p.name}
                  </span>
                  {p.column && (
                    <span className="block text-[9px] text-gold-dark/70 mt-0.5 truncate">Kolom: {p.column}</span>
                  )}

                  {isWinner && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold text-white flex items-center justify-center shadow-xs">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
