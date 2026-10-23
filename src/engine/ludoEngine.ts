export type FactionColor = 'red' | 'green' | 'yellow' | 'blue' | 'purple' | 'orange';

export type GameMode = 'classic' | 'quick' | 'master';

export type BoardType = 'square4p' | 'pent5p' | 'hex6p';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type BoardThemeId = 'ludo_king_classic' | 'royal_wood' | 'night_neon';

export interface FactionMeta {
  color: FactionColor;
  name: string;
  primaryHex: string;
  lightHex: string;
  darkHex: string;
  deepHex: string;
  glowRgba: string;
  startUniversalIndex4P: number;
  oppositeColor4P: FactionColor;
}

export const FACTIONS: Record<FactionColor, FactionMeta> = {
  red: {
    color: 'red',
    name: 'Red',
    primaryHex: '#EC1C24',
    lightHex: '#FF5252',
    darkHex: '#B71C1C',
    deepHex: '#600808',
    glowRgba: 'rgba(236, 28, 36, 0.55)',
    startUniversalIndex4P: 0,
    oppositeColor4P: 'yellow',
  },
  green: {
    color: 'green',
    name: 'Green',
    primaryHex: '#009E49',
    lightHex: '#2ECC71',
    darkHex: '#006837',
    deepHex: '#00381C',
    glowRgba: 'rgba(0, 158, 73, 0.55)',
    startUniversalIndex4P: 13,
    oppositeColor4P: 'blue',
  },
  yellow: {
    color: 'yellow',
    name: 'Yellow',
    primaryHex: '#FFDC00',
    lightHex: '#FFF200',
    darkHex: '#C79A00',
    deepHex: '#6E5100',
    glowRgba: 'rgba(255, 220, 0, 0.55)',
    startUniversalIndex4P: 26,
    oppositeColor4P: 'red',
  },
  blue: {
    color: 'blue',
    name: 'Blue',
    primaryHex: '#1498D5',
    lightHex: '#4FC3F7',
    darkHex: '#0277BD',
    deepHex: '#002642',
    glowRgba: 'rgba(20, 152, 213, 0.55)',
    startUniversalIndex4P: 39,
    oppositeColor4P: 'green',
  },
  purple: {
    color: 'purple',
    name: 'Purple',
    primaryHex: '#92278F',
    lightHex: '#BA68C8',
    darkHex: '#6A1B9A',
    deepHex: '#38006B',
    glowRgba: 'rgba(146, 39, 143, 0.55)',
    startUniversalIndex4P: 0,
    oppositeColor4P: 'orange',
  },
  orange: {
    color: 'orange',
    name: 'Orange',
    primaryHex: '#F7941D',
    lightHex: '#FFB74D',
    darkHex: '#E65100',
    deepHex: '#7F2B00',
    glowRgba: 'rgba(247, 148, 29, 0.55)',
    startUniversalIndex4P: 0,
    oppositeColor4P: 'purple',
  },
};

export const TURN_ORDER_4P: FactionColor[] = ['red', 'green', 'yellow', 'blue'];
export const TURN_ORDER_5P: FactionColor[] = ['red', 'green', 'yellow', 'blue', 'purple'];
export const TURN_ORDER_6P: FactionColor[] = [
  'red',
  'green',
  'yellow',
  'orange',
  'blue',
  'purple',
];
export const TURN_ORDER = TURN_ORDER_4P;

/* ============================================================================
 * 1. CLASSIC 4-PLAYER 15x15 SQUARE BOARD GEOMETRY
 * ============================================================================ */
export const MAIN_TRACK_COORDS: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0],
];

export const SAFE_UNIVERSAL_INDICES_4P = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);
export const STAR_ONLY_INDICES_4P = new Set<number>([8, 21, 34, 47]);
export const SAFE_UNIVERSAL_INDICES = SAFE_UNIVERSAL_INDICES_4P;
export const STAR_ONLY_INDICES = STAR_ONLY_INDICES_4P;

