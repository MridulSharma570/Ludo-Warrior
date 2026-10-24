import React from 'react';
import {
  BoardThemeId,
  FACTIONS,
  FactionColor,
  GameState,
  HEX_6P_GEOMETRY,
  HOME_STRETCH_COORDS,
  MAIN_TRACK_COORDS,
  PENT_5P_GEOMETRY,
  STAR_ONLY_INDICES_4P,
  TURN_ORDER_6P,
  YARD_SLOT_COORDS,
  getHomeStep,
  getTokenCenterCoord,
} from '../engine/ludoEngine';

export interface ActiveTokenAnimation {
  tokenId: string;
  color: FactionColor;
  tokenIndex: number;
  currentCoord: [number, number];
  hopProgress: number;
  isRewind?: boolean;
}

export interface ClashEffect {
  id: string;
  coord: [number, number];
  color: FactionColor;
  label: string;
  type: 'capture' | 'citadel' | 'six';
}

interface BoardArenaProps {
  gameState: GameState;
  boardThemeId: BoardThemeId;
  activeAnim: ActiveTokenAnimation | null;
  clashEffects: ClashEffect[];
  canInteractMove: boolean;
  onSelectToken: (tokenIndex: number) => void;
}

const CleanStar: React.FC<{
  cx: number;
  cy: number;
  outerR: number;
  innerR: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}> = ({ cx, cy, outerR, innerR, fill, stroke = '#222222', strokeWidth = 2.4 }) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = ((i * 36 - 90) * Math.PI) / 180;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return (
    <polygon
      points={pts.join(' ')}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  );
};

/**
 * Authentic Ludo King Line Arrow (→, ↓, ←, ↑) at Home-Stretch Entrances
 */
const LudoKingLineArrow: React.FC<{
  cx: number;
  cy: number;
  dir: 'right' | 'down' | 'left' | 'up';
  color: string;
  scale?: number;
}> = ({ cx, cy, dir, color, scale = 1 }) => {
  const rot =
    dir === 'right' ? 0 : dir === 'down' ? 90 : dir === 'left' ? 180 : -90;
  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${rot}) scale(${scale})`}>
      <line
        x1={-24}
        y1={0}
        x2={20}
        y2={0}
        stroke={color}
        strokeWidth={5.5}
        strokeLinecap="round"
      />
      <polyline
        points="6,-14 22,0 6,14"
        fill="none"
        stroke={color}
        strokeWidth={5.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
};

/**
 * Exact Original Ludo King Pawn:
 * Large 3D White/Silver Teardrop Pin Body + Recessed Colored 3D Sphere in the Head
 */
const LudoKingPawn: React.FC<{
  color: FactionColor;
  cx: number;
  cy: number;
  scale: number;
  jumpHeight: number;
  isMovable: boolean;
  stackCount: number;
  showStackBadge: boolean;
  onClick: () => void;
}> = ({
  color,
  cx,
  cy,
  scale,
  jumpHeight,
  isMovable,
  stackCount,
  showStackBadge,
  onClick,
}) => {
  return (
    <g
      transform={`translate(${cx}, ${cy}) scale(${scale})`}
      onClick={(e) => {
        if (isMovable) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={isMovable ? 'cursor-pointer' : 'pointer-events-none'}
    >
      {/* Large Touch Hit Target for Android Screens */}
      {isMovable && <circle cx={0} cy={-34} r={64} fill="transparent" />}

      {/* Movable Highlight Ring Under Pawn */}
      {isMovable && (
        <circle
          cx={0}
          cy={2}
          r={36}
          fill="rgba(255, 230, 0, 0.32)"
          stroke="#FFFFFF"
          strokeWidth={3.5}
          strokeDasharray="9 5"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 2"
            to="360 0 2"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Ground Drop Shadow */}
      <ellipse
        cx={0}
        cy={6}
        rx={Math.max(12, 22 - jumpHeight * 0.16)}
        ry={Math.max(6, 11 - jumpHeight * 0.08)}
        fill={`rgba(0, 0, 0, ${Math.max(0.22, 0.42 - jumpHeight * 0.003)})`}
      />

      {/* Pawn Body (Bounces gently when movable) */}
      <g transform={`translate(0, ${-jumpHeight})`} filter="url(#cleanPawnShadow)">
        {isMovable && jumpHeight === 0 && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-9; 0,0"
            dur="0.75s"
            repeatCount="indefinite"
          />
        )}

        {/* 1. Outer Glossy White / Silver-Grey Teardrop Pin Body (Exact Ludo King Silhouette) */}
        <path
          d="M 0,6 C -14,-11 -33,-30 -33,-50 A 33,33 0 1,1 33,-50 C 33,-30 14,-11 0,6 Z"
          fill="url(#lkWhitePinBody)"
          stroke="#262626"
          strokeWidth={2.8}
          strokeLinejoin="round"
        />

        {/* Subtle 3D Inner Highlight on White Pin */}
        <path
          d="M 0,2 C -12,-13 -29,-30 -29,-50 A 29,29 0 1,1 29,-50 C 29,-30 12,-13 0,2 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2}
          opacity={0.9}
        />

        {/* 2. Inner Recessed Colored Sphere inside the Head (Exact Ludo King Detail) */}
        <circle cx={0} cy={-51} r={20.5} fill="#1B1B1B" />
        <circle cx={1} cy={-49.5} r={19.5} fill={`url(#lkPawnGrad-${color})`} />

        {/* Top-Left Inner Shadow Crescent inside Colored Sphere */}
        <path
          d="M -15,-62 A 19.5,19.5 0 0,1 16,-60 A 19,17 0 0,0 -14,-44 Z"
          fill="rgba(0, 0, 0, 0.28)"
        />

        {/* Bottom-Right Glossy Highlight on Colored Sphere */}
        <ellipse
          cx={5}
          cy={-42}
          rx={8}
          ry={4.5}
          transform="rotate(-20 5 -42)"
          fill="rgba(255, 255, 255, 0.32)"
        />

        {stackCount > 1 && showStackBadge && (
          <g transform="translate(23, -72)">
            <circle r={12} fill="#111827" stroke="#FFFFFF" strokeWidth={2.2} />
            <text
              y={4}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="12"
              fontWeight="900"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {stackCount}
            </text>
          </g>
        )}
      </g>
    </g>
  );
};

