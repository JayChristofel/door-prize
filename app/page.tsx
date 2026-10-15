"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ParticipantInput from "./components/ParticipantInput";
import NameGrid from "./components/NameGrid";
import WinnerList from "./components/WinnerList";
import { Participant, Winner } from "@/lib/types";
import { sound } from "@/lib/audio";

const CONFETTI_COLORS = ["#C9A84C", "#E8D48B", "#F5F0E8", "#FFD700", "#D4AF37", "#B8860B"];

function ConfettiPiece({
  side,
  delay,
  color,
  width,
  height,
}: {
  side: "left" | "right";
  delay: number;
  color: string;
  width: number;
  height: number;
}) {
  return (
    <div
      className={`absolute top-0 ${side === "left" ? "confetti-left" : "confetti-right"}`}
      style={{
        backgroundColor: color,
        animationDelay: `${delay}ms`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
}

function WinnerModal({
  winners,
  round,
  onClose,
}: {
  winners: Winner[];
  round: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const confettiPieces = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      side: i % 2 === 0 ? ("left" as const) : ("right" as const),
      delay: (i * 35) % 650,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      width: 7 + ((i * 3) % 8),
      height: 5 + ((i * 5) % 7),
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="absolute left-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none">
        {confettiPieces.filter((c) => c.side === "left").map((c) => (
          <ConfettiPiece key={`l-${c.id}`} side="left" delay={c.delay} color={c.color} width={c.width} height={c.height} />
        ))}
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none">
        {confettiPieces.filter((c) => c.side === "right").map((c) => (
          <ConfettiPiece key={`r-${c.id}`} side="right" delay={c.delay} color={c.color} width={c.width} height={c.height} />
        ))}
      </div>

      <div className="relative animate-modal-pop bg-surface border border-gold/30 shadow-2xl shadow-gold/20 rounded-3xl px-8 py-10 max-w-lg w-full text-center flex flex-col items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gradient-to-r from-transparent via-gold to-transparent rounded-b-full shadow-sm" />

        <div className="w-14 h-14 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold-dark mb-4 shadow-sm">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>

        <p className="text-[11px] font-bold tracking-[0.25em] text-gold-dark uppercase mb-1">
          Ronde {round}
        </p>
        <h2 className="text-xl font-bold text-ink mb-6">
          {winners.length === 1 ? "Selamat Kepada Pemenang!" : `Selamat Kepada ${winners.length} Pemenang!`}
        </h2>

        <div className="w-full max-h-[45vh] overflow-y-auto space-y-2.5 px-1 py-1">
          {winners.map((w, i) => (
            <div
              key={w.id}
              className="animate-winner-name flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-cream border border-gold/25 shadow-xs"
              style={{ animationDelay: `${250 + i * 100}ms` }}
            >
              <span className="w-7 h-7 rounded-xl bg-gold/20 text-gold-dark text-xs font-bold flex items-center justify-center shrink-0">
                #{i + 1}
              </span>
              <p className="text-lg font-bold text-gold-dark flex-1 truncate text-left">
                {w.name}
              </p>
              {w.column && (
                <span className="text-[10px] font-medium text-faint bg-surface border border-line px-2 py-0.5 rounded-full">
                  {w.column}
                </span>
              )}
              <span className="text-[10px] uppercase font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Terpilih
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          autoFocus
          className="mt-8 px-8 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:brightness-105 text-white text-xs font-bold tracking-wider uppercase shadow-md shadow-gold/20 transition-all cursor-pointer"
        >
          Lanjut ke Undian Berikutnya &rarr;
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [wonIds, setWonIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modalWinners, setModalWinners] = useState<{ winners: Winner[]; round: number } | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      try {
        const [pr, wr] = await Promise.all([
          fetch("/api/participants"),
          fetch("/api/winners"),
        ]);
        if (!ignore) {
          if (pr.ok) {
            const pData: Participant[] = await pr.json();
            setParticipants(pData);
          }
          if (wr.ok) {
            const wData: Winner[] = await wr.json();
            setWinners(wData);
            setWonIds(new Set(wData.map((w) => w.participantId)));
          }
        }
      } catch (e) {
        console.error("Gagal memuat data:", e);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      ignore = true;
    };
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const addParticipant = async (name: string, column: string): Promise<boolean> => {
    try {
      const r = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, column }),
      });
      if (r.ok) {
        const data: Participant = await r.json();
        setParticipants((p) => [...p, data]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const batchAddParticipants = async (names: string[], column: string): Promise<{ added: number; skipped: number }> => {
    try {
      const r = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names, column }),
      });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data.inserted) && data.inserted.length > 0) {
          setParticipants((prev) => [...prev, ...data.inserted]);
        }
        return { added: data.added || 0, skipped: data.skipped || 0 };
      }
      return { added: 0, skipped: names.length };
    } catch {
      return { added: 0, skipped: names.length };
    }
  };

  const deleteParticipant = async (id: string): Promise<boolean> => {
    try {
      const r = await fetch(`/api/participants?id=${id}`, { method: "DELETE" });
      if (r.ok) {
        setParticipants((prev) => prev.filter((p) => p.id !== id));
        setWonIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setWinners((prev) => prev.filter((w) => w.participantId !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteAllParticipants = async (): Promise<boolean> => {
    try {
      const r = await fetch("/api/participants?id=all", { method: "DELETE" });
      if (r.ok) {
        setParticipants([]);
        setWinners([]);
        setWonIds(new Set());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resetWinners = async () => {
    try {
      const r = await fetch("/api/winners", { method: "DELETE" });
      if (r.ok) {
        setWinners([]);
        setWonIds(new Set());
      }
    } catch (e) {
      console.error("Gagal reset pemenang:", e);
    }
  };

  const deleteSingleWinner = async (id: string): Promise<boolean> => {
    try {
      const r = await fetch(`/api/winners?id=${id}`, { method: "DELETE" });
      if (r.ok) {
        setWinners((prev) => {
          const removed = prev.find((w) => w.id === id);
          if (removed) {
            setWonIds((won) => {
              const next = new Set(won);
              next.delete(removed.participantId);
              return next;
            });
          }
          return prev.filter((w) => w.id !== id);
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error("Gagal hapus pemenang:", e);
      return false;
    }
  };

  const startDraw = useCallback(
    async (count: number, mode: "single" | "bulk") => {
      const pool = participants.filter((p) => !wonIds.has(p.id));
      if (pool.length === 0 || isDrawing) return;

      setIsDrawing(true);
      const round = winners.length > 0 ? Math.max(...winners.map((w) => w.round)) + 1 : 1;
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const picked = mode === "single" ? shuffled.slice(0, 1) : shuffled.slice(0, count);

      const total = 2800 + picked.length * 400;
      const slowAt = total * 0.65;
      let elapsed = 0;

      const tick = () => {
        const rnd = pool[Math.floor(Math.random() * pool.length)];
        setHighlight(rnd.id);
        elapsed += 50;

        sound.playTick(1.0 + (elapsed / total) * 0.3);

        if (elapsed < slowAt) {
          timer.current = setTimeout(tick, 50);
        } else if (elapsed < total) {
          const prog = (elapsed - slowAt) / (total - slowAt);
          timer.current = setTimeout(tick, 50 + prog * 180);
        } else {
          setHighlight(null);
          (async () => {
            try {
              const toInsert = picked.map((w) => ({
                participantId: w.id,
                name: w.name,
                round,
                column: w.column || null,
              }));

              const r = await fetch("/api/winners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: toInsert }),
              });

              if (r.ok) {
                const savedWinners: Winner[] = await r.json();
                setWinners((prev) => [...prev, ...savedWinners]);
                setWonIds((prev) => {
                  const next = new Set(prev);
                  picked.forEach((w) => next.add(w.id));
                  return next;
                });
                setModalWinners({ winners: savedWinners, round });
                sound.playCelebration();
              } else {
                console.error("Gagal menyimpan pemenang:", await r.text());
              }
            } catch (err) {
              console.error("Terjadi kesalahan simpan pemenang:", err);
            } finally {
              setIsDrawing(false);
            }
          })();
        }
      };

      tick();
    },
    [participants, wonIds, isDrawing, winners]
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
          <span className="text-xs font-medium text-muted tracking-wide">Memuat sistem doorprize...</span>
        </div>
      </div>
    );
  }

  const eligibleCount = participants.length - wonIds.size;

  return (
    <div className="h-screen bg-cream overflow-hidden flex flex-col">
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col p-4 md:p-6 min-h-0">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-4 animate-reveal">
          {/* Left stats / quick drawer opener */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLeftOpen((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-surface border border-line text-ink hover:border-gold/40 hover:bg-cream transition-all flex items-center gap-2 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span>Peserta ({participants.length})</span>
            </button>
          </div>

          {/* Centered Title */}
          <div className="text-center">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              <span className="gold-shimmer">Doorprize</span>
            </h1>
            <div className="flex items-center justify-center gap-3 mt-1 text-[11px] font-mono text-faint">
              <span>{participants.length} TOTAL</span>
              <span>&bull;</span>
              <span className="text-emerald-600 font-semibold">{eligibleCount} BELUM MENANG</span>
              <span>&bull;</span>
              <span className="text-gold-dark font-semibold">{winners.length} PEMENANG</span>
            </div>
          </div>

          {/* Right quick tools: Sound, Fullscreen, Winner List */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Matikan Suara" : "Nyalakan Suara"}
              className="p-2 rounded-xl bg-surface border border-line text-muted hover:text-ink hover:border-gold/40 transition-all shadow-xs cursor-pointer"
            >
              {soundEnabled ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh (Full Screen)"}
              className="hidden sm:flex p-2 rounded-xl bg-surface border border-line text-muted hover:text-ink hover:border-gold/40 transition-all shadow-xs cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>

            <button
              onClick={() => setRightOpen((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-surface border border-line text-ink hover:border-gold/40 hover:bg-cream transition-all flex items-center gap-2 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-gold" />
              <span>Pemenang ({winners.length})</span>
            </button>
          </div>
        </header>

        {/* Main interactive grid */}
        <main className="flex-1 min-h-0 animate-reveal" style={{ animationDelay: "80ms" }}>
          <NameGrid
            participants={participants}
            isDrawing={isDrawing}
            drawnWinnerIds={wonIds}
            currentHighlight={highlight}
            onStartDraw={startDraw}
          />
        </main>
      </div>

      {/* Participant Management Drawer */}
      <ParticipantInput
        participants={participants}
        onAdd={addParticipant}
        onBatchAdd={batchAddParticipants}
        onDelete={deleteParticipant}
        onDeleteAll={deleteAllParticipants}
        disabled={isDrawing}
        visible={leftOpen}
        onToggle={() => setLeftOpen((v) => !v)}
      />

      {/* Winner List Drawer */}
      <WinnerList
        winners={winners}
        onReset={resetWinners}
        onDeleteWinner={deleteSingleWinner}
        disabled={isDrawing}
        visible={rightOpen}
        onToggle={() => setRightOpen((v) => !v)}
      />

      {/* Winner Celebration Modal */}
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