export const HOME_STRETCH_COORDS: Record<'red' | 'green' | 'yellow' | 'blue', [number, number][]> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
};

export const YARD_SLOT_COORDS: Record<'red' | 'green' | 'yellow' | 'blue', [number, number][]> = {
  red: [
    [1.9, 1.9],
    [1.9, 4.1],
    [4.1, 1.9],
    [4.1, 4.1],
  ],
  green: [
    [1.9, 10.9],
    [1.9, 13.1],
    [4.1, 10.9],
    [4.1, 13.1],
  ],
  yellow: [
    [10.9, 10.9],
    [10.9, 13.1],
    [13.1, 10.9],
    [13.1, 13.1],
  ],
  blue: [
    [10.9, 1.9],
    [10.9, 4.1],
    [13.1, 1.9],
    [13.1, 4.1],
  ],
};

export const CITADEL_SLOT_COORDS: Record<'red' | 'green' | 'yellow' | 'blue', [number, number][]> = {
  red: [
    [7.15, 6.42],
    [7.85, 6.42],
    [7.5, 6.72],
    [7.5, 6.25],
  ],
  green: [
    [6.42, 7.15],
    [6.42, 7.85],
    [6.72, 7.5],
    [6.25, 7.5],
  ],
  yellow: [
    [7.15, 8.58],
    [7.85, 8.58],
    [7.5, 8.28],
    [7.5, 8.75],
  ],
  blue: [
    [8.58, 7.15],
    [8.58, 7.85],
    [8.28, 7.5],
    [8.75, 7.5],
  ],
};

/* ============================================================================
 * 2. RADIAL N-PLAYER BOARD GENERATOR (5-PLAYER PENTAGONAL & 6-PLAYER HEXAGONAL)
 * ============================================================================ */
export interface RadialBoardGeometry {
  numArms: 5 | 6;
  colors: FactionColor[];
  tileSize: number; // Grid units (0..15)
  innerRadius: number; // Exact apothem of central N-gon: 1.5 * tileSize * cot(pi / N)
  armAnglesDeg: Record<FactionColor, number>;
  mainTrackCoords: [number, number][]; // 13 * N perimeter tiles
  safeUniversalIndices: Set<number>;
  starOnlyIndices: Set<number>;
  startUniversalByColor: Record<FactionColor, number>;
  homeStretchCoords: Record<FactionColor, [number, number][]>;
  yardCenter: Record<FactionColor, [number, number]>;
  yardSlotCoords: Record<FactionColor, [number, number][]>;
  citadelSlotCoords: Record<FactionColor, [number, number][]>;
}