export const BoardArena: React.FC<BoardArenaProps> = ({
  gameState,
  activeAnim,
  clashEffects,
  canInteractMove,
  onSelectToken,
}) => {
  const CELL = 100;
  const BOARD_SIZE = 1500;
  const currentTurn = gameState.currentTurn;
  const boardType = gameState.boardType;
  const isRadial = boardType === 'pent5p' || boardType === 'hex6p';
  const radialGeom = boardType === 'pent5p' ? PENT_5P_GEOMETRY : HEX_6P_GEOMETRY;
  const homeStep = getHomeStep(boardType);

  interface RenderablePawn {
    id: string;
    color: FactionColor;
    tokenIndex: number;
    step: number;
    coord: [number, number];
    isMovable: boolean;
    isAnimating: boolean;
    hopProgress: number;
  }

  const allPawns: RenderablePawn[] = [];
  for (const color of gameState.activeOrder) {
    const player = gameState.players[color];
    if (!player || !player.active) continue;
    for (const t of player.tokens) {
      const isThisAnimating = activeAnim?.tokenId === t.id;
      const coord = isThisAnimating
        ? activeAnim.currentCoord
        : getTokenCenterCoord(color, t.tokenIndex, t.step, boardType);
      const isMovable =
        canInteractMove &&
        color === currentTurn &&
        gameState.turnPhase === 'MOVE' &&
        gameState.validTokenIndices.includes(t.tokenIndex);

      allPawns.push({
        id: t.id,
        color,
        tokenIndex: t.tokenIndex,
        step: t.step,
        coord,
        isMovable,
        isAnimating: isThisAnimating,
        hopProgress: isThisAnimating ? activeAnim.hopProgress : 0,
      });
    }
  }

  const cellGroups = new Map<string, RenderablePawn[]>();
  for (const p of allPawns) {
    if (p.isAnimating || p.step === -1 || p.step === homeStep) {
      cellGroups.set(`single-${p.id}`, [p]);
    } else {
      const key = `${p.coord[0].toFixed(2)},${p.coord[1].toFixed(2)}`;
      const list = cellGroups.get(key) ?? [];
      list.push(p);
      cellGroups.set(key, list);
    }
  }

  const getStackOffset = (idx: number, total: number): [number, number] => {
    if (total <= 1) return [0, 0];
    if (total === 2) {
      return idx === 0 ? [-15, 3] : [15, -3];
    }
    const radius = 17;
    const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  };

  // Large, prominent Ludo King pawn sizing (matches Image 2)
  const baseScale = boardType === 'square4p' ? 1.26 : boardType === 'pent5p' ? 0.92 : 0.84;

  const positionedPawns: {
    pawn: RenderablePawn;
    cx: number;
    cy: number;
    scale: number;
    jumpHeight: number;
    stackCount: number;
    showStackBadge: boolean;
  }[] = [];

  for (const group of cellGroups.values()) {
    // Sort within group so movable pawns are last (on top) and carry the stack badge
    const sortedGroup = [...group].sort((a, b) => {
      if (a.isMovable !== b.isMovable) return a.isMovable ? 1 : -1;
      return 0;
    });

    sortedGroup.forEach((pawn, idx) => {
      const [ox, oy] = getStackOffset(idx, sortedGroup.length);
      const cx = pawn.coord[1] * CELL + ox;
      const inYard = pawn.step === -1;
      const inHome = pawn.step === homeStep;
      const cy =
        pawn.coord[0] * CELL + oy + (inYard ? 8 : inHome ? 6 : isRadial ? 10 : 14);
      const scale = pawn.isAnimating
        ? baseScale * 1.12
        : inYard
        ? baseScale * 1.08
        : inHome
        ? baseScale * 0.62
        : sortedGroup.length === 1
        ? baseScale * 0.96
        : sortedGroup.length === 2
        ? baseScale * 0.8
        : baseScale * 0.72;
      const jumpHeight = pawn.isAnimating ? Math.sin(pawn.hopProgress * Math.PI) * 42 : 0;

      positionedPawns.push({
        pawn,
        cx,
        cy,
        scale,
        jumpHeight,
        stackCount: sortedGroup.length,
        showStackBadge: idx === sortedGroup.length - 1,
      });
    });
  }

  positionedPawns.sort((a, b) => {
    if (a.pawn.isMovable !== b.pawn.isMovable) {
      return a.pawn.isMovable ? 1 : -1;
    }
    return a.cy - b.cy;
  });

  const startColorByUIdx4P: Record<number, FactionColor> = {
    0: 'red',
    13: 'green',
    26: 'yellow',
    39: 'blue',
  };

  return (
    <div className="relative flex items-center justify-center select-none w-full">
      <div
        className={`relative w-full aspect-square overflow-hidden ${
          isRadial
            ? 'rounded-2xl bg-transparent'
            : 'border-[3px] border-[#111111] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.55)]'
        }`}
      >
        <svg viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`} className="w-full h-full block">
          <defs>
            <filter id="cleanPawnShadow" x="-35%" y="-35%" width="170%" height="170%">
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="3"
                floodColor="#000000"
                floodOpacity="0.48"
              />
            </filter>

            {/* Glossy White-to-Silver 3D Pin Body Gradient */}
            <linearGradient id="lkWhitePinBody" x1="15%" y1="5%" x2="85%" y2="95%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {TURN_ORDER_6P.map((color) => {
              const f = FACTIONS[color];
              return (
                <radialGradient
                  key={color}
                  id={`lkPawnGrad-${color}`}
                  cx="38%"
                  cy="35%"
                  r="68%"
                >
                  <stop offset="0%" stopColor={f.lightHex} />
                  <stop offset="55%" stopColor={f.primaryHex} />
                  <stop offset="100%" stopColor={f.darkHex} />
                </radialGradient>
              );
            })}
          </defs>

          {!isRadial ? (
            /* ===============================================================
             * 1. ORIGINAL LUDO KING 4-PLAYER SQUARE BOARD (15x15)
             * =============================================================== */
            <>
              {(
                [
                  {
                    color: 'red' as const,
                    r: 0,
                    c: 0,
                    defaultLabel: 'Player 2',
                    labelX: 46,
                    labelY: 300,
                    labelRot: 90,
                  },
                  {
                    color: 'green' as const,
                    r: 0,
                    c: 9,
                    defaultLabel: 'Player 3',
                    labelX: 1200,
                    labelY: 46,
                    labelRot: 180,
                  },
                  {
                    color: 'yellow' as const,
                    r: 9,
                    c: 9,
                    defaultLabel: 'Player 4',
                    labelX: 1454,
                    labelY: 1200,
                    labelRot: -90,
                  },
                  {
                    color: 'blue' as const,
                    r: 9,
                    c: 0,
                    defaultLabel: 'Player 1',
                    labelX: 300,
                    labelY: 1456,
                    labelRot: 0,
                  },
                ] as const
              ).map(({ color, r, c, defaultLabel, labelX, labelY, labelRot }) => {
                const f = FACTIONS[color];
                const x = c * CELL;
                const y = r * CELL;
                const size = 6 * CELL;
                const pState = gameState.players[color];
                const displayLabel = pState?.active ? pState.name || defaultLabel : defaultLabel;

                return (
                  <g key={`yard4p-${color}`}>
                    {/* Outer 6x6 Colored Yard */}
                    <rect
                      x={x}
                      y={y}
                      width={size}
                      height={size}
                      fill={f.primaryHex}
                      stroke="#222222"
                      strokeWidth={2.5}
                    />

                    {/* Sharp Inner White Box (Exact Ludo King rx=0) */}
                    <rect
                      x={x + 100}
                      y={y + 100}
                      width={400}
                      height={400}
                      fill="#FFFFFF"
                      stroke="#222222"
                      strokeWidth={2}
                    />

                    {/* 4 Double-Ringed Colored Token Pads */}
                    {YARD_SLOT_COORDS[color].map(([slotRow, slotCol], sIdx) => {
                      const cx = slotCol * CELL;
                      const cy = slotRow * CELL;
                      return (
                        <g key={`slot4p-${color}-${sIdx}`}>
                          <circle cx={cx} cy={cy} r={47} fill={f.primaryHex} />
                          <circle
                            cx={cx}
                            cy={cy}
                            r={31}
                            fill={f.darkHex}
                            stroke="#1B1B1B"
                            strokeWidth={2.8}
                          />
                        </g>
                      );
                    })}

                    {/* Rotated Player Label on Yard Border (Exact Ludo King Style) */}
                    <g transform={`translate(${labelX}, ${labelY}) rotate(${labelRot})`}>
                      <text
                        x={0}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#FFFFFF"
                        stroke="#000000"
                        strokeWidth={6}
                        paintOrder="stroke"
                        fontSize="38"
                        fontWeight="800"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {displayLabel}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 52 Perimeter Track Squares */}
              {MAIN_TRACK_COORDS.map(([r, c], uIdx) => {
                const x = c * CELL;
                const y = r * CELL;
                const startColor = startColorByUIdx4P[uIdx];
                const isStarSafe = STAR_ONLY_INDICES_4P.has(uIdx);

                return (
                  <g key={`tile4p-${uIdx}`}>
                    <rect
                      x={x}
                      y={y}
                      width={CELL}
                      height={CELL}
                      fill={startColor ? FACTIONS[startColor].primaryHex : '#FFFFFF'}
                      stroke="#262626"
                      strokeWidth={2}
                    />
                    {/* 4 Star Safe Squares */}
                    {isStarSafe && (
                      <CleanStar
                        cx={x + 50}
                        cy={y + 50}
                        outerR={38}
                        innerR={15}
                        fill="#FFFFFF"
                        stroke="#262626"
                        strokeWidth={2.5}
                      />
                    )}
                    {/* 4 Ludo King Home-Path Entrance Line Arrows */}
                    {uIdx === 50 && (
                      <LudoKingLineArrow
                        cx={x + 50}
                        cy={y + 50}
                        dir="right"
                        color={FACTIONS.red.primaryHex}
                      />
                    )}
                    {uIdx === 11 && (
                      <LudoKingLineArrow
                        cx={x + 50}
                        cy={y + 50}
                        dir="down"
                        color={FACTIONS.green.primaryHex}
                      />
                    )}
                    {uIdx === 24 && (
                      <LudoKingLineArrow
                        cx={x + 50}
                        cy={y + 50}
                        dir="left"
                        color={FACTIONS.yellow.darkHex}
                      />
                    )}
                    {uIdx === 37 && (
                      <LudoKingLineArrow
                        cx={x + 50}
                        cy={y + 50}
                        dir="up"
                        color={FACTIONS.blue.primaryHex}
                      />
                    )}
                  </g>
                );
              })}

              {/* 4 Colored Home Stretches */}
              {(['red', 'green', 'yellow', 'blue'] as const).map((color) => {
                const f = FACTIONS[color];
                return HOME_STRETCH_COORDS[color].map(([r, c], idx) => (
                  <rect
                    key={`stretch4p-${color}-${idx}`}
                    x={c * CELL}
                    y={r * CELL}
                    width={CELL}
                    height={CELL}
                    fill={f.primaryHex}
                    stroke="#262626"
                    strokeWidth={2}
                  />
                ));
              })}

              {/* Center 3x3 Home Triangles */}
              <g>
                <polygon
                  points="600,600 750,750 600,900"
                  fill={FACTIONS.red.primaryHex}
                  stroke="#222222"
                  strokeWidth={2.2}
                />
                <polygon
                  points="600,600 750,750 900,600"
                  fill={FACTIONS.green.primaryHex}
                  stroke="#222222"
                  strokeWidth={2.2}
                />
                <polygon
                  points="900,600 750,750 900,900"
                  fill={FACTIONS.yellow.primaryHex}
                  stroke="#222222"
                  strokeWidth={2.2}
                />
                <polygon
                  points="600,900 750,750 900,900"
                  fill={FACTIONS.blue.primaryHex}
                  stroke="#222222"
                  strokeWidth={2.2}
                />
                <rect
                  x={600}
                  y={600}
                  width={300}
                  height={300}
                  fill="none"
                  stroke="#222222"
                  strokeWidth={2.5}
                />
              </g>
            </>
          ) : (
            /* ===============================================================
             * 2. DISTINCT 5-PLAYER PENTAGONAL BOARD & 6-PLAYER HEXAGONAL BOARD
             * =============================================================== */
            <>
              {radialGeom.colors.map((color) => {
                const f = FACTIONS[color];
                const stepDeg = 360 / radialGeom.numArms;
                const deg = radialGeom.armAnglesDeg[color];
                const prevDeg = deg - stepDeg;
                const tilePx = radialGeom.tileSize * CELL;
                const innerPx = radialGeom.innerRadius * CELL;
                const outerPx = innerPx + 6 * tilePx;
                const halfArm = 1.5 * tilePx;

                const toGlobal = (
                  aDeg: number,
                  along: number,
                  across: number
                ): [number, number] => {
                  const rad = (aDeg * Math.PI) / 180;
                  return [
                    750 + along * Math.cos(rad) - across * Math.sin(rad),
                    750 + along * Math.sin(rad) + across * Math.cos(rad),
                  ];
                };

                const [vInX, vInY] = toGlobal(deg, innerPx, -halfArm);
                const [vOut1X, vOut1Y] = toGlobal(deg, outerPx, -halfArm);
                const [vOut2X, vOut2Y] = toGlobal(prevDeg, outerPx, +halfArm);

                const [ycRow, ycCol] = radialGeom.yardCenter[color];
                const cx = ycCol * CELL;
                const cy = ycRow * CELL;
                const boxHalf = radialGeom.numArms === 5 ? 96 : 86;
                const slotR = radialGeom.numArms === 5 ? 34 : 30;
                const innerSlotR = radialGeom.numArms === 5 ? 22 : 19;

                return (
                  <g key={`yard-${boardType}-${color}`}>
                    <polygon
                      points={`${vInX},${vInY} ${vOut2X},${vOut2Y} ${vOut1X},${vOut1Y}`}
                      fill={f.primaryHex}
                      stroke="#222222"
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                    />

                    <rect
                      x={cx - boxHalf}
                      y={cy - boxHalf}
                      width={boxHalf * 2}
                      height={boxHalf * 2}
                      fill="#FFFFFF"
                      stroke="#222222"
                      strokeWidth={2}
                    />

                    {radialGeom.yardSlotCoords[color].map(([sr, sc], idx) => (
                      <g key={`slot-${boardType}-${color}-${idx}`}>
                        <circle
                          cx={sc * CELL}
                          cy={sr * CELL}
                          r={slotR}
                          fill={f.primaryHex}
                        />
                        <circle
                          cx={sc * CELL}
                          cy={sr * CELL}
                          r={innerSlotR}
                          fill={f.darkHex}
                          stroke="#1B1B1B"
                          strokeWidth={2}
                        />
                      </g>
                    ))}
                  </g>
                );
              })}

              {radialGeom.colors.map((color) => {
                const f = FACTIONS[color];
                const deg = radialGeom.armAnglesDeg[color];
                const tilePx = radialGeom.tileSize * CELL;
                const innerPx = radialGeom.innerRadius * CELL;

                return (
                  <g
                    key={`arm-${boardType}-${color}`}
                    transform={`translate(750, 750) rotate(${deg})`}
                  >
                    {[0, 1, 2, 3, 4, 5].map((d) =>
                      [-1, 0, 1].map((lane) => {
                        const x = innerPx + d * tilePx;
                        const y = (lane - 0.5) * tilePx;

                        const isStartSquare = lane === 1 && d === 4;
                        const isStarSquare = lane === -1 && d === 3;
                        const isHomeStretch = lane === 0 && d < 5;
                        const isHomeEntrance = lane === 0 && d === 5;

                        let fillHex = '#FFFFFF';
                        if (isStartSquare || isHomeStretch) {
                          fillHex = f.primaryHex;
                        }

                        return (
                          <g key={`cell-${boardType}-${color}-${d}-${lane}`}>
                            <rect
                              x={x}
                              y={y}
                              width={tilePx}
                              height={tilePx}
                              fill={fillHex}
                              stroke="#262626"
                              strokeWidth={1.8}
                            />
                            {isStarSquare && (
                              <CleanStar
                                cx={x + tilePx / 2}
                                cy={y + tilePx / 2}
                                outerR={tilePx * 0.36}
                                innerR={tilePx * 0.14}
                                fill="#FFFFFF"
                                stroke="#262626"
                              />
                            )}
                            {isHomeEntrance && (
                              <LudoKingLineArrow
                                cx={x + tilePx / 2}
                                cy={y + tilePx / 2}
                                dir="left"
                                color={color === 'yellow' ? f.darkHex : f.primaryHex}
                                scale={0.72}
                              />
                            )}
                          </g>
                        );
                      })
                    )}
                  </g>
                );
              })}

              <g>
                {radialGeom.colors.map((color) => {
                  const f = FACTIONS[color];
                  const deg = radialGeom.armAnglesDeg[color];
                  const tilePx = radialGeom.tileSize * CELL;
                  const innerPx = radialGeom.innerRadius * CELL;
                  const halfArm = 1.5 * tilePx;

                  return (
                    <g
                      key={`center-tri-${boardType}-${color}`}
                      transform={`translate(750, 750) rotate(${deg})`}
                    >
                      <polygon
                        points={`0,0 ${innerPx},${-halfArm} ${innerPx},${halfArm}`}
                        fill={f.primaryHex}
                        stroke="#222222"
                        strokeWidth={2.2}
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })}
              </g>
            </>
          )}

          {/* Render All Pawns on Top of the Board */}
          {positionedPawns.map(
            ({ pawn, cx, cy, scale, jumpHeight, stackCount, showStackBadge }) => (
              <LudoKingPawn
                key={pawn.id}
                color={pawn.color}
                cx={cx}
                cy={cy}
                scale={scale}
                jumpHeight={jumpHeight}
                isMovable={pawn.isMovable}
                stackCount={stackCount}
                showStackBadge={showStackBadge}
                onClick={() => onSelectToken(pawn.tokenIndex)}
              />
            )
          )}

          {/* Render Floating Clash / Home Badges */}
          {clashEffects.map((fx) => {
            const cx = fx.coord[1] * CELL;
            const cy = fx.coord[0] * CELL - 46;
            const f = FACTIONS[fx.color];
            return (
              <g key={fx.id} transform={`translate(${cx}, ${cy})`} className="pointer-events-none">
                <rect
                  x={-84}
                  y={-22}
                  width={168}
                  height={40}
                  rx={12}
                  fill={fx.type === 'capture' ? '#ED1C24' : f.primaryHex}
                  stroke="#FFFFFF"
                  strokeWidth={3}
                />
                <text
                  x={0}
                  y={5}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="22"
                  fontWeight="900"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {fx.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
