"use client";

import { useState, useRef, useMemo } from "react";
import { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  onAdd: (name: string, column: string) => Promise<boolean>;
  onBatchAdd: (names: string[], column: string) => Promise<{ added: number; skipped: number }>;
  onDelete: (id: string) => Promise<boolean>;
  onDeleteAll: () => Promise<boolean>;
  disabled: boolean;
  visible: boolean;
  onToggle: () => void;
}

export default function ParticipantInput({
  participants,
  onAdd,
  onBatchAdd,
  onDelete,
  onDeleteAll,
  disabled,
  visible,
  onToggle,
}: Props) {
  const [name, setName] = useState("");
  const [column, setColumn] = useState("");
  const [newColumn, setNewColumn] = useState("");
  const [showNewColumn, setShowNewColumn] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (text: string, ok: boolean) => {
    setNote({ text, ok });
    setTimeout(() => setNote(null), 3500);
  };

  // Get unique columns from existing participants
  const existingColumns = useMemo(() => {
    const cols = new Set<string>();
    participants.forEach((p) => {
      if (p.column) cols.add(p.column);
    });
    return Array.from(cols).sort();
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    if (!search.trim()) return participants;
    const q = search.toLowerCase();
    return participants.filter((p) => p.name.toLowerCase().includes(q));
  }, [participants, search]);

  const selectedColumnValue = showNewColumn ? newColumn.trim() : column;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || disabled || busy) return;

    setBusy(true);
    try {
      const ok = await onAdd(trimmed, selectedColumnValue);
      if (ok) {
        flash(`"${trimmed}" berhasil ditambahkan`, true);
        setName("");
        setNewColumn("");
        setShowNewColumn(false);
      } else {
        flash("Nama sudah terdaftar dalam sistem", false);
      }
    } catch {
      flash("Gagal menambahkan peserta", false);
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || disabled || busy) return;

    setBusy(true);
    try {
      const text = await file.text();
      const rawLines = text
        .split(/[\r\n]+/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Parse format: "Nama" or "Nama | Kolom" or "Nama, Kolom"
      const parsed = rawLines.map((line) => {
        // Try pipe separator first
        if (line.includes("|")) {
          const [name, col] = line.split("|").map((s) => s.trim());
          return { name, column: col || "" };
        }
        // Try comma separator (but not if it looks like "1,Name")
        if (line.includes(",") && !/^\d+,/.test(line)) {
          const [name, col] = line.split(",").map((s) => s.trim());
          return { name, column: col || "" };
        }
        return { name: line, column: "" };
      }).filter((p) => p.name.length > 0);

      const names = parsed.map((p) => p.name);
      if (names.length === 0) {
        flash("File tidak berisi nama yang valid", false);
        return;
      }

      const res = await onBatchAdd(names, selectedColumnValue);
      flash(
        res.added > 0
          ? `${res.added} peserta ditambahkan (${res.skipped} terduplikasi/dilewati)`
          : "Semua nama sudah terdaftar sebelumnya",
        res.added > 0
      );
    } catch (err) {
      console.error(err);
      flash("Gagal membaca atau memproses file", false);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: string, pName: string) => {
    if (disabled || busy || deletingId) return;
    const confirmed = window.confirm(`Hapus peserta "${pName}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(id);
      const ok = await onDelete(id);
      if (ok) {
        flash(`Peserta "${pName}" dihapus`, true);
      } else {
        flash("Gagal menghapus peserta", false);
      }
    } catch {
      flash("Terjadi kesalahan saat menghapus", false);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!participants.length || disabled || busy) return;
    const confirmed = window.confirm(
      `PERINGATAN: Hapus SEMUA ${participants.length} peserta dan riwayat undian? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      const ok = await onDeleteAll();
      if (ok) {
        flash("Semua peserta berhasil dihapus", true);
      } else {
        flash("Gagal menghapus seluruh peserta", false);
      }
    } catch {
      flash("Terjadi kesalahan", false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Toggle button - visible when panel is hidden */}
      {!visible && (
        <button
          onClick={onToggle}
          aria-label="Buka panel peserta"
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[60] cursor-pointer"
        >
          <div className="bg-surface border border-line border-l-0 shadow-lg rounded-r-2xl flex items-center gap-2.5 px-3 py-5 hover:bg-cream transition-all group">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gold group-hover:-translate-x-0.5 transition-transform"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-xs font-bold text-gold px-1.5 py-0.5 rounded-full bg-gold/10">
              {participants.length}
            </span>
          </div>
        </button>
      )}

      {/* Drawer Panel */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ boxShadow: visible ? "4px 0 30px rgba(0,0,0,0.08)" : "none" }}
      >
        <div className="h-full bg-surface border-r border-line flex flex-col shadow-2xl">
          {/* Header */}
          <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-cream/30">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-gold-dark uppercase">
                Panel Peserta
              </p>
              <p className="text-base font-bold text-ink mt-0.5">
                {participants.length} Terdaftar
              </p>
            </div>
            <button
              onClick={onToggle}
              aria-label="Tutup panel"
              className="p-2 rounded-xl text-faint hover:text-ink hover:bg-cream transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-4 border-b border-line/60 bg-cream/10 space-y-3">
            <form onSubmit={submit}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama peserta baru..."
                disabled={disabled || busy}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-line text-xs text-ink placeholder:text-faint/60 focus:outline-none focus:border-gold/60 disabled:opacity-50 transition-all shadow-sm"
              />

              {/* Column input */}
              <div className="flex gap-2 mt-2">
                {!showNewColumn ? (
                  <>
                    <select
                      value={column}
                      onChange={(e) => setColumn(e.target.value)}
                      disabled={disabled || busy}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-surface border border-line text-xs text-ink focus:outline-none focus:border-gold/60 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                    >
                      <option value="">-- Pilih Kolom --</option>
                      {existingColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewColumn(true)}
                      disabled={disabled || busy}
                      className="px-3 py-2.5 rounded-xl border border-dashed border-line text-faint hover:border-gold/50 hover:text-gold-dark text-xs transition-all cursor-pointer"
                      title="Buat kolom baru"
                    >
                      + Baru
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={newColumn}
                      onChange={(e) => setNewColumn(e.target.value)}
                      placeholder="Nama kolom baru..."
                      disabled={disabled || busy}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-surface border border-line text-xs text-ink placeholder:text-faint/60 focus:outline-none focus:border-gold/60 disabled:opacity-50 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => { setShowNewColumn(false); setNewColumn(""); }}
                      className="px-3 py-2.5 rounded-xl border border-line text-faint hover:text-ink text-xs transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={disabled || busy || !name.trim()}
                className="mt-2 w-full py-2.5 rounded-xl bg-gold text-white text-xs font-semibold hover:bg-gold-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              >
                {busy ? "Menambah..." : "Tambah Peserta"}
              </button>
            </form>

            <div className="flex items-center gap-2 text-faint/60">
              <div className="flex-1 h-px bg-line" />
              <span className="text-[9px] uppercase tracking-wider">atau impor</span>
              <div className="flex-1 h-px bg-line" />
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".txt,.csv"
              onChange={handleUpload}
              className="hidden"
              id="file-upload"
              disabled={disabled || busy}
            />
            <label
              htmlFor="file-upload"
              className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-gold/30 bg-gold/5 text-gold-dark hover:bg-gold/10 hover:border-gold/60 transition-all text-xs font-medium cursor-pointer ${
                disabled || busy ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload TXT / CSV Peserta
            </label>

            {selectedColumnValue && (
              <p className="text-[10px] text-faint text-center">
                Akan ditambahkan ke kolom: <span className="font-semibold text-gold-dark">{selectedColumnValue}</span>
              </p>
            )}

            {note && (
              <div
                className={`text-[11px] px-3 py-2 rounded-xl border animate-reveal ${
                  note.ok
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {note.text}
              </div>
            )}
          </div>

          {/* Search bar inside list */}
          {participants.length > 5 && (
            <div className="px-4 pt-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari peserta..."
                className="w-full px-3 py-1.5 rounded-lg bg-cream/70 border border-line text-xs text-ink placeholder:text-faint/60 focus:outline-none focus:border-gold/50"
              />
            </div>
          )}

          {/* Participant list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {filteredParticipants.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-faint text-xs text-center border border-dashed border-line/50 rounded-xl p-4">
                {search ? "Tidak ada peserta yang cocok" : "Belum ada peserta"}
              </div>
            ) : (
              filteredParticipants.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-cream/40 border border-line/60 hover:border-gold/30 hover:bg-cream transition-all group"
                >
                  <span className="text-[10px] font-mono text-faint w-5">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-ink truncate block">{p.name}</span>
                    {p.column && (
                      <span className="text-[9px] text-gold-dark/70">{p.column}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={disabled || deletingId === p.id}
                    title={`Hapus ${p.name}`}
                    className="p-1 rounded-lg text-faint hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0 cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bottom actions: Delete All */}
          {participants.length > 0 && (
            <div className="p-4 border-t border-line bg-cream/20">
              <button
                onClick={handleDeleteAll}
                disabled={disabled || busy}
                className="w-full py-2 px-3 rounded-xl border border-line text-faint hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-[11px] font-medium tracking-wider uppercase transition-all disabled:opacity-20 cursor-pointer"
              >
                Hapus Semua Peserta
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
