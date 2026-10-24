import React, { useState } from 'react';
import {
  AIDifficulty,
  FACTIONS,
  FactionColor,
  GameMode,
  TURN_ORDER_5P,
  TURN_ORDER_6P,
} from '../engine/ludoEngine';
import { soundEngine } from '../audio/soundEngine';
import { X, Users, Bot, Play } from 'lucide-react';

export interface SlotSetupConfig {
  color: FactionColor;
  name: string;
  isAI: boolean;
  aiDifficulty: AIDifficulty;
  active: boolean;
}

interface MatchSetupModalProps {
  initialMode: GameMode;
  initialSlots: SlotSetupConfig[];
  onStartMatch: (mode: GameMode, slots: SlotSetupConfig[]) => void;
  onClose: () => void;
}

const DEFAULT_SLOT_LABELS: Record<FactionColor, string> = {
  blue: 'Player 1',
  red: 'Player 2',
  green: 'Player 3',
  yellow: 'Player 4',
  purple: 'Player 5',
  orange: 'Player 6',
};

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  initialMode,
  initialSlots,
  onStartMatch,
  onClose,
}) => {
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [slots, setSlots] = useState<SlotSetupConfig[]>(() => {
    return TURN_ORDER_6P.map((c) => {
      const found = initialSlots.find((s) => s.color === c);
      return (
        found ?? {
          color: c,
          name: DEFAULT_SLOT_LABELS[c],
          isAI: c !== 'blue',
          aiDifficulty: 'hard' as AIDifficulty,
          active: false,
        }
      );
    });
  });

  const activeCount = slots.filter((s) => s.active).length;

  const setQuickPlayerCount = (count: 2 | 3 | 4 | 5 | 6, allHuman: boolean = false) => {
    soundEngine.playClick();
    setSlots((prev) =>
      TURN_ORDER_6P.map((c) => {
        const existing = prev.find((p) => p.color === c);
        let active = false;
        if (count === 2) {
          active = c === 'blue' || c === 'green';
        } else if (count === 3) {
          active = c === 'blue' || c === 'red' || c === 'green';
        } else if (count === 4) {
          active = c === 'blue' || c === 'red' || c === 'green' || c === 'yellow';
        } else if (count === 5) {
          active = TURN_ORDER_5P.includes(c);
        } else {
          active = true;
        }

        const isHuman = allHuman ? true : c === 'blue';
        return {
          color: c,
          name: existing?.name || DEFAULT_SLOT_LABELS[c],
          isAI: !isHuman,
          aiDifficulty: 'hard',
          active,
        };
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 text-white bg-[#0B2854] border-4 border-[#FFCB05] shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <h2 className="text-xl font-black uppercase text-[#FFCB05]">
            SELECT PLAYERS & MODE (2 TO 6 PLAYERS)
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#ED1C24] border-2 border-white flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Player Count Selector: 2P, 3P, 4P, 5P, 6P */}
        <div className="mt-4">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-white mb-2">
            Quick Player Count (Vs Computer or Pass N Play)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {([2, 3, 4, 5, 6] as const).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuickPlayerCount(num, false)}
                className={`py-2.5 rounded-xl border-2 font-black text-xs sm:text-sm uppercase transition ${
                  activeCount === num
                    ? 'bg-[#00A651] text-white border-[#FFCB05] shadow-lg'
                    : 'bg-[#061836] text-slate-300 border-white/20 hover:border-white'
                }`}
              >
                {num} Players
              </button>
            ))}
          </div>
        </div>

        {/* Game Mode */}
        <div className="mt-4">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-white mb-2">
            Game Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'classic' as GameMode, title: 'Classic', desc: 'All 4 pieces Home' },
                { id: 'quick' as GameMode, title: 'Quick Mode', desc: '2 pieces Home' },
                { id: 'master' as GameMode, title: 'Master', desc: 'Safe pairs block' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`p-2.5 rounded-xl border-2 text-left transition ${
                  mode === m.id
                    ? 'bg-[#FFCB05] text-slate-950 border-white font-black'
                    : 'bg-[#061836] text-slate-200 border-white/20'
                }`}
              >
                <div className="text-xs font-black uppercase">{m.title}</div>
                <p
                  className={`text-[10px] mt-0.5 ${
                    mode === m.id ? 'text-slate-900 font-bold' : 'text-slate-400'
                  }`}
                >
                  {m.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 6 Player Slots */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {TURN_ORDER_6P.map((color) => {
            const slot = slots.find((s) => s.color === color)!;
            const f = FACTIONS[color];

            const updateSlot = (patch: Partial<SlotSetupConfig>) => {
              setSlots((prev) =>
                prev.map((item) => (item.color === color ? { ...item, ...patch } : item))
              );
            };

            return (
              <div
                key={color}
                className={`p-3 rounded-2xl border-2 transition ${
                  slot.active ? 'bg-[#061836]' : 'bg-black/30 opacity-45'
                }`}
                style={{ borderColor: slot.active ? f.primaryHex : 'rgba(255,255,255,0.15)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full border-2 border-white"
                      style={{ background: f.primaryHex }}
                    />
                    <span className="font-extrabold text-xs uppercase">{f.name}</span>
                  </div>
                  <button
                    type="button"
                    disabled={slot.active && activeCount <= 2}
                    onClick={() => updateSlot({ active: !slot.active })}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      slot.active ? 'bg-[#00A651] text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {slot.active ? 'ON' : 'OFF'}
                  </button>
                </div>

                {slot.active && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={slot.name}
                      onChange={(e) => updateSlot({ name: e.target.value })}
                      maxLength={14}
                      className="w-full px-2.5 py-1 rounded-lg bg-black/50 border border-white/20 text-xs font-bold text-white"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateSlot({ isAI: false })}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 ${
                          !slot.isAI ? 'bg-[#FFCB05] text-slate-950' : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        <Users className="w-3 h-3" /> Human
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSlot({ isAI: true })}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 ${
                          slot.isAI ? 'bg-[#0072BC] text-white' : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        <Bot className="w-3 h-3" /> Bot
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              onStartMatch(mode, slots);
              onClose();
            }}
            className="px-6 py-2.5 rounded-2xl bg-[#00A651] hover:bg-[#00c05e] border-2 border-[#FFCB05] text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" /> Start ({activeCount} Players)
          </button>
        </div>
      </div>
    </div>
  );
};
