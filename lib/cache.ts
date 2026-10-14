/**
 * Client-Side Cache Layer for Doorprize
 * Enables instant optimistic loading, offline resilience, and state persistence.
 */

export interface CachedParticipant {
  id: string;
  name: string;
  createdAt?: string;
}

export interface CachedWinner {
  id: string;
  participantId: string;
  name: string;
  round: number;
  createdAt: string;
}

const KEYS = {
  PARTICIPANTS: "doorprize_cache_participants_v1",
  WINNERS: "doorprize_cache_winners_v1",
  LEFT_PANEL: "doorprize_pref_left_panel",
  RIGHT_PANEL: "doorprize_pref_right_panel",
  SOUND_ENABLED: "doorprize_pref_sound_enabled",
  DRAW_COUNT: "doorprize_pref_draw_count",
};

export function getCachedParticipants(): CachedParticipant[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEYS.PARTICIPANTS);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Failed to read participants from cache", e);
    return null;
  }
}

export function setCachedParticipants(data: CachedParticipant[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS.PARTICIPANTS, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to cache participants", e);
  }
}

export function getCachedWinners(): CachedWinner[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEYS.WINNERS);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Failed to read winners from cache", e);
    return null;
  }
}

export function setCachedWinners(data: CachedWinner[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS.WINNERS, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to cache winners", e);
  }
}

export function getCachedPref<T>(key: keyof typeof KEYS, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(KEYS[key]);
    return raw !== null ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setCachedPref<T>(key: keyof typeof KEYS, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(value));
  } catch (e) {
    console.warn("Failed to cache preference", e);
  }
}

export function clearAllLocalCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEYS.PARTICIPANTS);
    localStorage.removeItem(KEYS.WINNERS);
  } catch (e) {
    console.warn("Failed to clear local cache", e);
  }
}