function buildRadialBoardGeometry(numArms: 5 | 6): RadialBoardGeometry {
  const colors = numArms === 5 ? TURN_ORDER_5P : TURN_ORDER_6P;
  const stepDeg = 360 / numArms; // 72° for 5P, 60° for 6P
  const tileSize = numArms === 5 ? 0.78 : 0.75;
  const innerRadius = 1.5 * tileSize * (1 / Math.tan(Math.PI / numArms));

  const armAnglesDeg = {} as Record<FactionColor, number>;
  colors.forEach((c, idx) => {
    // Start at 180° (left) or 162° for 5P so bottom/top symmetry looks great
    const startAngle = numArms === 5 ? 162 : 180;
    armAnglesDeg[c] = (startAngle + idx * stepDeg) % 360;
  });

  const armLocalToGrid = (deg: number, rank: number, colOffset: number): [number, number] => {
    const rad = (deg * Math.PI) / 180;
    const along = innerRadius + (rank + 0.5) * tileSize;
    const across = colOffset * tileSize;
    const x = 7.5 + along * Math.cos(rad) - across * Math.sin(rad);
    const y = 7.5 + along * Math.sin(rad) + across * Math.cos(rad);
    return [y, x];
  };

  const mainTrackCoords: [number, number][] = [];
  const safeUniversalIndices = new Set<number>();
  const starOnlyIndices = new Set<number>();
  const startUniversalByColor = {} as Record<FactionColor, number>;
  const homeStretchCoords = {} as Record<FactionColor, [number, number][]>;
  const yardCenter = {} as Record<FactionColor, [number, number]>;
  const yardSlotCoords = {} as Record<FactionColor, [number, number][]>;
  const citadelSlotCoords = {} as Record<FactionColor, [number, number][]>;

  colors.forEach((color, armIdx) => {
    const deg = armAnglesDeg[color];
    const baseIdx = armIdx * 13;

    // 0..5: Outgoing track column (colOffset = +1, rank 0..5) -> index 4 (rank 4) is Faction Start!
    for (let rank = 0; rank <= 5; rank++) {
      mainTrackCoords.push(armLocalToGrid(deg, rank, 1));
    }
    // 6: Outer center turn tile (colOffset = 0, rank 5)
    mainTrackCoords.push(armLocalToGrid(deg, 5, 0));
    // 7..12: Incoming track column (colOffset = -1, rank 5..0) -> index 8 (rank 4) is Star Safe!
    for (let rank = 5; rank >= 0; rank--) {
      mainTrackCoords.push(armLocalToGrid(deg, rank, -1));
    }

    startUniversalByColor[color] = baseIdx + 4;
    safeUniversalIndices.add(baseIdx + 4);
    safeUniversalIndices.add(baseIdx + 8);
    starOnlyIndices.add(baseIdx + 8);

    homeStretchCoords[color] = [4, 3, 2, 1, 0].map((rank) =>
      armLocalToGrid(deg, rank, 0)
    );

    // Yard sits in the wedge at deg - stepDeg/2 (between previous arm and this arm)
    const yardRad = ((deg - stepDeg / 2) * Math.PI) / 180;
    const yDist = numArms === 5 ? 4.45 : 4.62;
    const ycCol = 7.5 + yDist * Math.cos(yardRad);
    const ycRow = 7.5 + yDist * Math.sin(yardRad);
    yardCenter[color] = [ycRow, ycCol];

    const slotOffset = numArms === 5 ? 0.52 : 0.45;
    yardSlotCoords[color] = [
      [ycRow - slotOffset, ycCol - slotOffset],
      [ycRow - slotOffset, ycCol + slotOffset],
      [ycRow + slotOffset, ycCol - slotOffset],
      [ycRow + slotOffset, ycCol + slotOffset],
    ];

    const citRad = (deg * Math.PI) / 180;
    citadelSlotCoords[color] = [0.68, 0.96, 1.15, 1.32].map((r, idx) => {
      const spread = (idx % 2 === 0 ? -1 : 1) * 0.2;
      return [
        7.5 + r * Math.sin(citRad) + spread * Math.cos(citRad),
        7.5 + r * Math.cos(citRad) - spread * Math.sin(citRad),
      ];
    });
  });

  return {
    numArms,
    colors,
    tileSize,
    innerRadius,
    armAnglesDeg,
    mainTrackCoords,
    safeUniversalIndices,
    starOnlyIndices,
    startUniversalByColor,
    homeStretchCoords,
    yardCenter,
    yardSlotCoords,
    citadelSlotCoords,
  };
}

export const PENT_5P_GEOMETRY = buildRadialBoardGeometry(5);
export const HEX_6P_GEOMETRY = buildRadialBoardGeometry(6);

/* ============================================================================
 * UNIFIED ENGINE FUNCTIONS (HANDLES 4P SQUARE, 5P PENTAGONAL, 6P HEXAGONAL)
 * ============================================================================ */

export interface PawnToken {
  id: string;
  color: FactionColor;
  tokenIndex: number; // 0..3
  /**
   * 4P Square Board:     -1 = Yard, 0..50 = Perimeter (51 tiles), 51..55 = Home Stretch, 56 = Home
   * 5P Pentagonal Board: -1 = Yard, 0..61 = Perimeter (62 tiles), 62..66 = Home Stretch, 67 = Home
   * 6P Hexagonal Board:  -1 = Yard, 0..74 = Perimeter (75 tiles), 75..79 = Home Stretch, 80 = Home
   */
  step: number;
}

