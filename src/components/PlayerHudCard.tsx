import React from 'react';
import {
  BoardType,
  EmoteEvent,
  FACTIONS,
  FactionColor,
  GameMode,
  PlayerState,
} from '../engine/ludoEngine';
import { TactileDice3D } from './TactileDice3D';

interface PlayerHudCardProps {
  player: PlayerState;
  mode: GameMode;
  boardType?: BoardType;
  isCurrentTurn: boolean;
  turnPhase: 'ROLL' | 'MOVE' | 'GAME_OVER';
  diceValue: number | null;
  diceRolling: boolean;
  canHumanRoll: boolean;
  activeEmote?: EmoteEvent;
  align?: 'left' | 'right';
  onRollDice: () => void;
}

/**
 * Mini Ludo King Pawn Icon inside the Blue Wing of the Dice Pod (Exact match to Image 2)
 */
const MiniPodPawnIcon: React.FC<{ color: FactionColor; compact?: boolean }> = ({
  color,
  compact = false,
}) => {
  const f = FACTIONS[color];
  return (
    <svg
      viewBox="-38 -90 76 102"
      className={compact ? 'w-7 h-9 drop-shadow-md' : 'w-9 h-11 drop-shadow-md'}
    >
      <defs>
        <linearGradient id={`podPin-${color}`} x1="15%" y1="5%" x2="85%" y2="95%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <radialGradient id={`podCore-${color}`} cx="38%" cy="35%" r="68%">
          <stop offset="0%" stopColor={f.lightHex} />
          <stop offset="55%" stopColor={f.primaryHex} />
          <stop offset="100%" stopColor={f.darkHex} />
        </radialGradient>
      </defs>
      <path
        d="M 0,6 C -14,-11 -33,-30 -33,-50 A 33,33 0 1,1 33,-50 C 33,-30 14,-11 0,6 Z"
        fill={`url(#podPin-${color})`}
        stroke="#1E293B"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <circle cx="0" cy="-51" r="20.5" fill="#1B1B1B" />
      <circle cx="1" cy="-49.5" r="19.5" fill={`url(#podCore-${color})`} />
      <path
        d="M -15,-62 A 19.5,19.5 0 0,1 16,-60 A 19,17 0 0,0 -14,-44 Z"
        fill="rgba(0, 0, 0, 0.28)"
      />
    </svg>
  );
};

/**
 * Bouncing 3D Golden-Orange Turn Arrow pointing at the Active Dice Tray (Exact match to Image 2)
 */
const GoldenTurnArrow: React.FC<{ pointDir: 'left' | 'right' }> = ({ pointDir }) => {
  return (
    <div
      className="flex items-center justify-center shrink-0 pointer-events-none"
      style={{
        animation:
          pointDir === 'left'
            ? 'arrowBounceLeft 0.65s infinite ease-in-out'
            : 'arrowBounceRight 0.65s infinite ease-in-out',
      }}
    >
      <svg
        viewBox="0 0 56 54"
        className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-[0_3px_4px_rgba(0,0,0,0.65)]"
        style={{
          transform: pointDir === 'right' ? 'scaleX(-1)' : 'none',
        }}
      >
        <defs>
          <linearGradient id="lkGoldArrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF04D" />
            <stop offset="48%" stopColor="#FFB300" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>
        </defs>
        <polygon
          points="4,27 28,5 28,16 50,16 50,38 28,38 28,49"
          fill="url(#lkGoldArrowGrad)"
          stroke="#4A2500"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <polygon
          points="8,27 26,10 26,18 47,18 47,26"
          fill="rgba(255, 255, 255, 0.35)"
        />
      </svg>
    </div>
  );
};

export const PlayerHudCard: React.FC<PlayerHudCardProps> = ({
  player,
  boardType = 'square4p',
  isCurrentTurn,
  turnPhase,
  diceValue,
  diceRolling,
  canHumanRoll,
  activeEmote,
  align = 'left',
  onRollDice,
}) => {
  const isCompact3Col = boardType === 'pent5p' || boardType === 'hex6p';

  return (
    <div
      className={`relative flex items-center ${
        align === 'right' ? 'flex-row-reverse justify-start' : 'flex-row justify-start'
      } gap-1.5 select-none ${!player.active ? 'opacity-40 pointer-events-none' : ''}`}
    >
      {/* Floating Emote Bubble */}
      {activeEmote && (
        <div
          className={`absolute -top-9 ${
            align === 'right' ? 'right-1' : 'left-1'
          } z-30 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-slate-950 border-2 border-[#111111] shadow-xl animate-bounce`}
        >
          <span className="text-sm leading-none">{activeEmote.emote}</span>
          {activeEmote.message && (
            <span className="text-[10px] font-black uppercase">{activeEmote.message}</span>
          )}
        </div>
      )}

      {/* Stepped Ludo King Pod: Outer Blue Wing (with Mini Pawn) + Inner Square Pink-Silver Dice Tray */}
      <div
        onClick={() => {
          if (isCurrentTurn && canHumanRoll && turnPhase === 'ROLL' && !diceRolling) {
            onRollDice();
          }
        }}
        className={`relative flex items-center ${
          align === 'right' ? 'flex-row-reverse' : 'flex-row'
        } ${
          isCurrentTurn && canHumanRoll ? 'cursor-pointer active:scale-95' : ''
        } transition-transform`}
      >
        {/* 1. Outer Royal Blue Pawn Wing */}
        <div
          className={`flex items-center justify-center ${
            isCompact3Col ? 'w-[38px] h-[48px]' : 'w-[48px] h-[56px] sm:w-[54px] sm:h-[60px]'
          } ${
            align === 'right'
              ? 'rounded-r-lg border-l-0 -ml-1'
              : 'rounded-l-lg border-r-0 -mr-1'
          }`}
          style={{
            background: 'linear-gradient(180deg, #0D5DB8 0%, #073B82 55%, #042252 100%)',
            border: '2.5px solid #F2D03B',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
          }}
        >
          <MiniPodPawnIcon color={player.color} compact={isCompact3Col} />
        </div>

        {/* 2. Inner Stepped Square Pink-Silver Dice Tray (Exact Ludo King Style) */}
        <div
          className={`relative z-10 flex items-center justify-center ${
            isCompact3Col
              ? 'w-[54px] h-[54px] rounded-xl'
              : 'w-[66px] h-[66px] sm:w-[70px] sm:h-[70px] rounded-xl'
          }`}
          style={{
            background: '#CED872',
            padding: '4px',
            boxShadow: isCurrentTurn
              ? '0 0 14px rgba(255, 230, 0, 0.65), 0 4px 10px rgba(0,0,0,0.55)'
              : '0 4px 10px rgba(0,0,0,0.45)',
          }}
        >
          <div
            className="w-full h-full rounded-[8px] flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, #D59B9B 0%, #EBC8C8 48%, #FAF0F0 100%)',
              border: '1.5px solid #6E5A5A',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.22)',
            }}
          >
            {isCurrentTurn ? (
              <TactileDice3D
                value={diceValue}
                rolling={diceRolling}
                canRoll={canHumanRoll}
                activeColor={player.color}
                size={isCompact3Col ? 'sm' : 'md'}
                onRoll={onRollDice}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* 3. Bouncing 3D Golden-Orange Arrow pointing at Active Player's Dice Tray */}
      {isCurrentTurn && !isCompact3Col && (
        <GoldenTurnArrow pointDir={align === 'right' ? 'right' : 'left'} />
      )}
    </div>
  );
};
