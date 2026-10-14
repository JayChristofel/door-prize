"use client";

import { useState, useRef, useEffect } from "react";

interface Participant {
  id: number;
  name: string;
  createdAt: string;
}

interface Props {
  onAdd: (name: string) => Promise<boolean>;
  onUpload: (file: File) => Promise<{ added: number; skipped: number }>;
  onDelete: (id: number) => Promise<boolean>;
  disabled: boolean;
  visible: boolean;
  onToggle: () => void;
  count: number;
}

export default function ParticipantInput({ onAdd, onUpload, onDelete, disabled, visible, onToggle, count }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch participants when panel opens
  useEffect(() => {
    if (visible) {
      fetchParticipants();
    }
  }, [visible]);

  const fetchParticipants = async () => {
    try {
      const r = await fetch("/api/participants");
      if (r.ok) setParticipants(await r.json());
    } catch (e) { console.error(e); }
  };

  const flash = (text: string, ok: boolean) => {
    setNote({ text, ok });
    setTimeout(() => setNote(null), 3000);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || disabled || busy) return;
    setBusy(true);
    try {
      const ok = await onAdd(name.trim());
      if (ok) {
        flash("Peserta ditambahkan", true);
        setName("");
        await fetchParticipants();
      } else {
        flash("Nama sudah terdaftar", false);
      }
    } catch { flash("Gagal menambahkan", false); }
    finally { setBusy(false); }
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || disabled) return;
    try {
      const r = await onUpload(f);
      flash(r.added > 0 ? `${r.added} ditambahkan, ${r.skipped} dilewati` : "Tidak ada nama baru", r.added > 0);
      await fetchParticipants();
    } catch { flash("Gagal membaca file", false); }
    finally { if (fileRef.current) fileRef.current.value = ""; }
  };

  const deleteParticipant = async (id: number) => {
    try {
      const r = await fetch(`/api/participants?id=${id}`, { method: "DELETE" });
      if (r.ok) {
        flash("Peserta dihapus", true);
        await fetchParticipants();
      } else {
        flash("Gagal menghapus", false);
      }
    } catch { flash("Gagal menghapus", false); }
  };

  return (
    <>
      {/* Toggle button - visible when panel is hidden */}
      {!visible && (
        <button
          onClick={onToggle}
          aria-label="Buka panel peserta"
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[60]"
        >
          <div className="bg-surface border border-line border-l-0 shadow-lg rounded-r-xl flex items-center gap-2 px-3 py-5 hover:bg-cream transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold"><polyline points="15 18 9 12 15 6" /></svg>
            <span className="text-xs font-semibold text-gold">{count}</span>
          </div>
        </button>
      )}

      {/* Panel */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 w-72 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ boxShadow: visible ? "4px 0 24px rgba(0,0,0,0.08)" : "none" }}
      >
        <div className="h-full bg-surface border-r border-line flex flex-col">
          {/* Header */}
          <div className="px-5 py-5 border-b border-line/60 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium tracking-[0.2em] text-gold/70 uppercase">Panel Peserta</p>
              <p className="text-lg font-semibold text-ink mt-0.5">{count} Terdaftar</p>
            </div>
            <button onClick={onToggle} aria-label="Tutup panel" className="p-2 rounded-lg text-faint hover:text-ink hover:bg-cream transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            <form onSubmit={submit}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap..."
                disabled={disabled || busy}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-line text-sm text-ink placeholder:text-faint/60 focus:outline-none focus:border-gold/40 disabled:opacity-40 transition-all"
              />
              <button type="submit" disabled={disabled || busy || !name.trim()} className="mt-2.5 w-full py-2.5 rounded-xl bg-gold/10 border border-gold/20 text-gold-dark text-xs font-medium tracking-wider uppercase hover:bg-gold/15 disabled:opacity-20 disabled:cursor-not-allowed transition-all">
                Tambah Peserta
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-line/50" />
              <span className="text-[9px] font-medium tracking-[0.15em] text-faint/50 uppercase">atau</span>
              <div className="flex-1 h-px bg-line/50" />
            </div>

            <input ref={fileRef} type="file" accept=".txt,.csv" onChange={upload} className="hidden" id="file-upload" disabled={disabled} />
            <label htmlFor="file-upload" className={`flex items-center justify-center gap-2.5 w-full px-4 py-3 rounded-xl border border-dashed border-line text-muted hover:border-gold/40 hover:text-gold-dark cursor-pointer transition-all text-xs ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload File (.txt / .csv)
            </label>

            {/* Participant list with delete */}
            {participants.length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] font-medium tracking-[0.15em] text-faint/50 uppercase mb-2">Daftar Peserta</p>
                <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cream/50 border border-line/40 group">
                      <span className="flex-1 text-xs text-ink truncate">{p.name}</span>
                      <button
                        onClick={() => deleteParticipant(p.id)}
                        disabled={disabled}
                        aria-label={`Hapus ${p.name}`}
                        className="p-1 rounded-md text-faint hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {note && (
              <div className={`mt-3 text-[11px] px-3.5 py-2.5 rounded-xl border ${note.ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                {note.text}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