export interface PlayerState {
  color: FactionColor;
  name: string;
  isAI: boolean;
  aiDifficulty: AIDifficulty;
  active: boolean;
  connected: boolean;
  avatarIndex: number;
  tokens: PawnToken[];
  stats: {
    sixesRolled: number;
    capturesMade: number;
    timesCaptured: number;
    tilesMoved: number;
  };
  finishRank?: number;
}

export interface EmoteEvent {
  id: string;
  color: FactionColor;
  playerName: string;
  emote: string;
  message?: string;
  timestamp: number;
}

export interface CapturedPawnReturn {
  color: FactionColor;
  tokenIndex: number;
  fromStep: number;
  returnCoords: [number, number][];
}

export interface MoveExecutionResult {
  valid: boolean;
  tokenId: string;
  color: FactionColor;
  tokenIndex: number;
  fromStep: number;
  toStep: number;
  pathCoords: [number, number][];
  capturedTokens: CapturedPawnReturn[];
  reachedCitadel: boolean;
  earnedBonusRoll: boolean;
  bonusReason?: 'ROLLED_SIX' | 'CAPTURED_ENEMY' | 'REACHED_HOME';
  gameWonBy?: FactionColor;
}

export interface GameState {
  roomId: string;
  mode: GameMode;
  boardType: BoardType;
  status: 'waiting' | 'playing' | 'finished';
  players: Record<FactionColor, PlayerState>;
  activeOrder: FactionColor[];
  currentTurn: FactionColor;
  turnPhase: 'ROLL' | 'MOVE' | 'GAME_OVER';
  diceValue: number | null;
  consecutiveSixes: number;
  validTokenIndices: number[];
  winnerOrder: FactionColor[];
  lastMove?: MoveExecutionResult;
  turnNumber: number;
  turnStartedAt: number;
}

export function getHomeStep(boardType: BoardType = 'square4p'): number {
  if (boardType === 'pent5p') return 67;
  if (boardType === 'hex6p') return 80;
  return 56;
}

export function getMaxPerimeterStep(boardType: BoardType = 'square4p'): number {
  if (boardType === 'pent5p') return 61;
  if (boardType === 'hex6p') return 74;
  return 50;
}

export function getTotalPerimeterTiles(boardType: BoardType = 'square4p'): number {
  if (boardType === 'pent5p') return 65;
  if (boardType === 'hex6p') return 78;
  return 52;
}

export function getUniversalIndex(
  color: FactionColor,
  step: number,
  boardType: BoardType = 'square4p'
): number | null {
  const maxPerim = getMaxPerimeterStep(boardType);
  if (step < 0 || step > maxPerim) return null;

  if (boardType === 'pent5p') {
    const startIdx = PENT_5P_GEOMETRY.startUniversalByColor[color] ?? 4;
    return (startIdx + step) % 65;
  }
  if (boardType === 'hex6p') {
    const startIdx = HEX_6P_GEOMETRY.startUniversalByColor[color] ?? 4;
    return (startIdx + step) % 78;
  }

  const offset = FACTIONS[color].startUniversalIndex4P;
  return (offset + step) % 52;
}

export function isSafeUniversalIndex(
  uIdx: number,
  boardType: BoardType = 'square4p'
): boolean {
  if (boardType === 'pent5p') return PENT_5P_GEOMETRY.safeUniversalIndices.has(uIdx);
  if (boardType === 'hex6p') return HEX_6P_GEOMETRY.safeUniversalIndices.has(uIdx);
  return SAFE_UNIVERSAL_INDICES_4P.has(uIdx);
}

