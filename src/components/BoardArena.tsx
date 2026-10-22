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
}> = ({ cx, cy, outerR, innerR, fill, stroke = 'none' }) => {
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
      strokeWidth={stroke !== 'none' ? 2 : 0}
      strokeLinejoin="round"
    />
  );
};

/**
 * Clean, Crisp Ludo King Pawn (Teardrop Map-Pin with White Center Circle)
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
  const f = FACTIONS[color];

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
      {isMovable && <circle cx={0} cy={-26} r={62} fill="transparent" />}

      {/* Subtle Movable Ring around Base */}
      {isMovable && (
        <circle
          cx={0}
          cy={2}
          r={32}
          fill="rgba(255, 203, 5, 0.28)"
          stroke="#1E293B"
          strokeWidth={3}
          strokeDasharray="8 5"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 2"
            to="360 0 2"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Ground Shadow */}
      <ellipse
        cx={0}
        cy={9}
        rx={Math.max(11, 21 - jumpHeight * 0.18)}
        ry={Math.max(6, 11 - jumpHeight * 0.09)}
        fill={`rgba(15, 23, 42, ${Math.max(0.16, 0.34 - jumpHeight * 0.003)})`}
      />

      {/* Pawn Body */}
      <g transform={`translate(0, ${-jumpHeight})`} filter="url(#cleanPawnShadow)">
        <ellipse
          cx={0}
          cy={5}
          rx={18}
          ry={10}
          fill="#FFFFFF"
          stroke="#1E293B"
          strokeWidth={2.2}
        />

        <path
          d="M 0,7 C -13,-8 -29,-25 -29,-42 A 29,29 0 1,1 29,-42 C 29,-25 13,-8 0,7 Z"
          fill={`url(#lkPawnGrad-${color})`}
          stroke="#1E293B"
          strokeWidth={2.6}
          strokeLinejoin="round"
        />

        <path
          d="M 0,3 C -11,-10 -25,-25 -25,-42 A 25,25 0 1,1 25,-42 C 25,-25 11,-10 0,3 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth={1.6}
        />

        {/* Iconic Ludo King 3D Recessed Top Cap (Rich Colored Dome + Specular Rim) */}
        <circle
          cx={0}
          cy={-42}
          r={15}
          fill={f.darkHex}
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth={2}
        />
        <circle
          cx={0}
          cy={-42}
          r={11.5}
          fill={`url(#lkPawnGrad-${color})`}
        />

        {/* Glossy 3D Specular Highlight on Top Dome */}
        <ellipse
          cx={-6}
          cy={-48}
          rx={6.5}
          ry={3.2}
          transform="rotate(-25 -6 -48)"
          fill="rgba(255, 255, 255, 0.75)"
        />

        {stackCount > 1 && showStackBadge && (
          <g transform="translate(19, -60)">
            <circle r={11} fill="#1E293B" stroke="#FFFFFF" strokeWidth={2} />
            <text
              y={4}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="800"
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
      return idx === 0 ? [-14, 3] : [14, -3];
    }
    const radius = 16;
    const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  };

  const baseScale = boardType === 'square4p' ? 0.86 : boardType === 'pent5p' ? 0.72 : 0.66;

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
    group.forEach((pawn, idx) => {
      const [ox, oy] = getStackOffset(idx, group.length);
      const cx = pawn.coord[1] * CELL + ox;
      const cy = pawn.coord[0] * CELL + oy + (isRadial ? 10 : 15);
      const scale = pawn.isAnimating
        ? baseScale * 1.08
        : group.length === 1
        ? baseScale
        : group.length === 2
        ? baseScale * 0.8
        : baseScale * 0.7;
      const jumpHeight = pawn.isAnimating ? Math.sin(pawn.hopProgress * Math.PI) * 38 : 0;

      positionedPawns.push({
        pawn,
        cx,
        cy,
        scale,
        jumpHeight,
        stackCount: group.length,
        showStackBadge: idx === group.length - 1,
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
        className={`relative w-full aspect-square max-w-[min(78vh,96vw)] overflow-hidden ${
          isRadial
            ? 'rounded-3xl bg-transparent'
            : 'rounded-xl border-[3px] border-[#1E293B] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.45)]'
        }`}
      >
        <svg viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`} className="w-full h-full block">
          <defs>
            <filter id="cleanPawnShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="0"
                dy="3"
                stdDeviation="2.5"
                floodColor="#0F172A"
                floodOpacity="0.4"
              />
            </filter>

            {TURN_ORDER_6P.map((color) => {
              const f = FACTIONS[color];
              return (
                <linearGradient
                  key={color}
                  id={`lkPawnGrad-${color}`}
                  x1="20%"
                  y1="0%"
                  x2="80%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={f.lightHex} />
                  <stop offset="50%" stopColor={f.primaryHex} />
                  <stop offset="100%" stopColor={f.darkHex} />
                </linearGradient>
              );
            })}
          </defs>

          {!isRadial ? (
            /* ===============================================================
             * 1. CLASSIC 4-PLAYER SQUARE BOARD (15x15)
             * =============================================================== */
            <>
              {(
                [
                  { color: 'red' as const, r: 0, c: 0 },
                  { color: 'green' as const, r: 0, c: 9 },
                  { color: 'yellow' as const, r: 9, c: 9 },
                  { color: 'blue' as const, r: 9, c: 0 },
                ] as const
              ).map(({ color, r, c }) => {
                const f = FACTIONS[color];
                const x = c * CELL;
                const y = r * CELL;
                const size = 6 * CELL;

                const isTurnYard = currentTurn === color;

                return (
                  <g key={`yard4p-${color}`}>
                    <rect
                      x={x}
                      y={y}
                      width={size}
                      height={size}
                      fill={f.primaryHex}
                      stroke="#1E293B"
                      strokeWidth={2.5}
                    />
                    {isTurnYard && (
                      <rect
                        x={x + 6}
                        y={y + 6}
                        width={size - 12}
                        height={size - 12}
                        fill="none"
                        stroke="#FFE600"
                        strokeWidth={6}
                        opacity={0.85}
                      >
                        <animate
                          attributeName="opacity"
                          values="0.35;0.95;0.35"
                          dur="1.1s"
                          repeatCount="indefinite"
                        />
                      </rect>
                    )}
                    <rect
                      x={x + 95}
                      y={y + 95}
                      width={size - 190}
                      height={size - 190}
                      rx={22}
                      fill="#FFFFFF"
                      stroke="#1E293B"
                      strokeWidth={2.5}
                    />
                    {YARD_SLOT_COORDS[color].map(([slotRow, slotCol], sIdx) => {
                      const cx = slotCol * CELL;
                      const cy = slotRow * CELL;
                      return (
                        <g key={`slot4p-${color}-${sIdx}`}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={44}
                            fill={f.primaryHex}
                            stroke="#1E293B"
                            strokeWidth={2.5}
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r={36}
                            fill="none"
                            stroke="rgba(255,255,255,0.45)"
                            strokeWidth={2}
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}

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
                      stroke="#334155"
                      strokeWidth={2}
                    />
                    {startColor && (
                      <CleanStar
                        cx={x + 50}
                        cy={y + 50}
                        outerR={28}
                        innerR={11.5}
                        fill="#FFFFFF"
                        stroke="#1E293B"
                      />
                    )}
                    {isStarSafe && (
                      <CleanStar
                        cx={x + 50}
                        cy={y + 50}
                        outerR={28}
                        innerR={11.5}
                        fill="#CBD5E1"
                        stroke="#334155"
                      />
                    )}
                    {/* Ludo King Home-Path Entrance Arrows */}
                    {uIdx === 50 && (
                      <polygon
                        points={`${x + 22},${y + 32} ${x + 78},${y + 50} ${x + 22},${y + 68}`}
                        fill={FACTIONS.red.primaryHex}
                      />
                    )}
                    {uIdx === 11 && (
                      <polygon
                        points={`${x + 32},${y + 22} ${x + 50},${y + 78} ${x + 68},${y + 22}`}
                        fill={FACTIONS.green.primaryHex}
                      />
                    )}
                    {uIdx === 24 && (
                      <polygon
                        points={`${x + 78},${y + 32} ${x + 22},${y + 50} ${x + 78},${y + 68}`}
                        fill={FACTIONS.yellow.primaryHex}
                      />
                    )}
                    {uIdx === 37 && (
                      <polygon
                        points={`${x + 32},${y + 78} ${x + 50},${y + 22} ${x + 68},${y + 78}`}
                        fill={FACTIONS.blue.primaryHex}
                      />
                    )}
                  </g>
                );
              })}

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
                    stroke="#475569"
                    strokeWidth={2}
                  />
                ));
              })}

              <g>
                <polygon
                  points="600,600 750,750 600,900"
                  fill={FACTIONS.red.primaryHex}
                  stroke="#334155"
                  strokeWidth={2}
                />
                <polygon
                  points="600,600 750,750 900,600"
                  fill={FACTIONS.green.primaryHex}
                  stroke="#334155"
                  strokeWidth={2}
                />
                <polygon
                  points="900,600 750,750 900,900"
                  fill={FACTIONS.yellow.primaryHex}
                  stroke="#334155"
                  strokeWidth={2}
                />
                <polygon
                  points="600,900 750,750 900,900"
                  fill={FACTIONS.blue.primaryHex}
                  stroke="#334155"
                  strokeWidth={2}
                />
                <rect
                  x={600}
                  y={600}
                  width={300}
                  height={300}
                  fill="none"
                  stroke="#334155"
                  strokeWidth={2.5}
                />
              </g>
            </>
          ) : (
            /* ===============================================================
             * 2. DISTINCT 5-PLAYER PENTAGONAL BOARD & 6-PLAYER HEXAGONAL BOARD
             *    - 5-Player: 5 Arms at 72°, 5 Wedge Yards, Central Pentagon
             *    - 6-Player: 6 Arms at 60°, 6 Wedge Yards, Central Hexagon
             * =============================================================== */
            <>
              {/* 1. N SEAMLESS TRIANGULAR WEDGE YARDS BETWEEN THE N ARMS */}
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
                const innerSlotR = radialGeom.numArms === 5 ? 23 : 20;

                return (
                  <g key={`yard-${boardType}-${color}`}>
                    <polygon
                      points={`${vInX},${vInY} ${vOut2X},${vOut2Y} ${vOut1X},${vOut1Y}`}
                      fill={f.primaryHex}
                      stroke="#334155"
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                    />

                    <rect
                      x={cx - boxHalf}
                      y={cy - boxHalf}
                      width={boxHalf * 2}
                      height={boxHalf * 2}
                      rx={22}
                      fill="#FFFFFF"
                      stroke="#334155"
                      strokeWidth={2}
                    />

                    {radialGeom.yardSlotCoords[color].map(([sr, sc], idx) => (
                      <g key={`slot-${boardType}-${color}-${idx}`}>
                        <circle
                          cx={sc * CELL}
                          cy={sr * CELL}
                          r={slotR}
                          fill={f.primaryHex}
                          stroke="#1E293B"
                          strokeWidth={2}
                        />
                        <circle
                          cx={sc * CELL}
                          cy={sr * CELL}
                          r={innerSlotR}
                          fill="none"
                          stroke="rgba(255,255,255,0.45)"
                          strokeWidth={1.8}
                        />
                      </g>
                    ))}
                  </g>
                );
              })}

              {/* 2. N RADIAL 3x6 TRACK ARMS */}
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
                    {[0, 1, 2, 3, 4, 5].map((rank) => {
                      const x = innerPx + rank * tilePx;
                      return (
                        <React.Fragment key={`rank-${rank}`}>
                          <rect
                            x={x}
                            y={-1.5 * tilePx}
                            width={tilePx}
                            height={tilePx}
                            fill="#FFFFFF"
                            stroke="#475569"
                            strokeWidth={1.8}
                          />
                          {rank === 4 && (
                            <CleanStar
                              cx={x + tilePx / 2}
                              cy={-tilePx}
                              outerR={20}
                              innerR={8}
                              fill="#E2E8F0"
                              stroke="#475569"
                            />
                          )}

                          <rect
                            x={x}
                            y={-0.5 * tilePx}
                            width={tilePx}
                            height={tilePx}
                            fill={rank < 5 ? f.primaryHex : '#FFFFFF'}
                            stroke="#475569"
                            strokeWidth={1.8}
                          />

                          <rect
                            x={x}
                            y={0.5 * tilePx}
                            width={tilePx}
                            height={tilePx}
                            fill={rank === 4 ? f.primaryHex : '#FFFFFF'}
                            stroke="#475569"
                            strokeWidth={1.8}
                          />
                          {rank === 4 && (
                            <CleanStar
                              cx={x + tilePx / 2}
                              cy={tilePx}
                              outerR={20}
                              innerR={8}
                              fill="#FFFFFF"
                              stroke="#334155"
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </g>
                );
              })}

              {/* 3. CENTRAL N-GON HOME TRIANGLES (PENTAGON FOR 5P, HEXAGON FOR 6P) */}
              <g transform="translate(750, 750)">
                {radialGeom.colors.map((color) => {
                  const f = FACTIONS[color];
                  const halfWedgeDeg = 180 / radialGeom.numArms; // 36° for 5P, 30° for 6P
                  const deg = radialGeom.armAnglesDeg[color];
                  const rad1 = ((deg - halfWedgeDeg) * Math.PI) / 180;
                  const rad2 = ((deg + halfWedgeDeg) * Math.PI) / 180;
                  const rVertex =
                    (radialGeom.innerRadius * CELL) /
                    Math.cos(Math.PI / radialGeom.numArms);
                  const x1 = rVertex * Math.cos(rad1);
                  const y1 = rVertex * Math.sin(rad1);
                  const x2 = rVertex * Math.cos(rad2);
                  const y2 = rVertex * Math.sin(rad2);

                  return (
                    <polygon
                      key={`center-tri-${boardType}-${color}`}
                      points={`0,0 ${x1},${y1} ${x2},${y2}`}
                      fill={f.primaryHex}
                      stroke="#334155"
                      strokeWidth={2}
                    />
                  );
                })}
              </g>
            </>
          )}

          {/* RENDER ALL PAWNS */}
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
        </svg>
      </div>
    </div>
  );
};
