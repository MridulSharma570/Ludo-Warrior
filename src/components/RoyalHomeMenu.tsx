import React, { useEffect, useState } from 'react';
import {
  AIDifficulty,
  BoardThemeId,
  FACTIONS,
  FactionColor,
  GameMode,
  TURN_ORDER_4P,
  TURN_ORDER_5P,
  TURN_ORDER_6P,
} from '../engine/ludoEngine';
import { WarriorProfile } from '../store/warriorProfile';
import { soundEngine } from '../audio/soundEngine';
import {
  Crown,
  Globe,
  Users,
  Bot,
  Gamepad2,
  Volume2,
  VolumeX,
  Smartphone,
  Maximize2,
  Coins,
  Gem,
  Play,
  X,
  Check,
} from 'lucide-react';
import { SlotSetupConfig } from './MatchSetupModal';

interface RoyalHomeMenuProps {
  profile: WarriorProfile;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  musicEnabled: boolean;
  onlineConnected: boolean;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  onChangeName: (name: string) => void;
  onChangeTheme: (theme: BoardThemeId) => void;
  onStartLocalMatch: (mode: GameMode, slots: SlotSetupConfig[]) => void;
  onOpenOnlineLobby: (initialTab: 'quick' | 'friends') => void;
}

export const RoyalHomeMenu: React.FC<RoyalHomeMenuProps> = ({
  profile,
  soundEnabled,
  hapticsEnabled,
  onlineConnected,
  onToggleSound,
  onToggleHaptics,
  onToggleFullscreen,
  onChangeName,
  onStartLocalMatch,
  onOpenOnlineLobby,
}) => {
  const [setupType, setSetupType] = useState<'computer' | 'pass_play' | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4 | 5 | 6>(4);
  const [chosenColor, setChosenColor] = useState<FactionColor>('blue');
  const [aiDifficulty] = useState<AIDifficulty>('hard');
  const [passNames, setPassNames] = useState<Record<FactionColor, string>>({
    blue: 'Player 1',
    red: 'Player 2',
    green: 'Player 3',
    yellow: 'Player 4',
    purple: 'Player 5',
    orange: 'Player 6',
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallOrDownload = async () => {
    soundEngine.playClick();
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      try {
        await deferredInstallPrompt.userChoice;
      } catch {
        // ignore
      }
      setDeferredInstallPrompt(null);
      return;
    }
    window.open('https://github.com/MridulSharma570/Ludo-Warrior/releases/latest', '_blank', 'noopener,noreferrer');
  };

  const availableColors =
    playerCount === 5
      ? TURN_ORDER_5P
      : playerCount === 6
      ? TURN_ORDER_6P
      : TURN_ORDER_4P;

  const handleLaunchConfiguredMatch = () => {
    soundEngine.playModeStart();
    if (setupType === 'computer') {
      const order = availableColors;
      const validHumanColor = order.includes(chosenColor) ? chosenColor : 'red';

      const slots: SlotSetupConfig[] = TURN_ORDER_6P.map((c) => {
        const idxInOrder = order.indexOf(c);
        const isHuman = c === validHumanColor;
        let isActive = false;

        if (playerCount === 2) {
          const opp = FACTIONS[validHumanColor].oppositeColor4P;
          isActive = c === validHumanColor || c === opp;
        } else {
          isActive = idxInOrder !== -1 && idxInOrder < playerCount;
          if (isHuman) isActive = true;
        }

        return {
          color: c,
          name:
            isHuman && profile.commanderName !== 'You'
              ? profile.commanderName
              : passNames[c],
          isAI: !isHuman,
          aiDifficulty,
          active: isActive,
        };
      });

      onStartLocalMatch(selectedMode, slots);
      setSetupType(null);
    } else if (setupType === 'pass_play') {
      const order = availableColors;
      const slots: SlotSetupConfig[] = TURN_ORDER_6P.map((c, idx) => {
        const idxInOrder = order.indexOf(c);
        let isActive = false;
        if (playerCount === 2) {
          isActive = c === 'red' || c === 'yellow';
        } else {
          isActive = idxInOrder !== -1 && idxInOrder < playerCount;
        }
        return {
          color: c,
          name: passNames[c] || `Player ${idx + 1}`,
          isAI: false,
          aiDifficulty: 'hard',
          active: isActive,
        };
      });
      onStartLocalMatch(selectedMode, slots);
      setSetupType(null);
    }
  };

  return (
    <div
      className="h-[100dvh] w-full flex flex-col justify-between relative overflow-hidden select-none text-white android-safe-top android-safe-bottom"
      style={{
        backgroundColor: '#0A2558',
        backgroundImage: `
          radial-gradient(circle at 50% 38%, rgba(28, 92, 197, 0.58) 0%, rgba(7, 24, 61, 0.94) 76%),
          repeating-linear-gradient(45deg, rgba(255, 215, 0, 0.04) 0px, rgba(255, 215, 0, 0.04) 2px, transparent 2px, transparent 28px),
          repeating-linear-gradient(-45deg, rgba(255, 215, 0, 0.04) 0px, rgba(255, 215, 0, 0.04) 2px, transparent 2px, transparent 28px)
        `,
      }}
    >
      {/* Android Mobile Top Player Profile & Currency Bar */}
      <header className="relative z-10 w-full max-w-md mx-auto px-3 pt-2 pb-1 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setEditingProfile(!editingProfile);
          }}
          className="android-btn-press flex items-center gap-2 bg-[#0A224A] px-2.5 py-1.5 rounded-2xl border-2 border-[#FFCB05] shadow-lg min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#FFE600] to-[#F59E0B] flex items-center justify-center shrink-0 border border-white">
            <Crown className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs sm:text-sm font-black text-white truncate leading-tight">
              {profile.commanderName}
            </div>
            <div className="text-[10px] text-[#FFCB05] font-extrabold">
              Lv.{profile.level} • {profile.matchesWon} Wins
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0A224A] border-2 border-[#FFCB05] shadow">
            <Coins className="w-3.5 h-3.5 text-[#FFCB05]" />
            <span className="font-extrabold text-xs text-[#FFCB05] font-mono">
              {profile.coins.toLocaleString()}
            </span>
          </div>

          <div className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-full bg-[#0A224A] border-2 border-[#29ABE2]">
            <Gem className="w-3.5 h-3.5 text-[#29ABE2]" />
            <span className="font-extrabold text-xs text-white font-mono">
              {profile.diamonds}
            </span>
          </div>

          {/* Android Haptics Vibration Toggle */}
          <button
            type="button"
            onClick={onToggleHaptics}
            className={`android-btn-press w-9 h-9 rounded-full border-2 border-white flex items-center justify-center shadow-lg ${
              hapticsEnabled ? 'bg-[#00A651] text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title={hapticsEnabled ? 'Android Vibration ON' : 'Android Vibration OFF'}
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle for Android Phones */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="android-btn-press w-9 h-9 rounded-full bg-[#0072BC] border-2 border-white flex items-center justify-center text-white shadow-lg"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Sound SFX Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className="android-btn-press w-9 h-9 rounded-full bg-[#FFCB05] border-2 border-white flex items-center justify-center text-slate-950 shadow-lg"
            title={soundEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {editingProfile && (
        <div className="relative z-20 max-w-xs mx-auto bg-[#0A224A] border-2 border-[#FFCB05] rounded-2xl p-2.5 flex items-center gap-2 shadow-2xl">
          <input
            type="text"
            value={profile.commanderName}
            onChange={(e) => onChangeName(e.target.value)}
            maxLength={16}
            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/25 text-xs font-bold text-white"
          />
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setEditingProfile(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#FFCB05] text-slate-950 font-black text-xs"
          >
            Save
          </button>
        </div>
      )}

      {/* Center Ludo King Style Crest & 4 Big Android Thumb-Friendly Mode Buttons */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2 max-w-md mx-auto w-full">
        <div className="flex flex-col items-center text-center mb-5">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mb-2 shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, #FFF066 0%, #FFCB05 55%, #D97706 100%)',
              border: '3px solid #FFFFFF',
            }}
          >
            <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-slate-950 fill-slate-950" />
          </div>
          <h1
            className="text-3xl sm:text-5xl font-black tracking-wider uppercase text-[#FFCB05] drop-shadow-[0_4px_0_#000000]"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            LUDO WARRIOR
          </h1>
          <div className="mt-1 px-3 py-0.5 rounded-full bg-black/35 border border-[#FFCB05]/40 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-[#FFE600]">
            2, 3, 4, 5 & 6 Players • Ad-Free Mobile Edition
          </div>
        </div>

        {/* 4 Iconic Ludo King 3D Mode Buttons */}
        <div className="grid grid-cols-2 gap-3.5 w-full">
          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuSelect();
              onOpenOnlineLobby('quick');
            }}
            className="android-btn-press rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#29ABE2] via-[#0072BC] to-[#00548B] border-[3.5px] border-[#FFCB05] shadow-[0_7px_0_#003B64,0_12px_20px_rgba(0,0,0,0.45)]"
          >
            <div className="w-12 h-12 rounded-2xl bg-black/25 border border-white/30 flex items-center justify-center mb-2">
              <Globe className="w-7 h-7 text-[#FFE600]" />
            </div>
            <span className="text-sm sm:text-base font-black uppercase text-white drop-shadow">
              Play Online
            </span>
            <span className="text-[10px] font-bold text-sky-100 mt-0.5">
              {onlineConnected ? '● Live Multiplayer' : 'Worldwide Match'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuSelect();
              onOpenOnlineLobby('friends');
            }}
            className="android-btn-press rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#22C55E] via-[#00A651] to-[#007A3B] border-[3.5px] border-[#FFCB05] shadow-[0_7px_0_#00592B,0_12px_20px_rgba(0,0,0,0.45)]"
          >
            <div className="w-12 h-12 rounded-2xl bg-black/25 border border-white/30 flex items-center justify-center mb-2">
              <Users className="w-7 h-7 text-[#FFE600]" />
            </div>
            <span className="text-sm sm:text-base font-black uppercase text-white drop-shadow">
              Play With Friends
            </span>
            <span className="text-[10px] font-bold text-emerald-100 mt-0.5">
              Private Room Code
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuSelect();
              setSetupType('computer');
              setPlayerCount(4);
            }}
            className="android-btn-press rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#FBBF24] via-[#F7941D] to-[#C25E00] border-[3.5px] border-[#FFCB05] shadow-[0_7px_0_#8A4200,0_12px_20px_rgba(0,0,0,0.45)]"
          >
            <div className="w-12 h-12 rounded-2xl bg-black/25 border border-white/30 flex items-center justify-center mb-2">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <span className="text-sm sm:text-base font-black uppercase text-white drop-shadow">
              Vs Computer
            </span>
            <span className="text-[10px] font-bold text-amber-100 mt-0.5">
              2, 3, 4, 5 or 6 Players
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuSelect();
              setSetupType('pass_play');
              setPlayerCount(4);
            }}
            className="android-btn-press rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#F87171] via-[#ED1C24] to-[#B91C1C] border-[3.5px] border-[#FFCB05] shadow-[0_7px_0_#7F1D1D,0_12px_20px_rgba(0,0,0,0.45)]"
          >
            <div className="w-12 h-12 rounded-2xl bg-black/25 border border-white/30 flex items-center justify-center mb-2">
              <Gamepad2 className="w-7 h-7 text-[#FFE600]" />
            </div>
            <span className="text-sm sm:text-base font-black uppercase text-white drop-shadow">
              Pass N Play
            </span>
            <span className="text-[10px] font-bold text-rose-100 mt-0.5">
              2, 3, 4, 5 or 6 Players
            </span>
          </button>
        </div>
      </main>

      <footer className="relative z-10 flex flex-col items-center gap-1 pb-2 text-[11px] text-sky-200/80 font-bold">
        <button
          type="button"
          onClick={handleInstallOrDownload}
          className="android-btn-press inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0A224A] border border-[#FFCB05] text-[#FFCB05] text-[11px] font-black uppercase tracking-wider shadow"
        >
          ⬇ {deferredInstallPrompt ? 'Install App to Device' : 'Download / Install App (Android, PC & Web)'}
        </button>
        <span>4P Square • 5P Pentagonal • 6P Hexagonal Boards</span>
      </footer>

      {/* Android-Optimized Setup Modal for Computer / Pass N Play */}
      {setupType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3">
          <div className="w-full max-w-md rounded-3xl p-5 text-white bg-[#0B2854] border-4 border-[#FFCB05] shadow-2xl relative max-h-[90dvh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setSetupType(null);
              }}
              className="android-btn-press absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-[#ED1C24] border-2 border-white flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black text-center uppercase text-[#FFCB05] mb-3">
              {setupType === 'computer' ? 'VS COMPUTER' : 'PASS N PLAY'}
            </h2>

            {/* 1. Number of Players: 2, 3, 4, 5, 6 */}
            <div className="mb-3.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-sky-200 mb-1.5 text-center">
                Select Players (4P Square • 5P Pentagon • 6P Hexagon)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {([2, 3, 4, 5, 6] as const).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setPlayerCount(num);
                    }}
                    className={`android-btn-press py-2.5 rounded-xl border-2 font-black text-sm uppercase transition ${
                      playerCount === num
                        ? 'bg-[#00A651] text-white border-[#FFCB05] shadow-md scale-105'
                        : 'bg-[#061836] text-slate-300 border-white/20'
                    }`}
                  >
                    {num}P
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Game Mode */}
            <div className="mb-3.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-sky-200 mb-1.5 text-center">
                Select Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedMode('classic');
                  }}
                  className={`android-btn-press p-2.5 rounded-xl border-2 text-center ${
                    selectedMode === 'classic'
                      ? 'bg-[#FFCB05] text-slate-950 border-white font-black'
                      : 'bg-[#061836] text-slate-200 border-white/20'
                  }`}
                >
                  <div className="text-xs font-black uppercase">Classic</div>
                  <div className="text-[10px]">All 4 Pieces Home</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedMode('quick');
                  }}
                  className={`android-btn-press p-2.5 rounded-xl border-2 text-center ${
                    selectedMode === 'quick'
                      ? 'bg-[#FFCB05] text-slate-950 border-white font-black'
                      : 'bg-[#061836] text-slate-200 border-white/20'
                  }`}
                >
                  <div className="text-xs font-black uppercase">Quick Mode</div>
                  <div className="text-[10px]">2 Pieces Home</div>
                </button>
              </div>
            </div>

            {/* 3. Choose Color or Player Names */}
            {setupType === 'computer' ? (
              <div className="mb-4">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-sky-200 mb-1.5 text-center">
                  Choose Your Piece Color
                </label>
                <div
                  className={`grid ${
                    availableColors.length >= 5 ? 'grid-cols-3' : 'grid-cols-4'
                  } gap-2`}
                >
                  {availableColors.map((c) => {
                    const f = FACTIONS[c];
                    const selected = chosenColor === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setChosenColor(c);
                        }}
                        className={`android-btn-press p-2 rounded-xl border-2 flex flex-col items-center gap-1 transition ${
                          selected
                            ? 'bg-white/20 border-[#FFCB05] scale-105'
                            : 'bg-[#061836] border-white/15 opacity-80'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center"
                          style={{ background: f.primaryHex }}
                        >
                          {selected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </div>
                        <span className="text-[10px] font-extrabold uppercase">{f.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-4 space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-sky-200 mb-1 text-center">
                  Player Names
                </label>
                {availableColors
                  .filter((c, i) =>
                    playerCount === 2 ? c === 'red' || c === 'yellow' : i < playerCount
                  )
                  .map((c) => {
                    const f = FACTIONS[c];
                    return (
                      <div key={c} className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-full border-2 border-white shrink-0"
                          style={{ background: f.primaryHex }}
                        />
                        <input
                          type="text"
                          value={passNames[c]}
                          onChange={(e) =>
                            setPassNames((prev) => ({ ...prev, [c]: e.target.value }))
                          }
                          maxLength={16}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-[#061836] border border-white/25 text-xs font-bold text-white"
                        />
                      </div>
                    );
                  })}
              </div>
            )}

            <button
              type="button"
              onClick={handleLaunchConfiguredMatch}
              className="android-btn-press w-full py-3 rounded-2xl bg-[#00A651] text-white font-black text-base uppercase tracking-wider border-3 border-[#FFCB05] shadow-[0_5px_0_#00592B] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              PLAY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