export function getTokenCenterCoord(
  color: FactionColor,
  tokenIndex: number,
  step: number,
  boardType: BoardType = 'square4p'
): [number, number] {
  if (boardType === 'pent5p' || boardType === 'hex6p') {
    const geom = boardType === 'pent5p' ? PENT_5P_GEOMETRY : HEX_6P_GEOMETRY;
    const maxPerim = getMaxPerimeterStep(boardType);
    const homeStep = getHomeStep(boardType);

    if (step === -1) {
      return geom.yardSlotCoords[color]?.[tokenIndex] ?? geom.yardSlotCoords.red[0];
    }
    if (step >= 0 && step <= maxPerim) {
      const uIdx = getUniversalIndex(color, step, boardType)!;
      return geom.mainTrackCoords[uIdx];
    }
    if (step > maxPerim && step < homeStep) {
      return geom.homeStretchCoords[color][step - (maxPerim + 1)];
    }
    return geom.citadelSlotCoords[color]?.[tokenIndex] ?? geom.citadelSlotCoords.red[0];
  }

  // 4-Player Classic Square Board
  const c4 = (color === 'purple' || color === 'orange' ? 'red' : color) as
    | 'red'
    | 'green'
    | 'yellow'
    | 'blue';
  if (step === -1) {
    return YARD_SLOT_COORDS[c4][tokenIndex] ?? YARD_SLOT_COORDS[c4][0];
  }
  if (step >= 0 && step <= 50) {
    const uIdx = getUniversalIndex(c4, step, 'square4p')!;
    const [r, c] = MAIN_TRACK_COORDS[uIdx];
    return [r + 0.5, c + 0.5];
  }
  if (step >= 51 && step <= 55) {
    const stretchIdx = step - 51;
    const [r, c] = HOME_STRETCH_COORDS[c4][stretchIdx];
    return [r + 0.5, c + 0.5];
  }
  return CITADEL_SLOT_COORDS[c4][tokenIndex] ?? CITADEL_SLOT_COORDS[c4][0];
}

export function getStepByStepCoords(
  color: FactionColor,
  tokenIndex: number,
  fromStep: number,
  toStep: number,
  boardType: BoardType = 'square4p'
): [number, number][] {
  if (fromStep === -1 && toStep === 0) {
    return [
      getTokenCenterCoord(color, tokenIndex, -1, boardType),
      getTokenCenterCoord(color, tokenIndex, 0, boardType),
    ];
  }
  const coords: [number, number][] = [];
  for (let s = fromStep; s <= toStep; s++) {
    coords.push(getTokenCenterCoord(color, tokenIndex, s, boardType));
  }
  return coords;
}

/**
 * Step-by-step rewind coordinates when a piece is captured and returns to its yard.
 * Steps through EVERY single square (s -= 1) so the return animation is smooth and unhurried.
 */
export function getCaptureRewindCoords(
  color: FactionColor,
  tokenIndex: number,
  fromStep: number,
  boardType: BoardType = 'square4p'
): [number, number][] {
  const coords: [number, number][] = [];
  for (let s = fromStep; s >= 0; s -= 1) {
    coords.push(getTokenCenterCoord(color, tokenIndex, s, boardType));
  }
  coords.push(getTokenCenterCoord(color, tokenIndex, -1, boardType));
  return coords;
}

export function getTargetCitadelCount(mode: GameMode): number {
  return mode === 'quick' ? 2 : 4;
}

