"use client";

import { useState } from "react";

interface Participant {
  id: number;
  name: string;
}

interface Props {
  participants: Participant[];
  isDrawing: boolean;
  drawnWinnerIds: Set<number>;
  currentHighlight: number | null;
  onStartDraw: (count: number, mode: "single" | "bulk") => void;
}

export default function NameGrid({ participants, isDrawing, drawnWinnerIds, currentHighlight, onStartDraw }: Props) {
  const [count, setCount] = useState(1);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const eligible = participants.filter((p) => !drawnWinnerIds.has(p.id));
  const canDraw = !isDrawing && eligible.length > 0 && count > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Control bar */}
      <div className="bg-surface border border-line shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 px-5 py-4 rounded-2xl">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-cream rounded-xl border border-line p-1">
          <button
            onClick={() => setMode("single")}
            disabled={isDrawing}
            className={`px-4 py-2 rounded-lg text-[11px] font-medium tracking-wider uppercase transition-all ${mode === "single" ? "bg-gold/10 text-gold-dark border border-gold/20" : "text-muted hover:text-ink border border-transparent"}`}
          >
            Satu per Satu
          </button>
          <button
            onClick={() => setMode("bulk")}
            disabled={isDrawing}
            className={`px-4 py-2 rounded-lg text-[11px] font-medium tracking-wider uppercase transition-all ${mode === "bulk" ? "bg-gold/10 text-gold-dark border border-gold/20" : "text-muted hover:text-ink border border-transparent"}`}
          >
            Sekaligus
          </button>
        </div>

        {/* Count stepper */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-faint uppercase tracking-wider">Jumlah</span>
          <div className="flex items-center gap-0.5 bg-cream rounded-xl border border-line p-0.5">
            <button onClick={() => setCount((c) => Math.max(1, c - 1))} disabled={isDrawing || count <= 1} aria-label="Kurangi" className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-line/30 transition-colors disabled:opacity-20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <div className="w-10 text-center">
              <input
                type="number"
                min={1}
                max={mode === "single" ? 1 : Math.max(1, eligible.length)}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(mode === "single" ? 1 : eligible.length, parseInt(e.target.value) || 1)))}
                disabled={isDrawing || mode === "single"}
                className="w-full bg-transparent text-center text-base font-mono font-medium text-ink focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <button onClick={() => setCount((c) => Math.min(mode === "single" ? 1 : eligible.length, c + 1))} disabled={isDrawing || count >= (mode === "single" ? 1 : eligible.length)} aria-label="Tambah" className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-ink hover:bg-line/30 transition-colors disabled:opacity-20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </div>

        {/* Draw button */}
        <button
          onClick={() => onStartDraw(mode === "single" ? 1 : count, mode)}
          disabled={!canDraw}
          className={`px-8 py-3 rounded-xl text-xs font-semibold tracking-[0.15em] uppercase transition-all ${
            canDraw
              ? "bg-gold text-white hover:bg-gold-dark shadow-md shadow-gold/20"
              : "bg-line/50 text-faint cursor-not-allowed"
          }`}
        >
          {isDrawing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Mengundi...
            </span>
          ) : "Mulai Undian"}
        </button>
      </div>

      {/* Grid */}
      {participants.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-faint/40 border border-dashed border-line/40 rounded-2xl gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </div>
          <p className="text-xs">Belum ada peserta terdaftar</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-0.5 pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
            {participants.map((p) => {
              const isWinner = drawnWinnerIds.has(p.id);
              const isHL = currentHighlight === p.id;
              const dim = isDrawing && !isHL && !isWinner;

              return (
                <div
                  key={p.id}
                  className={`relative px-3 py-2.5 rounded-xl border text-center transition-all duration-300 select-none ${
                    isWinner
                      ? "tile-winner"
                      : isHL
                      ? "tile-drawing"
                      : "border-line/60 bg-surface hover:border-line"
                  } ${dim ? "opacity-10" : ""}`}
                >
                  <span className={`text-xs font-medium ${isWinner ? "text-gold-dark" : isHL ? "text-ink" : "text-muted"}`}>
                    {p.name}
                  </span>
                  {isWinner && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
