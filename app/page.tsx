"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ParticipantInput from "./components/ParticipantInput";
import NameGrid from "./components/NameGrid";
import WinnerList from "./components/WinnerList";

interface Participant {
  id: number;
  name: string;
  createdAt: string;
}

interface Winner {
  id: number;
  participantId: number;
  name: string;
  round: number;
  createdAt: string;
}

const CONFETTI_COLORS = ["#C9A84C", "#E8D48B", "#F5F0E8", "#FFD700", "#D4AF37", "#B8860B"];

function ConfettiPiece({ side, delay, color }: { side: "left" | "right"; delay: number; color: string }) {
  const style = {
    backgroundColor: color,
    animationDelay: `${delay}ms`,
    width: `${6 + Math.random() * 8}px`,
    height: `${4 + Math.random() * 6}px`,
  };

  return (
    <div
      className={`absolute top-0 ${side === "left" ? "confetti-left" : "confetti-right"}`}
      style={style}
    />
  );
}

function WinnerModal({ winners, round, onClose }: { winners: Winner[]; round: number; onClose: () => void }) {
  const leftConfetti = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  }));

  const rightConfetti = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />

      {/* Confetti left */}
      <div className="absolute left-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none">
        {leftConfetti.map((c) => (
          <ConfettiPiece key={`l-${c.id}`} side="left" delay={c.delay} color={c.color} />
        ))}
      </div>

      {/* Confetti right */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none">
        {rightConfetti.map((c) => (
          <ConfettiPiece key={`r-${c.id}`} side="right" delay={c.delay} color={c.color} />
        ))}
      </div>

      {/* Modal */}
      <div className="relative animate-modal-pop bg-surface border border-gold/20 shadow-2xl shadow-gold/10 rounded-3xl px-10 py-12 max-w-md w-full mx-4 text-center">
        {/* Gold top accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-gold to-transparent rounded-b-full" />

        <p className="text-[10px] font-medium tracking-[0.3em] text-gold/60 uppercase mb-2">Ronde {round}</p>
        <h2 className="text-lg font-semibold text-ink mb-6">Selamat kepada</h2>

        <div className="space-y-3">
          {winners.map((w, i) => (
            <div key={w.id} className="animate-winner-name" style={{ animationDelay: `${300 + i * 150}ms` }}>
              <p className="text-2xl font-bold text-gold-dark">{w.name}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-8 px-8 py-2.5 rounded-xl bg-gold/10 border border-gold/20 text-gold-dark text-xs font-medium tracking-wider uppercase hover:bg-gold/15 transition-all"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [wonIds, setWonIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [modalWinners, setModalWinners] = useState<{ winners: Winner[]; round: number } | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [pr, wr] = await Promise.all([fetch("/api/participants"), fetch("/api/winners")]);
      if (pr.ok) setParticipants(await pr.json());
      if (wr.ok) {
        const wd = await wr.json();
        setWinners(wd);
        setWonIds(new Set(wd.map((w: Winner) => w.participantId)));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addParticipant = async (name: string): Promise<boolean> => {
    try {
      const r = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (r.ok) {
        const data = await r.json();
        setParticipants((p) => [...p, data]);
        return true;
      }
      return false;
    } catch { return false; }
  };

  const deleteParticipant = async (id: number): Promise<boolean> => {
    try {
      const r = await fetch(`/api/participants?id=${id}`, { method: "DELETE" });
      if (r.ok) {
        setParticipants((prev) => prev.filter((p) => p.id !== id));
        return true;
      }
      return false;
    } catch { return false; }
  };

  const uploadFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let added = 0, skipped = 0;
    for (const line of lines) {
      if (participants.some((p) => p.name.toLowerCase() === line.toLowerCase())) { skipped++; continue; }
      try {
        const r = await fetch("/api/participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: line }),
        });
        if (r.ok) {
          const data = await r.json();
          setParticipants((p) => [...p, data]);
          added++;
        }
        else skipped++;
      } catch { skipped++; }
    }
    return { added, skipped };
  };

  const startDraw = useCallback(async (count: number, mode: "single" | "bulk") => {
    const pool = participants.filter((p) => !wonIds.has(p.id));
    if (pool.length === 0 || isDrawing) return;

    setIsDrawing(true);
    const round = winners.length > 0 ? Math.max(...winners.map((w) => w.round)) + 1 : 1;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked = mode === "single" ? shuffled.slice(0, 1) : shuffled.slice(0, count);

    const total = 3000 + picked.length * 500;
    const slowAt = total * 0.6;
    let elapsed = 0;

    const tick = () => {
      const rnd = pool[Math.floor(Math.random() * pool.length)];
      setHighlight(rnd.id);
      elapsed += 50;

      if (elapsed < slowAt) {
        timer.current = setTimeout(tick, 50);
      } else if (elapsed < total) {
        const prog = (elapsed - slowAt) / (total - slowAt);
        timer.current = setTimeout(tick, 50 + prog * 200);
      } else {
        setHighlight(null);
        (async () => {
          const nw: Winner[] = [];
          for (const w of picked) {
            try {
              const r = await fetch("/api/winners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ participantId: w.id, name: w.name, round }),
              });
              if (r.ok) nw.push(await r.json());
            } catch (e) { console.error(e); }
          }
          // Update state AFTER all winners are saved
          setWinners((prev) => [...prev, ...nw]);
          setWonIds((prev) => {
            const n = new Set(prev);
            picked.forEach((w) => n.add(w.id));
            return n;
          });
          setIsDrawing(false);
          // Show modal with the newly saved winners
          if (nw.length > 0) {
            setModalWinners({ winners: nw, round });
          }
        })();
      }
    };
    tick();
  }, [participants, wonIds, isDrawing, winners]);

  const reset = async () => {
    try {
      const r = await fetch("/api/winners", { method: "DELETE" });
      if (r.ok) {
        setWinners([]);
        setWonIds(new Set());
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-cream">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
          <span className="text-xs text-muted">Memuat data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-cream overflow-hidden">
      <div className="h-full max-w-7xl mx-auto flex flex-col p-5 md:p-6">
        <header className="text-center mb-5 animate-reveal">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            <span className="gold-shimmer">Doorprize</span>
          </h1>
          <p className="text-[11px] font-mono text-faint mt-2 tracking-wider">
            {participants.length} PESERTA TERDAFTAR
          </p>
        </header>

        <div className="flex-1 min-h-0 animate-reveal" style={{ animationDelay: "100ms" }}>
          <NameGrid
            participants={participants}
            isDrawing={isDrawing}
            drawnWinnerIds={wonIds}
            currentHighlight={highlight}
            onStartDraw={startDraw}
          />
        </div>
      </div>

      <ParticipantInput
        onAdd={addParticipant}
        onUpload={uploadFile}
        onDelete={deleteParticipant}
        disabled={isDrawing}
        visible={leftOpen}
        onToggle={() => setLeftOpen((v) => !v)}
        count={participants.length}
      />
      <WinnerList
        winners={winners}
        onReset={reset}
        disabled={isDrawing}
        visible={rightOpen}
        onToggle={() => setRightOpen((v) => !v)}
      />

      {/* Winner Modal with Confetti */}
      {modalWinners && (
        <WinnerModal
          winners={modalWinners.winners}
          round={modalWinners.round}
          onClose={() => setModalWinners(null)}
        />
      )}
    </div>
  );
}