export function createInitialGameState(options: {
  roomId?: string;
  mode: GameMode;
  boardType?: BoardType;
  playerConfigs: {
    color: FactionColor;
    name: string;
    isAI: boolean;
    aiDifficulty?: AIDifficulty;
    active: boolean;
    avatarIndex?: number;
  }[];
}): GameState {
  const { roomId = 'LOCAL', mode, playerConfigs } = options;
  const activeCount = playerConfigs.filter((c) => c.active).length;

  let boardType: BoardType = options.boardType ?? 'square4p';
  if (!options.boardType) {
    if (activeCount === 5) {
      boardType = 'pent5p';
    } else if (activeCount >= 6) {
      boardType = 'hex6p';
    } else {
      boardType = 'square4p';
    }
  }

  const orderList =
    boardType === 'pent5p'
      ? TURN_ORDER_5P
      : boardType === 'hex6p'
      ? TURN_ORDER_6P
      : TURN_ORDER_4P;

  const players = {} as Record<FactionColor, PlayerState>;
  const activeOrder: FactionColor[] = [];

  for (let i = 0; i < TURN_ORDER_6P.length; i++) {
    const color = TURN_ORDER_6P[i];
    const cfg = playerConfigs.find((c) => c.color === color) ?? {
      color,
      name: `${FACTIONS[color].name}`,
      isAI: true,
      aiDifficulty: 'hard' as AIDifficulty,
      active: false,
    };

    const isActive = orderList.includes(color) && cfg.active;
    if (isActive) {
      activeOrder.push(color);
    }

    const tokens: PawnToken[] = [0, 1, 2, 3].map((idx) => ({
      id: `${color}-${idx}`,
      color,
      tokenIndex: idx,
      step: isActive && mode === 'quick' && idx === 0 ? 0 : -1,
    }));

    players[color] = {
      color,
      name: cfg.name,
      isAI: cfg.isAI,
      aiDifficulty: cfg.aiDifficulty ?? 'hard',
      active: isActive,
      connected: true,
      avatarIndex: cfg.avatarIndex ?? i,
      tokens,
      stats: {
        sixesRolled: 0,
        capturesMade: 0,
        timesCaptured: 0,
        tilesMoved: 0,
      },
    };
  }

  activeOrder.sort((a, b) => orderList.indexOf(a) - orderList.indexOf(b));
  const firstTurn = activeOrder[0] ?? 'red';

  return {
    roomId,
    mode,
    boardType,
    status: 'playing',
    players,
    activeOrder,
    currentTurn: firstTurn,
    turnPhase: 'ROLL',
    diceValue: null,
    consecutiveSixes: 0,
    validTokenIndices: [],
    winnerOrder: [],
    turnNumber: 1,
    turnStartedAt: Date.now(),
  };
}

export function getValidMovesForRoll(
  state: GameState,
  playerColor: FactionColor,
  diceValue: number
): number[] {
  const player = state.players[playerColor];
  if (!player) return [];

  const homeStep = getHomeStep(state.boardType);
  const validIndices: number[] = [];

  for (const token of player.tokens) {
    if (token.step === homeStep) continue;

    if (token.step === -1) {
      if (diceValue === 6) {
        validIndices.push(token.tokenIndex);
      }
    } else {
      const targetStep = token.step + diceValue;
      if (targetStep <= homeStep) {
        validIndices.push(token.tokenIndex);
      }
    }
  }

  return validIndices;
}

export function getNextTurnColor(state: GameState): FactionColor {
  const order = state.activeOrder;
  const currentIdx = order.indexOf(state.currentTurn);
  const targetCount = getTargetCitadelCount(state.mode);
  const homeStep = getHomeStep(state.boardType);

  for (let offset = 1; offset <= order.length; offset++) {
    const candidate = order[(currentIdx + offset) % order.length];
    const p = state.players[candidate];
    if (!p || !p.active) continue;

    const finishedCount = p.tokens.filter((t) => t.step === homeStep).length;
    if (finishedCount < targetCount) {
      return candidate;
    }
  }

  return state.currentTurn;
}

export function applyDiceRoll(
  state: GameState,
  forcedValue?: number
): {
  rolled: number;
  threeSixesForfeit: boolean;
  validTokenIndices: number[];
} {
  const rolled = forcedValue ?? Math.floor(Math.random() * 6) + 1;
  const player = state.players[state.currentTurn];
  state.diceValue = rolled;

  if (rolled === 6) {
    player.stats.sixesRolled += 1;
    state.consecutiveSixes += 1;
  } else {
    state.consecutiveSixes = 0;
  }

  if (state.consecutiveSixes >= 3) {
    state.consecutiveSixes = 0;
    state.validTokenIndices = [];
    state.diceValue = null;
    state.currentTurn = getNextTurnColor(state);
    state.turnPhase = 'ROLL';
    state.turnNumber += 1;
    state.turnStartedAt = Date.now();
    return {
      rolled,
      threeSixesForfeit: true,
      validTokenIndices: [],
    };
  }

  const validIndices = getValidMovesForRoll(state, state.currentTurn, rolled);
  state.validTokenIndices = validIndices;

  if (validIndices.length === 0) {
    state.consecutiveSixes = 0;
    state.diceValue = null;
    state.currentTurn = getNextTurnColor(state);
    state.turnPhase = 'ROLL';
    state.turnNumber += 1;
    state.turnStartedAt = Date.now();
  } else {
    state.turnPhase = 'MOVE';
  }

  return {
    rolled,
    threeSixesForfeit: false,
    validTokenIndices: validIndices,
  };
}

