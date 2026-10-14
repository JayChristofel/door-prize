"use client";

import { useEffect } from "react";

interface WinnerItem {
  id: number;
  participantId: number;
  name: string;
  round: number;
}

interface Props {
  winners: WinnerItem[] | null;
  onClose: () => void;
}

export default function WinnerCelebrationModal({ winners, onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!winners || winners.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop with blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Glow orb */}
        <div className="absolute -top-16 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Trophy icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 mb-4 animate-float-soft">
          <svg
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>

        {/* Event Header */}
        <span className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
          Selamat Kepada Pemenang! &bull; Ronde {winners[0]?.round}
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-6">
          {winners.length === 1 ? "Pemenang Terpilih" : `${winners.length} Pemenang Terpilih`}
        </h2>

        {/* Winner Cards Carousel/List */}
        <div className="w-full max-h-[50vh] overflow-y-auto space-y-3 px-1 mb-6">
          {winners.map((winner, index) => (
            <div
              key={winner.id || winner.participantId}
              className="group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 transition-all shadow-md shadow-amber-500/10"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-yellow-500/10 border border-amber-400/30 flex items-center justify-center font-bold text-amber-400 text-lg">
                  #{index + 1}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {winner.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ID Peserta: #{winner.participantId} &bull; Ronde {winner.round}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Terverifikasi
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          autoFocus
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
        >
          Lanjut ke Undian Berikutnya &rarr;
        </button>
      </div>
    </div>
  );
}
