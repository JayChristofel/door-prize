"use client";

import { useState } from "react";

interface Winner {
  id: number;
  name: string;
  round: number;
  createdAt: string;
}

interface Props {
  winners: Winner[];
  onReset: () => Promise<void>;
  disabled: boolean;
  visible: boolean;
  onToggle: () => void;
}

export default function WinnerList({ winners, onReset, disabled, visible, onToggle }: Props) {
  const [copied, setCopied] = useState(false);

  const exportCSV = () => {
    const h = ["No", "Nama", "Ronde", "Waktu"];
    const rows = winners.map((w, i) => [i + 1, w.name, w.round, new Date(w.createdAt).toLocaleString("id-ID")]);
    const csv = [h, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hasil-undian-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    const text = winners.map((w, i) => `${i + 1}. ${w.name} (Ronde ${w.round})`).join("\n");
    try { await navigator.clipboard.writeText(text); } catch {
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

  const reset = async () => {
    if (confirm("Hapus semua data pemenang?")) await onReset();
  };

  return (
    <>
      {/* Toggle button - visible when panel is hidden */}
      {!visible && (
        <button
          onClick={onToggle}
          aria-label="Buka panel pemenang"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[60]"
        >
          <div className="bg-surface border border-line border-r-0 shadow-lg rounded-l-xl flex items-center gap-2 px-3 py-5 hover:bg-cream transition-colors">
            <span className="text-xs font-semibold text-gold">{winners.length}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </button>
      )}

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-50 w-72 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ boxShadow: visible ? "-4px 0 24px rgba(0,0,0,0.08)" : "none" }}
      >
        <div className="h-full bg-surface border-l border-line flex flex-col">
          {/* Header */}
          <div className="px-5 py-5 border-b border-line/60 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium tracking-[0.2em] text-gold/70 uppercase">Daftar Pemenang</p>
              <p className="text-lg font-semibold text-ink mt-0.5">{winners.length} Pemenang</p>
            </div>
            <button onClick={onToggle} aria-label="Tutup panel" className="p-2 rounded-lg text-faint hover:text-ink hover:bg-cream transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Winner list */}
          <div className="flex-1 overflow-y-auto p-5">
            {winners.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-faint/30 gap-3 border border-dashed border-line/30 rounded-xl">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                <p className="text-[11px]">Belum ada pemenang</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {winners.map((w, i) => (
                  <div key={w.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cream/50 border border-line/40 animate-winner-reveal" style={{ animationDelay: `${i * 50}ms` }}>
                    <span className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center text-[10px] font-semibold text-gold-dark shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{w.name}</p>
                      <p className="text-[10px] text-faint font-mono">Ronde {w.round} &middot; {new Date(w.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 pt-3 border-t border-line/40 flex gap-2">
            <button onClick={exportCSV} disabled={!winners.length || disabled} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-cream hover:bg-line/30 border border-line text-muted text-[11px] font-medium tracking-wider uppercase transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:text-ink">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
            <button onClick={copy} disabled={!winners.length || disabled} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-cream hover:bg-line/30 border border-line text-muted text-[11px] font-medium tracking-wider uppercase transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:text-ink">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              {copied ? "Tersalin" : "Salin"}
            </button>
            <button onClick={reset} disabled={!winners.length || disabled} aria-label="Reset" className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-400/60 text-[11px] font-medium transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:text-red-600">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