export function executeTokenMove(state: GameState, tokenIndex: number): MoveExecutionResult {
  const playerColor = state.currentTurn;
  const player = state.players[playerColor];
  const dice = state.diceValue ?? 1;
  const homeStep = getHomeStep(state.boardType);

  if (!state.validTokenIndices.includes(tokenIndex)) {
    return {
      valid: false,
      tokenId: `${playerColor}-${tokenIndex}`,
      color: playerColor,
      tokenIndex,
      fromStep: -1,
      toStep: -1,
      pathCoords: [],
      capturedTokens: [],
      reachedCitadel: false,
      earnedBonusRoll: false,
    };
  }

  const token = player.tokens[tokenIndex];
  const fromStep = token.step;
  const toStep = fromStep === -1 ? 0 : Math.min(homeStep, fromStep + dice);
  const stepsMoved = fromStep === -1 ? 1 : toStep - fromStep;

  const pathCoords = getStepByStepCoords(
    playerColor,
    tokenIndex,
    fromStep,
    toStep,
    state.boardType
  );

  token.step = toStep;
  player.stats.tilesMoved += stepsMoved;

  const capturedTokens: CapturedPawnReturn[] = [];
  const destUniversal = getUniversalIndex(playerColor, toStep, state.boardType);

  if (destUniversal !== null && !isSafeUniversalIndex(destUniversal, state.boardType)) {
    for (const otherColor of state.activeOrder) {
      if (otherColor === playerColor) continue;
      const otherPlayer = state.players[otherColor];
      const enemiesAtTile = otherPlayer.tokens.filter(
        (t) => getUniversalIndex(otherColor, t.step, state.boardType) === destUniversal
      );

      if (state.mode === 'master' && enemiesAtTile.length >= 2) {
        continue;
      }

      for (const enemyToken of enemiesAtTile) {
        const enemyFromStep = enemyToken.step;
        const returnCoords = getCaptureRewindCoords(
          otherColor,
          enemyToken.tokenIndex,
          enemyFromStep,
          state.boardType
        );
        enemyToken.step = -1;
        otherPlayer.stats.timesCaptured += 1;
        player.stats.capturesMade += 1;

        capturedTokens.push({
          color: otherColor,
          tokenIndex: enemyToken.tokenIndex,
          fromStep: enemyFromStep,
          returnCoords,
        });
      }
    }
  }

  const reachedCitadel = toStep === homeStep;
  const targetCount = getTargetCitadelCount(state.mode);
  const finishedCount = player.tokens.filter((t) => t.step === homeStep).length;
  let gameWonBy: FactionColor | undefined;

  if (finishedCount >= targetCount && !state.winnerOrder.includes(playerColor)) {
    state.winnerOrder.push(playerColor);
    player.finishRank = state.winnerOrder.length;
  }

  if (state.winnerOrder.length >= 1) {
    state.status = 'finished';
    state.turnPhase = 'GAME_OVER';
    gameWonBy = state.winnerOrder[0];
  }

  let earnedBonusRoll = false;
  let bonusReason: MoveExecutionResult['bonusReason'];

  if (state.status !== 'finished') {
    if (capturedTokens.length > 0) {
      earnedBonusRoll = true;
      bonusReason = 'CAPTURED_ENEMY';
    } else if (reachedCitadel) {
      earnedBonusRoll = true;
      bonusReason = 'REACHED_HOME';
    } else if (dice === 6) {
      earnedBonusRoll = true;
      bonusReason = 'ROLLED_SIX';
    }
  }

  const result: MoveExecutionResult = {
    valid: true,
    tokenId: `${playerColor}-${tokenIndex}`,
    color: playerColor,
    tokenIndex,
    fromStep,
    toStep,
    pathCoords,
    capturedTokens,
    reachedCitadel,
    earnedBonusRoll,
    bonusReason,
    gameWonBy,
  };

  state.lastMove = result;
  state.validTokenIndices = [];

  if (state.status !== 'finished') {
    if (earnedBonusRoll) {
      state.turnPhase = 'ROLL';
      state.diceValue = null;
      state.turnStartedAt = Date.now();
    } else {
      state.consecutiveSixes = 0;
      state.currentTurn = getNextTurnColor(state);
      state.turnPhase = 'ROLL';
      state.diceValue = null;
      state.turnNumber += 1;
      state.turnStartedAt = Date.now();
    }
  }

  return result;
}

