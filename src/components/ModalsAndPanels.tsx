import React, { useState } from 'react';
import {
  FACTIONS,
  FactionColor,
  GameMode,
  GameState,
  TURN_ORDER,
} from '../engine/ludoEngine';
import {
  X,
  Crown,
  Copy,
  Check,
  Globe,
  Coins,
  Gem,
  Trophy,
  Play,
  Users,
  BookOpen,
} from 'lucide-react';

export interface OnlineRoomSummary {
  roomId: string;
  mode: GameMode;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
}

interface OnlineLobbyModalProps {
  connected: boolean;
  currentRoomId: string | null;
  myOnlineColor: FactionColor | null;
  publicRooms: OnlineRoomSummary[];
  gameState: GameState;
  commanderName: string;
  selectedMode: GameMode;
  onChangeCommanderName: (name: string) => void;
  onChangeMode: (mode: GameMode) => void;
  onCreateRoom: (isPublic: boolean) => void;
  onJoinRoom: (roomId: string) => void;
  onQuickMatch: () => void;
  onStartOnlineWithBots: () => void;
  onLeaveOnlineRoom: () => void;
  onClose: () => void;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  connected,
  currentRoomId,
  myOnlineColor,
  publicRooms,
  gameState,
  commanderName,
  selectedMode,
  onChangeCommanderName,
  onChangeMode,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onStartOnlineWithBots,
  onLeaveOnlineRoom,
  onClose,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!currentRoomId) return;
    navigator.clipboard.writeText(currentRoomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl p-6 text-white shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #1E3A8A 0%, #0F172A 100%)',
          border: '3px solid #FACC15',
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className="text-xl font-black tracking-wide text-amber-300"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  ONLINE MULTIPLAYER
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    connected
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50'
                      : 'bg-rose-500/25 text-rose-300 border border-rose-400/50'
                  }`}
                >
                  {connected ? '● ONLINE' : '○ CONNECTING'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Create a Private Room Code for Friends or Join Public Matchmaking
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-rose-600 border-2 border-amber-300 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name & Mode */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-200 mb-1">
              Your Player Name
            </label>
            <input
              type="text"
              value={commanderName}
              onChange={(e) => onChangeCommanderName(e.target.value)}
              maxLength={16}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/25 text-sm font-bold text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-200 mb-1">
              Game Mode
            </label>
            <select
              value={selectedMode}
              onChange={(e) => onChangeMode(e.target.value as GameMode)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/25 text-sm font-bold text-amber-300"
            >
              <option value="classic">👑 Classic Mode (All 4 Pawns)</option>
              <option value="quick">⚡ Quick Mode (2 Pawns Rush)</option>
              <option value="master">🛡️ Master Mode (Safe Blockades)</option>
            </select>
          </div>
        </div>

        {currentRoomId ? (
          <div className="mt-5 p-5 rounded-2xl bg-slate-900/90 border-2 border-amber-400 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-amber-300">
                  Private Room Code (Share with Friends)
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-3xl font-black font-mono tracking-widest text-white">
                    {currentRoomId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>

              {myOnlineColor && (
                <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold">
                  Your Color:{' '}
                  <span style={{ color: FACTIONS[myOnlineColor].lightHex }}>
                    {FACTIONS[myOnlineColor].name}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TURN_ORDER.map((c) => {
                const p = gameState.players[c];
                const f = FACTIONS[c];
                return (
                  <div
                    key={c}
                    className="p-3 rounded-xl border-2 bg-slate-950/60 flex flex-col items-center text-center"
                    style={{ borderColor: f.primaryHex }}
                  >
                    <div
                      className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-black text-white mb-1"
                      style={{ background: f.primaryHex }}
                    >
                      {c[0].toUpperCase()}
                    </div>
                    <div className="text-xs font-bold text-white truncate w-full">{p.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {p.isAI ? 'Bot Standby' : 'Human Ready'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onLeaveOnlineRoom}
                className="px-4 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white"
              >
                Leave Room
              </button>

              <button
                type="button"
                onClick={() => {
                  onStartOnlineWithBots();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase shadow-lg flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Match Now
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/15 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                    <Crown className="w-4 h-4" /> Create Room or Quick Match
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Generate a 6-character code to invite friends or join a public table.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => onCreateRoom(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider"
                  >
                    Create Private Room
                  </button>
                  <button
                    type="button"
                    onClick={onQuickMatch}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider"
                  >
                    Play Online Quick Match
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/15 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Join Private Room
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Enter your friend's 6-character Room Code below to join their board.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="E.G. WAR782"
                    maxLength={8}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/25 font-mono text-sm font-bold uppercase text-white"
                  />
                  <button
                    type="button"
                    disabled={joinCodeInput.trim().length < 3}
                    onClick={() => onJoinRoom(joinCodeInput.trim().toUpperCase())}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>

            {publicRooms.length > 0 && (
              <div className="mt-5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-200 mb-2">
                  Open Public Rooms ({publicRooms.length})
                </h4>
                <div className="space-y-2">
                  {publicRooms.map((r) => (
                    <div
                      key={r.roomId}
                      className="p-3 rounded-xl bg-slate-900/80 border border-white/15 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-amber-300 text-sm mr-2">
                          #{r.roomId}
                        </span>
                        <span className="text-xs text-white font-semibold">
                          Host: {r.hostName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onJoinRoom(r.roomId)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const RulesCodexModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 text-white shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #1E3A8A 0%, #0F172A 100%)',
          border: '3px solid #FACC15',
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-amber-300" />
            <h2
              className="text-xl font-black tracking-wide text-amber-300"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              HOW TO PLAY LUDO WARRIOR
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-rose-600 border-2 border-amber-300 flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/15">
            <h3 className="font-extrabold text-amber-300 mb-1">🎲 Starting & Moving Pawns</h3>
            <p>
              Roll a <strong>6</strong> to bring a pawn out of your Home Base onto your colored Starting Square. Tap any glowing pawn to move it forward by the number rolled.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/15">
            <h3 className="font-extrabold text-amber-300 mb-1">⚔️ Capturing & Safe Zones</h3>
            <p>
              Landing on an opponent's pawn sends it flying back to their base and awards you a <strong>Bonus Roll</strong>! Pawns standing on the <strong>8 Safe Squares</strong> (4 Colored Start Squares + 4 Star Squares) cannot be captured.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/15">
            <h3 className="font-extrabold text-amber-300 mb-1">👑 Winning the Game</h3>
            <p>
              Guide all <strong>4 pawns</strong> (or <strong>2 pawns</strong> in Quick Mode) up your colored Home Stretch and into the center Crown Triangle by an exact roll! Rolling a 6, capturing an enemy, or reaching Home grants an extra roll.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  gameState: GameState;
  earnedGold: number;
  earnedXp: number;
  onRematch: () => void;
  onBackToMenu: () => void;
}

export const VictoryPodiumModal: React.FC<VictoryModalProps> = ({
  gameState,
  earnedGold,
  earnedXp,
  onRematch,
  onBackToMenu,
}) => {
  const winnerColor = gameState.winnerOrder[0] ?? gameState.currentTurn;
  const winnerPlayer = gameState.players[winnerColor];
  const winnerFaction = FACTIONS[winnerColor];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-lg rounded-3xl p-6 text-white shadow-2xl border-4 border-amber-400"
        style={{
          background: 'linear-gradient(180deg, #1E3A8A 0%, #0F172A 100%)',
        }}
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 border-2 border-white shadow-xl mb-1">
            <Trophy className="w-10 h-10" />
          </div>
          <div className="text-xs font-extrabold uppercase tracking-widest text-amber-300">
            Victory Crowned
          </div>
          <h2
            className="text-2xl sm:text-3xl font-black text-white"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            {winnerPlayer?.name.toUpperCase()} WINS!
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-amber-400/50 flex items-center justify-center gap-2">
            <Coins className="w-6 h-6 text-amber-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-200">Reward</div>
              <div className="text-base font-black font-mono text-amber-300">
                +{earnedGold} Coins
              </div>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-400/50 flex items-center justify-center gap-2">
            <Gem className="w-6 h-6 text-cyan-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-cyan-200">Experience</div>
              <div className="text-base font-black font-mono text-cyan-300">+{earnedXp} XP</div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {gameState.activeOrder.map((color, idx) => {
            const p = gameState.players[color];
            const f = FACTIONS[color];
            const isChamp = color === winnerColor;
            return (
              <div
                key={color}
                className="p-3 rounded-xl bg-slate-900/80 border-2 flex items-center justify-between"
                style={{ borderColor: isChamp ? '#FACC15' : f.primaryHex }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-white/10 font-bold text-sm flex items-center justify-center">
                    {isChamp ? '👑' : `#${idx + 1}`}
                  </span>
                  <span className="font-bold text-sm text-white">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-amber-200">
                  <span>⚔️ {p.stats.capturesMade}</span>
                  <span>🎲 {p.stats.sixesRolled}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToMenu}
            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/20 text-xs font-extrabold uppercase text-white"
          >
            Home Menu
          </button>
          <button
            type="button"
            onClick={onRematch}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};
