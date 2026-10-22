import { BoardThemeId } from '../engine/ludoEngine';

export interface BoardThemeDefinition {
  id: BoardThemeId;
  name: string;
  subtitle: string;
  boardBorderHex: string;
  trackTileHex: string;
  trackGridHex: string;
  yardInnerHex: string;
}

export const BOARD_THEMES: Record<BoardThemeId, BoardThemeDefinition> = {
  ludo_king_classic: {
    id: 'ludo_king_classic',
    name: 'Ludo King Classic',
    subtitle: 'Crisp White & Bold Primary Colors',
    boardBorderHex: '#111111',
    trackTileHex: '#FFFFFF',
    trackGridHex: '#1E293B',
    yardInnerHex: '#FFFFFF',
  },
  royal_wood: {
    id: 'royal_wood',
    name: 'Classic Wood',
    subtitle: 'Warm Ivory & Wood Border',
    boardBorderHex: '#5C2C06',
    trackTileHex: '#FFFDF7',
    trackGridHex: '#334155',
    yardInnerHex: '#FFFFFF',
  },
  night_neon: {
    id: 'night_neon',
    name: 'Dark Mode',
    subtitle: 'High-Contrast Slate & Neon',
    boardBorderHex: '#FACC15',
    trackTileHex: '#F8FAFC',
    trackGridHex: '#0F172A',
    yardInnerHex: '#FFFFFF',
  },
};

export interface WarriorProfile {
  commanderName: string;
  avatarIndex: number;
  level: number;
  xp: number;
  coins: number;
  diamonds: number;
  matchesPlayed: number;
  matchesWon: number;
  totalCaptures: number;
  winStreak: number;
  boardTheme: BoardThemeId;
}

const STORAGE_KEY = 'ludo_warrior_profile_v3';

export const DEFAULT_PROFILE: WarriorProfile = {
  commanderName: 'You',
  avatarIndex: 0,
  level: 5,
  xp: 2450,
  coins: 50000,
  diamonds: 500,
  matchesPlayed: 14,
  matchesWon: 10,
  totalCaptures: 38,
  winStreak: 4,
  boardTheme: 'ludo_king_classic',
};

export function loadWarriorProfile(): WarriorProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      boardTheme: BOARD_THEMES[parsed.boardTheme as BoardThemeId]
        ? parsed.boardTheme
        : 'ludo_king_classic',
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveWarriorProfile(profile: WarriorProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage errors
  }
}