export function selectBestAIMove(state: GameState): number {
  const validIndices = state.validTokenIndices;
  if (validIndices.length === 0) return 0;
  if (validIndices.length === 1) return validIndices[0];

  const playerColor = state.currentTurn;
  const player = state.players[playerColor];
  const difficulty = player.aiDifficulty;
  const dice = state.diceValue ?? 1;
  const homeStep = getHomeStep(state.boardType);
  const maxPerim = getMaxPerimeterStep(state.boardType);
  const totalPerim = getTotalPerimeterTiles(state.boardType);

  if (difficulty === 'easy' && Math.random() < 0.45) {
    return validIndices[Math.floor(Math.random() * validIndices.length)];
  }

  const enemyUniversalIndices: number[] = [];
  for (const otherColor of state.activeOrder) {
    if (otherColor === playerColor) continue;
    for (const t of state.players[otherColor].tokens) {
      const u = getUniversalIndex(otherColor, t.step, state.boardType);
      if (u !== null) enemyUniversalIndices.push(u);
    }
  }

  const isThreatened = (uIdx: number | null): boolean => {
    if (uIdx === null || isSafeUniversalIndex(uIdx, state.boardType)) return false;
    return enemyUniversalIndices.some((eu) => {
      const dist = (uIdx - eu + totalPerim) % totalPerim;
      return dist >= 1 && dist <= 6;
    });
  };

  let bestIdx = validIndices[0];
  let bestScore = -Infinity;

  for (const idx of validIndices) {
    const token = player.tokens[idx];
    const fromStep = token.step;
    const toStep = fromStep === -1 ? 0 : Math.min(homeStep, fromStep + dice);
    let score = 0;

    if (fromStep === -1 && toStep === 0) {
      score += 105;
    }

    const fromU = getUniversalIndex(playerColor, fromStep, state.boardType);
    const toU = getUniversalIndex(playerColor, toStep, state.boardType);

    if (toU !== null && !isSafeUniversalIndex(toU, state.boardType)) {
      const hits = enemyUniversalIndices.filter((eu) => eu === toU).length;
      if (hits > 0) score += 160 * hits;
    }

    if (toStep === homeStep) {
      score += 140;
    }

    if (fromStep <= maxPerim && toStep > maxPerim) {
      score += 90;
    }

    if (toU !== null && isSafeUniversalIndex(toU, state.boardType)) {
      score += 75;
    }

    if (isThreatened(fromU) && !isThreatened(toU)) {
      score += 85;
    }

    if (difficulty !== 'easy' && isThreatened(toU)) {
      score -= 65;
    }

    if (fromU !== null && isSafeUniversalIndex(fromU, state.boardType) && isThreatened(toU)) {
      score -= 50;
    }

    score += toStep * 0.9 + Math.random() * 2;

    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  }

  return bestIdx;
}
