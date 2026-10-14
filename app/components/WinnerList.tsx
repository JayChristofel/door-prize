"use client";

import { useState } from "react";
import { Winner } from "@/lib/types";

interface Props {
  winners: Winner[];
  onReset: () => Promise<void>;
  onDeleteWinner?: (id: string) => Promise<boolean>;
  disabled: boolean;
  visible: boolean;
  onToggle: () => void;
}

export default function WinnerList({
  winners,
  onReset,
  onDeleteWinner,
  disabled,
  visible,
  onToggle,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const exportCSV = () => {
    if (!winners.length) return;
    const h = ["No", "Nama Pemenang", "Ronde", "Waktu Undian"];
    const rows = winners.map((w, i) => [
      i + 1,
      w.name,
      `Ronde ${w.round}`,
      new Date(w.createdAt).toLocaleString("id-ID"),
    ]);
    const csv = [h, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pemenang-doorprize-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    if (!winners.length) return;
    const text = [
      "🏆 DAFTAR PEMENANG DOORPRIZE 🏆",
      "",
      ...winners.map((w, i) => `${i + 1}. ${w.name} (Ronde ${w.round})`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = async () => {
    if (!winners.length || disabled || isResetting) return;
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin mereset ${winners.length} data pemenang? Semua peserta akan dapat diundi kembali.`
    );
    if (!confirmed) return;

    try {
      setIsResetting(true);
      await onReset();
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteSingle = async (id: string, name: string) => {
    if (!onDeleteWinner || disabled || deletingId) return;
    const confirmed = window.confirm(
      `Batalkan pemenang "${name}"? Peserta ini akan kembali memenuhi syarat untuk diundi.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      await onDeleteWinner(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Toggle button - visible when panel is hidden */}
      {!visible && (
        <button
          onClick={onToggle}
          aria-label="Buka panel pemenang"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] cursor-pointer"
        >
          <div className="bg-surface border border-line border-r-0 shadow-lg rounded-l-2xl flex items-center gap-2.5 px-3 py-5 hover:bg-cream transition-all group">
            <span className="text-xs font-bold text-gold px-1.5 py-0.5 rounded-full bg-gold/10">
              {winners.length}
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gold group-hover:translate-x-0.5 transition-transform"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </button>
      )}

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ boxShadow: visible ? "-4px 0 30px rgba(0,0,0,0.08)" : "none" }}
      >
        <div className="h-full bg-surface border-l border-line flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-cream/30">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-gold-dark uppercase">
                Daftar Pemenang
              </p>
              <p className="text-base font-bold text-ink mt-0.5">
                {winners.length} Pemenang
              </p>
            </div>
            <button
              onClick={onToggle}
              aria-label="Tutup panel"
              className="p-2 rounded-xl text-faint hover:text-ink hover:bg-cream transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Winner list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {winners.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-faint/60 gap-3 border border-dashed border-line rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-cream flex items-center justify-center text-gold/60">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-muted">Belum ada pemenang</p>
                <p className="text-[11px] text-faint">Mulai undian untuk melihat nama pemenang di sini</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {winners.map((w, i) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-cream/60 border border-gold/15 hover:border-gold/30 transition-all group"
                  >
                    <span className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center text-[11px] font-bold text-gold-dark shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">{w.name}</p>
                      <p className="text-[10px] text-faint font-mono">
                        Ronde {w.round} &middot;{" "}
                        {new Date(w.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {onDeleteWinner && (
                      <button
                        onClick={() => handleDeleteSingle(w.id, w.name)}
                        disabled={disabled || deletingId === w.id}
                        title="Batalkan pemenang ini"
                        className="p-1.5 rounded-lg text-faint hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0 cursor-pointer"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="p-4 border-t border-line bg-cream/20 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                disabled={!winners.length || disabled}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface hover:bg-cream border border-line text-muted text-[11px] font-medium tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:text-ink cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                CSV
              </button>

              <button
                onClick={copy}
                disabled={!winners.length || disabled}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface hover:bg-cream border border-line text-muted text-[11px] font-medium tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:text-ink cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copied ? "Tersalin!" : "Salin"}
              </button>
            </div>

            {/* Reset Button with clear label and visual state */}
            <button
              onClick={handleReset}
              disabled={!winners.length || disabled || isResetting}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${
                winners.length && !disabled
                  ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer shadow-sm"
                  : "bg-line/30 text-faint border border-transparent cursor-not-allowed"
              }`}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isResetting ? "animate-spin" : ""}
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              {isResetting ? "Mereset..." : "Reset Undian"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
