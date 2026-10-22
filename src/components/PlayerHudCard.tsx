import React from 'react';
import {
  BoardType,
  EmoteEvent,
  FACTIONS,
  GameMode,
  PlayerState,
  getHomeStep,
  getTargetCitadelCount,
} from '../engine/ludoEngine';
import { Bot, User } from 'lucide-react';
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

export const PlayerHudCard: React.FC<PlayerHudCardProps> = ({
  player,
  mode,
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
  const faction = FACTIONS[player.color];
  const targetHome = getTargetCitadelCount(mode);
  const homeStep = getHomeStep(boardType);
  const homeCount = player.tokens.filter((t) => t.step === homeStep).length;
  const isCompact3Col = boardType === 'pent5p' || boardType === 'hex6p';

  if (!player.active) {
    return <div className="h-[58px] opacity-0 pointer-events-none" />;
  }

  return (
    <div
      onClick={() => {
        if (isCurrentTurn && canHumanRoll && turnPhase === 'ROLL' && !diceRolling) {
          onRollDice();
        }
      }}
      className={`relative flex items-center justify-between ${
        isCompact3Col ? 'gap-1 px-1.5 py-1 rounded-xl' : 'gap-2 px-2.5 py-1.5 rounded-2xl'
      } transition-all duration-200 select-none ${
        align === 'right' ? 'flex-row-reverse' : 'flex-row'
      } ${
        isCurrentTurn && canHumanRoll
          ? 'cursor-pointer active:scale-95'
          : ''
      } ${isCurrentTurn ? 'z-20 scale-[1.02]' : 'opacity-90'}`}
      style={{
        background: `linear-gradient(180deg, ${faction.lightHex} 0%, ${faction.primaryHex} 38%, ${faction.darkHex} 100%)`,
        border: isCurrentTurn ? '3px solid #FFE600' : '2px solid #D4AF37',
        animation: isCurrentTurn ? 'goldPulse 1.4s infinite ease-in-out' : 'none',
        boxShadow: isCurrentTurn
          ? '0 0 18px rgba(255, 230, 0, 0.85), inset 0 2px 3px rgba(255,255,255,0.45), 0 5px 12px rgba(0,0,0,0.55)'
          : 'inset 0 1px 2px rgba(255,255,255,0.3), 0 3px 8px rgba(0,0,0,0.45)',
      }}
    >
      {/* Floating Emote Bubble */}
      {activeEmote && (
        <div
          className={`absolute -top-9 ${
            align === 'right' ? 'right-1' : 'left-1'
          } z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-slate-950 border-2 border-[#111111] shadow-xl animate-bounce`}
        >
          <span className="text-sm leading-none">{activeEmote.emote}</span>
          {activeEmote.message && (
            <span className="text-[10px] font-black uppercase">{activeEmote.message}</span>
          )}
        </div>
      )}

      {/* Chamber 1: Ludo King Gold-Framed Avatar + Player Name + Pawn Dots */}
      <div
        className={`flex items-center ${isCompact3Col ? 'gap-1' : 'gap-2'} min-w-0 ${
          align === 'right' ? 'flex-row-reverse text-right' : 'flex-row text-left'
        }`}
      >
        <div
          className={`relative ${
            isCompact3Col ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl'
          } flex items-center justify-center shrink-0 shadow-md`}
          style={{
            background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
            border: isCurrentTurn ? '2px solid #FFE600' : '1.5px solid #FDE047',
          }}
        >
          {player.isAI ? (
            <Bot className={isCompact3Col ? 'w-4 h-4 text-amber-300' : 'w-5 h-5 sm:w-6 sm:h-6 text-amber-300'} />
          ) : (
            <User className={isCompact3Col ? 'w-4 h-4 text-white' : 'w-5 h-5 sm:w-6 sm:h-6 text-white'} />
          )}

          {isCurrentTurn && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00E676] border border-slate-950 animate-ping" />
          )}
        </div>

        <div className="min-w-0">
          <div
            className={`${
              isCompact3Col ? 'text-[10px]' : 'text-[11px] sm:text-xs'
            } font-black text-white truncate drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.85)] leading-tight`}
          >
            {player.name}
          </div>

          {/* 4 Mini Pawn Progress Dots */}
          <div
            className={`flex items-center gap-0.5 mt-0.5 ${
              align === 'right' ? 'justify-end' : 'justify-start'
            }`}
          >
            {[0, 1, 2, 3].map((i) => {
              const tok = player.tokens[i];
              const isHome = tok && tok.step === homeStep;
              const isOut = tok && tok.step >= 0 && tok.step < homeStep;
              return (
                <span
                  key={i}
                  className={`${
                    isCompact3Col ? 'w-1.5 h-1.5' : 'w-2 h-2 sm:w-2.5 sm:h-2.5'
                  } rounded-full border border-black/60`}
                  style={{
                    background: isHome
                      ? '#FFE600'
                      : isOut
                      ? '#FFFFFF'
                      : 'rgba(0,0,0,0.45)',
                  }}
                />
              );
            })}
            {homeCount > 0 && !isCompact3Col && (
              <span className="text-[9px] font-black text-[#FFE600] ml-0.5 drop-shadow">
                {homeCount}/{targetHome}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chamber 2: Ludo King Recessed Dice Socket (Dice ONLY appears in active player's socket) */}
      <div className="relative flex items-center gap-1 shrink-0">
        {isCurrentTurn && canHumanRoll && turnPhase === 'ROLL' && !diceRolling && !isCompact3Col && (
          <div
            className={`flex items-center text-[#FFE600] font-black text-[9px] animate-bounce ${
              align === 'right' ? 'order-2' : 'order-1'
            }`}
          >
            <span className="px-1.5 py-0.5 rounded-md bg-black/80 border border-[#FFE600] text-[8px] uppercase tracking-wider shadow">
              ROLL
            </span>
          </div>
        )}

        <div
          className={`${
            isCompact3Col ? 'w-[42px] h-[42px] rounded-lg' : 'w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-xl'
          } flex items-center justify-center p-0.5 transition-all`}
          style={{
            background: isCurrentTurn
              ? 'linear-gradient(180deg, #09152B 0%, #162C52 100%)'
              : 'rgba(0, 0, 0, 0.32)',
            border: isCurrentTurn
              ? '2px solid #FFE600'
              : '1.5px solid rgba(255, 255, 255, 0.25)',
            boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.65)',
          }}
        >
          {isCurrentTurn ? (
            <TactileDice3D
              value={diceValue}
              rolling={diceRolling}
              canRoll={canHumanRoll}
              activeColor={player.color}
              size="sm"
              onRoll={onRollDice}
            />
          ) : (
            <div className="w-6 h-6 rounded-md border border-white/10 bg-black/25 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
