import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  BoardThemeId,
  CapturedPawnReturn,
  EmoteEvent,
  FACTIONS,
  FactionColor,
  GameMode,
  GameState,
  TURN_ORDER_5P,
  TURN_ORDER_6P,
  applyDiceRoll,
  createInitialGameState,
  executeTokenMove,
  getCaptureRewindCoords,
  getStepByStepCoords,
  getUniversalIndex,
  isSafeUniversalIndex,
  selectBestAIMove,
} from './engine/ludoEngine';
import {
  ActiveTokenAnimation,
  BoardArena,
  ClashEffect,
} from './components/BoardArena';
import { PlayerHudCard } from './components/PlayerHudCard';
import { MatchSetupModal, SlotSetupConfig } from './components/MatchSetupModal';
import {
  OnlineLobbyModal,
  OnlineRoomSummary,
  RulesCodexModal,
  VictoryPodiumModal,
} from './components/ModalsAndPanels';
import { RoyalHomeMenu } from './components/RoyalHomeMenu';
import { soundEngine } from './audio/soundEngine';
import {
  WarriorProfile,
  loadWarriorProfile,
  saveWarriorProfile,
} from './store/warriorProfile';
import {
  Volume2,
  VolumeX,
  Smartphone,
  Maximize2,
  RotateCcw,
  Users,
  BookOpen,
  Globe,
  X,
} from 'lucide-react';

// Unhurried, readable Ludo King hop timing & captured piece return speed
const HOP_DURATION_MS = 265;
const REWIND_SEG_MS = 85;

/**
 * Authentic Ludo King Tilted Tiled Board Wallpaper Background (Matches Image 2)
 */
const LudoKingWallpaperBackground: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lkBgVignette" cx="50%" cy="48%" r="72%">
          <stop offset="0%" stopColor="#1B6CA8" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#0D3C6E" stopOpacity="0.68" />
          <stop offset="100%" stopColor="#051B38" stopOpacity="0.94" />
        </radialGradient>

        <pattern
          id="ludoKingBoardPattern"
          width="260"
          height="260"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-24)"
        >
          <rect width="260" height="260" fill="#134E8A" stroke="#0B315C" strokeWidth="3" />
          {/* 4 Corner Yards */}
          <rect x="6" y="6" width="96" height="96" fill="#0F4279" stroke="#0B315C" strokeWidth="2" />
          <rect x="22" y="22" width="64" height="64" fill="#1C64AA" />
          <circle cx="38" cy="38" r="9" fill="#0F4279" />
          <circle cx="70" cy="38" r="9" fill="#0F4279" />
          <circle cx="38" cy="70" r="9" fill="#0F4279" />
          <circle cx="70" cy="70" r="9" fill="#0F4279" />

          <rect x="158" y="6" width="96" height="96" fill="#126872" stroke="#0B315C" strokeWidth="2" />
          <rect x="174" y="22" width="64" height="64" fill="#218390" />
          <circle cx="190" cy="38" r="9" fill="#126872" />
          <circle cx="222" cy="38" r="9" fill="#126872" />
          <circle cx="190" cy="70" r="9" fill="#126872" />
          <circle cx="222" cy="70" r="9" fill="#126872" />

          <rect x="6" y="158" width="96" height="96" fill="#165C9E" stroke="#0B315C" strokeWidth="2" />
          <rect x="22" y="174" width="64" height="64" fill="#2477C2" />
          <circle cx="38" cy="190" r="9" fill="#165C9E" />
          <circle cx="70" cy="190" r="9" fill="#165C9E" />
          <circle cx="38" cy="222" r="9" fill="#165C9E" />
          <circle cx="70" cy="222" r="9" fill="#165C9E" />

          <rect x="158" y="158" width="96" height="96" fill="#1D687A" stroke="#0B315C" strokeWidth="2" />
          <rect x="174" y="174" width="64" height="64" fill="#2B869B" />
          <circle cx="190" cy="190" r="9" fill="#1D687A" />
          <circle cx="222" cy="190" r="9" fill="#1D687A" />
          <circle cx="190" cy="222" r="9" fill="#1D687A" />
          <circle cx="222" cy="222" r="9" fill="#1D687A" />

          {/* Center Cross & Triangles */}
          <rect x="102" y="6" width="56" height="248" fill="none" stroke="#0B315C" strokeWidth="1.5" />
          <rect x="6" y="102" width="248" height="56" fill="none" stroke="#0B315C" strokeWidth="1.5" />
          <polygon points="102,102 130,130 102,158" fill="#0E3B6C" />
          <polygon points="102,102 130,130 158,102" fill="#125C68" />
          <polygon points="158,102 130,130 158,158" fill="#1B6678" />
          <polygon points="102,158 130,130 158,158" fill="#15528E" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ludoKingBoardPattern)" />
      <rect width="100%" height="100%" fill="url(#lkBgVignette)" />
    </svg>
  </div>
);

export const App: React.FC = () => {
  const [profile, setProfile] = useState<WarriorProfile>(() => loadWarriorProfile());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(false);
  const [screen, setScreen] = useState<'home' | 'game'>('home');
  const [showCornerMenu, setShowCornerMenu] = useState<boolean>(false);

  const [slotConfigs, setSlotConfigs] = useState<SlotSetupConfig[]>([
    { color: 'blue', name: 'Player 1', isAI: false, aiDifficulty: 'hard', active: true },
    { color: 'red', name: 'Player 2', isAI: true, aiDifficulty: 'hard', active: true },
    { color: 'green', name: 'Player 3', isAI: true, aiDifficulty: 'hard', active: true },
    { color: 'yellow', name: 'Player 4', isAI: true, aiDifficulty: 'hard', active: true },
    { color: 'purple', name: 'Player 5', isAI: true, aiDifficulty: 'hard', active: false },
    { color: 'orange', name: 'Player 6', isAI: true, aiDifficulty: 'hard', active: false },
  ]);

  const [gameState, setGameState] = useState<GameState>(() => {
    const initial = createInitialGameState({
      mode: 'classic',
      playerConfigs: [
        { color: 'blue', name: 'Player 1', isAI: false, aiDifficulty: 'hard', active: true },
        { color: 'red', name: 'Player 2', isAI: true, aiDifficulty: 'hard', active: true },
        { color: 'green', name: 'Player 3', isAI: true, aiDifficulty: 'hard', active: true },
        { color: 'yellow', name: 'Player 4', isAI: true, aiDifficulty: 'hard', active: true },
        { color: 'purple', name: 'Player 5', isAI: true, aiDifficulty: 'hard', active: false },
        { color: 'orange', name: 'Player 6', isAI: true, aiDifficulty: 'hard', active: false },
      ],
    });
    initial.currentTurn = 'blue';
    return initial;
  });

  // Modals
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [lastEarnedGold, setLastEarnedGold] = useState(0);
  const [lastEarnedXp, setLastEarnedXp] = useState(0);

  // Dice & Step-by-Step Hop Animation State
  const [diceRolling, setDiceRolling] = useState(false);
  const [activeAnim, setActiveAnim] = useState<ActiveTokenAnimation | null>(null);
  const [clashEffects, setClashEffects] = useState<ClashEffect[]>([]);
  const [activeEmotes, setActiveEmotes] = useState<Partial<Record<FactionColor, EmoteEvent>>>({});

  // Online Socket.IO State
  const socketRef = useRef<Socket | null>(null);
  const [onlineConnected, setOnlineConnected] = useState(false);
  const [currentOnlineRoomId, setCurrentOnlineRoomId] = useState<string | null>(null);
  const [myOnlineColor, setMyOnlineColor] = useState<FactionColor | null>(null);
  const [publicRooms, setPublicRooms] = useState<OnlineRoomSummary[]>([]);

  const isAnimatingRef = useRef(false);

  // Android Hardware Back Button / Gesture Support
  useEffect(() => {
    const handlePopState = () => {
      if (showSetupModal) {
        setShowSetupModal(false);
        return;
      }
      if (showRulesModal) {
        setShowRulesModal(false);
        return;
      }
      if (showOnlineModal) {
        setShowOnlineModal(false);
        return;
      }
      if (showCornerMenu) {
        setShowCornerMenu(false);
        return;
      }
      if (screen === 'game') {
        setScreen('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [screen, showSetupModal, showRulesModal, showOnlineModal, showCornerMenu]);

  const updateProfile = useCallback((updater: (prev: WarriorProfile) => WarriorProfile) => {
    setProfile((prev) => {
      const next = updater(prev);
      saveWarriorProfile(next);
      return next;
    });
  }, []);

  const spawnClashEffect = useCallback(
    (
      coord: [number, number],
      color: FactionColor,
      label: string,
      type: 'capture' | 'citadel' | 'six'
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setClashEffects((prev) => [...prev, { id, coord, color, label, type }]);
      setTimeout(() => {
        setClashEffects((prev) => prev.filter((c) => c.id !== id));
      }, 1150);
    },
    []
  );

  // Socket.IO connection
  useEffect(() => {
    const socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setOnlineConnected(true);
      socket.emit('lobby:list');
    });

    socket.on('disconnect', () => {
      setOnlineConnected(false);
    });

    socket.on('lobby:rooms', (rooms: OnlineRoomSummary[]) => {
      setPublicRooms(rooms || []);
    });

    socket.on(
      'room:joined',
      (payload: { roomId: string; assignedColor: FactionColor; state: GameState }) => {
        setCurrentOnlineRoomId(payload.roomId);
        setMyOnlineColor(payload.assignedColor);
        setGameState(payload.state);
        window.history.pushState({ ludoScreen: 'game' }, '');
        setScreen('game');
        soundEngine.playModeStart();
      }
    );

    socket.on('room:state', (nextState: GameState) => {
      setGameState(nextState);
      if (nextState.status === 'finished') {
        soundEngine.playVictoryFanfare();
        setShowVictoryModal(true);
      }
    });

    socket.on('room:emote', (emoteEvent: EmoteEvent) => {
      soundEngine.playClick();
      setActiveEmotes((prev) => ({ ...prev, [emoteEvent.color]: emoteEvent }));
      setTimeout(() => {
        setActiveEmotes((prev) => {
          const copy = { ...prev };
          if (copy[emoteEvent.color]?.id === emoteEvent.id) {
            delete copy[emoteEvent.color];
          }
          return copy;
        });
      }, 3200);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Unhurried, smooth tile-by-tile hop animation & step-by-step captured piece rewind
  const runHopAndCaptureAnimation = useCallback(
    (
      color: FactionColor,
      tokenIndex: number,
      fromStep: number,
      toStep: number,
      capturedList: CapturedPawnReturn[],
      reachedCitadel: boolean,
      finalState: GameState
    ) => {
      const pathCoords = getStepByStepCoords(
        color,
        tokenIndex,
        fromStep,
        toStep,
        finalState.boardType
      );

      if (pathCoords.length <= 1) {
        setGameState(finalState);
        isAnimatingRef.current = false;
        return;
      }

      isAnimatingRef.current = true;
      const totalHops = pathCoords.length - 1;
      let currentHop = 0;

      const animateSingleHop = () => {
        if (currentHop >= totalHops) {
          const finalCoord = pathCoords[pathCoords.length - 1];

          if (capturedList.length > 0) {
            soundEngine.playCaptureClash();
            spawnClashEffect(finalCoord, color, 'CAPTURED!', 'capture');

            const victim = capturedList[0];
            const rewindCoords = getCaptureRewindCoords(
              victim.color,
              victim.tokenIndex,
              victim.fromStep,
              finalState.boardType
            );

            if (rewindCoords.length > 1) {
              let rSeg = 0;
              const totalRSegs = rewindCoords.length - 1;

              const animateRewindStep = () => {
                if (rSeg >= totalRSegs) {
                  setActiveAnim(null);
                  setGameState(finalState);
                  isAnimatingRef.current = false;

                  if (finalState.status === 'finished') {
                    soundEngine.playVictoryFanfare();
                    setShowVictoryModal(true);
                  }
                  return;
                }

                const rStart = rewindCoords[rSeg];
                const rEnd = rewindCoords[rSeg + 1];
                soundEngine.playRewindTick(rSeg);
                const segStartTime = performance.now();

                const stepRewindFrame = (now: number) => {
                  const t = Math.min(1, (now - segStartTime) / REWIND_SEG_MS);
                  const rx = rStart[0] + (rEnd[0] - rStart[0]) * t;
                  const ry = rStart[1] + (rEnd[1] - rStart[1]) * t;

                  setActiveAnim({
                    tokenId: `${victim.color}-${victim.tokenIndex}`,
                    color: victim.color,
                    tokenIndex: victim.tokenIndex,
                    currentCoord: [rx, ry],
                    hopProgress: t,
                    isRewind: true,
                  });

                  if (t < 1) {
                    requestAnimationFrame(stepRewindFrame);
                  } else {
                    rSeg++;
                    animateRewindStep();
                  }
                };

                requestAnimationFrame(stepRewindFrame);
              };

              animateRewindStep();
              return;
            }
          }

          setActiveAnim(null);
          if (reachedCitadel) {
            soundEngine.playCitadelAscend();
            spawnClashEffect(finalCoord, color, 'HOME!', 'citadel');
          } else {
            const destUIdx = getUniversalIndex(color, toStep, finalState.boardType);
            if (
              destUIdx !== null &&
              toStep > 0 &&
              isSafeUniversalIndex(destUIdx, finalState.boardType)
            ) {
              soundEngine.playSafeZoneShield();
            }
          }

          setGameState(finalState);
          isAnimatingRef.current = false;

          if (finalState.status === 'finished') {
            soundEngine.playVictoryFanfare();
            const winnerColor = finalState.winnerOrder[0];
            const winnerPlayer = finalState.players[winnerColor];
            const humanWon = winnerPlayer && !winnerPlayer.isAI;
            const goldReward = humanWon ? 500 : 120;
            const xpReward = humanWon ? 350 : 90;
            setLastEarnedGold(goldReward);
            setLastEarnedXp(xpReward);

            updateProfile((prev) => ({
              ...prev,
              coins: prev.coins + goldReward,
              xp: prev.xp + xpReward,
              level: Math.floor((prev.xp + xpReward) / 500) + 1,
              matchesPlayed: prev.matchesPlayed + 1,
              matchesWon: humanWon ? prev.matchesWon + 1 : prev.matchesWon,
              winStreak: humanWon ? prev.winStreak + 1 : 0,
            }));

            setShowVictoryModal(true);
          }
          return;
        }

        const startCoord = pathCoords[currentHop];
        const endCoord = pathCoords[currentHop + 1];
        soundEngine.playTokenStep(currentHop);

        const startTime = performance.now();

        const stepFrame = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / HOP_DURATION_MS);
          const ease = 1 - Math.pow(1 - progress, 2.2);
          const curX = startCoord[0] + (endCoord[0] - startCoord[0]) * ease;
          const curY = startCoord[1] + (endCoord[1] - startCoord[1]) * ease;

          setActiveAnim({
            tokenId: `${color}-${tokenIndex}`,
            color,
            tokenIndex,
            currentCoord: [curX, curY],
            hopProgress: progress,
          });

          if (progress < 1) {
            requestAnimationFrame(stepFrame);
          } else {
            currentHop++;
            animateSingleHop();
          }
        };

        requestAnimationFrame(stepFrame);
      };

      animateSingleHop();
    },
    [spawnClashEffect, updateProfile]
  );

  // Execute token move
  const handleSelectToken = useCallback(
    (tokenIndex: number) => {
      if (isAnimatingRef.current || diceRolling) return;
      if (gameState.turnPhase !== 'MOVE') return;
      if (!gameState.validTokenIndices.includes(tokenIndex)) return;

      if (currentOnlineRoomId && socketRef.current) {
        socketRef.current.emit('game:move', {
          roomId: currentOnlineRoomId,
          tokenIndex,
        });
        return;
      }

      const movingColor = gameState.currentTurn;
      const clonedState: GameState = JSON.parse(JSON.stringify(gameState));
      const result = executeTokenMove(clonedState, tokenIndex);

      if (!result.valid) return;

      if (result.capturedTokens.length > 0) {
        const moverPlayer = gameState.players[movingColor];
        if (!moverPlayer.isAI) {
          updateProfile((prev) => ({
            ...prev,
            totalCaptures: prev.totalCaptures + result.capturedTokens.length,
          }));
        }
      }

      runHopAndCaptureAnimation(
        movingColor,
        tokenIndex,
        result.fromStep,
        result.toStep,
        result.capturedTokens,
        result.reachedCitadel,
        clonedState
      );
    },
    [
      diceRolling,
      gameState,
      currentOnlineRoomId,
      runHopAndCaptureAnimation,
      updateProfile,
    ]
  );

  // Execute Dice Roll
  const handleRollDice = useCallback(() => {
    if (isAnimatingRef.current || diceRolling) return;
    if (gameState.turnPhase !== 'ROLL' || gameState.status !== 'playing') return;

    if (currentOnlineRoomId && socketRef.current) {
      soundEngine.playDiceRoll();
      setDiceRolling(true);
      setTimeout(() => {
        setDiceRolling(false);
        socketRef.current?.emit('game:roll', { roomId: currentOnlineRoomId });
      }, 390);
      return;
    }

    soundEngine.playDiceRoll();
    setDiceRolling(true);

    setTimeout(() => {
      setDiceRolling(false);
      const clonedState: GameState = JSON.parse(JSON.stringify(gameState));
      const result = applyDiceRoll(clonedState);

      if (result.threeSixesForfeit) {
        soundEngine.playCaptureClash();
      } else if (result.rolled === 6) {
        soundEngine.playRollSix();
      }

      setGameState(clonedState);
    }, 390);
  }, [diceRolling, gameState, currentOnlineRoomId]);

  // Auto-Move when a human player only has 1 valid move or all valid moves are identical
  useEffect(() => {
    if (screen !== 'game') return;
    if (currentOnlineRoomId) return;
    if (gameState.status !== 'playing') return;
    if (isAnimatingRef.current || diceRolling) return;
    if (gameState.turnPhase !== 'MOVE') return;

    const currentPlayer = gameState.players[gameState.currentTurn];
    if (!currentPlayer || !currentPlayer.active || currentPlayer.isAI) return;

    const validMoves = gameState.validTokenIndices;
    if (validMoves.length === 0) return;

    if (validMoves.length === 1) {
      const timer = setTimeout(() => {
        handleSelectToken(validMoves[0]);
      }, 280);
      return () => clearTimeout(timer);
    }

    const firstTokenStep = currentPlayer.tokens[validMoves[0]].step;
    const allAtIdenticalStep = validMoves.every(
      (idx: number) => currentPlayer.tokens[idx].step === firstTokenStep
    );

    if (allAtIdenticalStep) {
      const timer = setTimeout(() => {
        handleSelectToken(validMoves[0]);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [screen, gameState, diceRolling, currentOnlineRoomId, handleSelectToken]);

  // AI Automation Loop
  useEffect(() => {
    if (screen !== 'game') return;
    if (currentOnlineRoomId) return;
    if (gameState.status !== 'playing') return;
    if (isAnimatingRef.current || diceRolling) return;

    const currentPlayer = gameState.players[gameState.currentTurn];
    if (!currentPlayer || !currentPlayer.active || !currentPlayer.isAI) return;

    if (gameState.turnPhase === 'ROLL') {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 540);
      return () => clearTimeout(timer);
    }

    if (gameState.turnPhase === 'MOVE') {
      const timer = setTimeout(() => {
        const chosenToken = selectBestAIMove(gameState);
        if (chosenToken !== null) {
          handleSelectToken(chosenToken);
        }
      }, 460);
      return () => clearTimeout(timer);
    }
  }, [
    screen,
    gameState,
    diceRolling,
    currentOnlineRoomId,
    handleRollDice,
    handleSelectToken,
  ]);

  // Start Match Handler
  const handleStartConfiguredMatch = (mode: GameMode, slots: SlotSetupConfig[]) => {
    setSlotConfigs(slots);
    setCurrentOnlineRoomId(null);
    setMyOnlineColor(null);
    setShowVictoryModal(false);
    setShowCornerMenu(false);

    const freshState = createInitialGameState({
      mode,
      playerConfigs: slots.map((s) => ({
        color: s.color,
        name: s.name,
        isAI: s.isAI,
        aiDifficulty: s.aiDifficulty,
        active: s.active,
      })),
    });

    // If Blue is an active human player, let Blue roll first just like Image 2
    if (freshState.players.blue?.active && !freshState.players.blue.isAI) {
      freshState.currentTurn = 'blue';
    }

    setGameState(freshState);
    window.history.pushState({ ludoScreen: 'game' }, '');
    setScreen('game');
    soundEngine.playModeStart();
  };

  // Toggle Sound SFX
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.enabled = next;
    if (next) soundEngine.playClick();
  };

  // Toggle Android Haptics
  const toggleHaptics = () => {
    const next = soundEngine.toggleHaptics();
    setHapticsEnabled(next);
  };

  // Toggle Background Music
  const toggleMusic = () => {
    const next = soundEngine.toggleMusic();
    setMusicEnabled(next);
    soundEngine.playClick();
  };

  // Toggle Fullscreen for Android Phones
  const toggleFullscreen = () => {
    soundEngine.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Online Room Actions
  const handleCreateOnlineRoom = (isPublic: boolean) => {
    socketRef.current?.emit('room:create', {
      playerName: profile.commanderName,
      mode: gameState.mode,
      isPublic,
    });
  };

  const handleJoinOnlineRoom = (roomId: string) => {
    socketRef.current?.emit('room:join', {
      roomId,
      playerName: profile.commanderName,
    });
  };

  const handleQuickMatchmaking = () => {
    socketRef.current?.emit('room:quickmatch', {
      playerName: profile.commanderName,
      mode: gameState.mode,
    });
  };

  const handleStartOnlineWithBots = () => {
    if (!currentOnlineRoomId) return;
    socketRef.current?.emit('room:start_with_bots', {
      roomId: currentOnlineRoomId,
    });
  };

  const handleLeaveOnlineRoom = () => {
    if (!currentOnlineRoomId) return;
    socketRef.current?.emit('room:leave', { roomId: currentOnlineRoomId });
    setCurrentOnlineRoomId(null);
    setMyOnlineColor(null);
  };

  // Render Home Lobby Screen
  if (screen === 'home') {
    return (
      <>
        <RoyalHomeMenu
          profile={profile}
          soundEnabled={soundEnabled}
          hapticsEnabled={hapticsEnabled}
          musicEnabled={musicEnabled}
          onlineConnected={onlineConnected}
          onToggleSound={toggleSound}
          onToggleHaptics={toggleHaptics}
          onToggleMusic={toggleMusic}
          onToggleFullscreen={toggleFullscreen}
          onChangeName={(name) =>
            updateProfile((prev) => ({ ...prev, commanderName: name }))
          }
          onChangeTheme={(theme: BoardThemeId) =>
            updateProfile((prev) => ({ ...prev, boardTheme: theme }))
          }
          onStartLocalMatch={(mode, slots) => handleStartConfiguredMatch(mode, slots)}
          onOpenOnlineLobby={() => setShowOnlineModal(true)}
        />

        {showOnlineModal && (
          <OnlineLobbyModal
            connected={onlineConnected}
            currentRoomId={currentOnlineRoomId}
            myOnlineColor={myOnlineColor}
            publicRooms={publicRooms}
            gameState={gameState}
            commanderName={profile.commanderName}
            selectedMode={gameState.mode}
            onChangeCommanderName={(name) =>
              updateProfile((prev) => ({ ...prev, commanderName: name }))
            }
            onChangeMode={(mode) => setGameState((prev) => ({ ...prev, mode }))}
            onCreateRoom={handleCreateOnlineRoom}
            onJoinRoom={handleJoinOnlineRoom}
            onQuickMatch={handleQuickMatchmaking}
            onStartOnlineWithBots={handleStartOnlineWithBots}
            onLeaveOnlineRoom={handleLeaveOnlineRoom}
            onClose={() => setShowOnlineModal(false)}
          />
        )}
      </>
    );
  }

  const currentPlayer = gameState.players[gameState.currentTurn];
  const isMyHumanTurn = currentOnlineRoomId
    ? gameState.currentTurn === myOnlineColor
    : !currentPlayer.isAI;

  const canHumanRoll =
    isMyHumanTurn &&
    gameState.turnPhase === 'ROLL' &&
    !diceRolling &&
    !isAnimatingRef.current;

  const canHumanMove =
    isMyHumanTurn &&
    gameState.turnPhase === 'MOVE' &&
    !diceRolling &&
    !isAnimatingRef.current;

  // Player Pod layout for 4P Square vs 5P Pentagon vs 6P Hexagon
  const topRowColors: FactionColor[] =
    gameState.boardType === 'hex6p' || gameState.boardType === 'pent5p'
      ? ['red', 'green', 'yellow']
      : ['red', 'green'];

  const bottomRowColors: FactionColor[] =
    gameState.boardType === 'hex6p'
      ? ['purple', 'blue', 'orange']
      : gameState.boardType === 'pent5p'
      ? ['purple', 'blue']
      : ['blue', 'yellow'];

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden flex flex-col items-center justify-center select-none text-white android-safe-top android-safe-bottom">
      {/* 1. Authentic Ludo King Tilted Tiled Board Wallpaper Background */}
      <LudoKingWallpaperBackground />

      {/* 2. Center Flush-Docked Ludo King Arena: Top Dice Pods -> Full-Bleed Board -> Bottom Dice Pods */}
      <main className="relative z-10 flex flex-col items-center justify-center w-full max-w-[min(100vw,70dvh)] mx-auto px-0.5">
        {/* Top Row Player Dice Pods (Docked Flush to Top of Board) */}
        <div
          className={`w-full flex items-end justify-between px-4 sm:px-7 mb-1 shrink-0 ${
            topRowColors.length === 3 ? 'gap-1' : ''
          }`}
        >
          {topRowColors.map((color, idx) => (
            <PlayerHudCard
              key={color}
              player={gameState.players[color]}
              mode={gameState.mode}
              boardType={gameState.boardType}
              isCurrentTurn={gameState.currentTurn === color}
              turnPhase={gameState.turnPhase}
              diceValue={gameState.diceValue}
              diceRolling={diceRolling && gameState.currentTurn === color}
              canHumanRoll={canHumanRoll && gameState.currentTurn === color}
              activeEmote={activeEmotes[color]}
              align={idx === topRowColors.length - 1 ? 'right' : 'left'}
              onRollDice={handleRollDice}
            />
          ))}
        </div>

        {/* Full-Width Ludo King Board (4P Square, 5P Pentagon, or 6P Hexagon) */}
        <div className="w-full aspect-square flex items-center justify-center">
          <BoardArena
            gameState={gameState}
            boardThemeId={profile.boardTheme}
            activeAnim={activeAnim}
            clashEffects={clashEffects}
            canInteractMove={canHumanMove}
            onSelectToken={handleSelectToken}
          />
        </div>

        {/* Bottom Row Player Dice Pods (Docked Flush to Bottom of Board) */}
        <div
          className={`w-full flex items-start justify-between px-4 sm:px-7 mt-1 shrink-0 ${
            bottomRowColors.length === 3 ? 'gap-1' : ''
          }`}
        >
          {bottomRowColors.map((color, idx) => (
            <PlayerHudCard
              key={color}
              player={gameState.players[color]}
              mode={gameState.mode}
              boardType={gameState.boardType}
              isCurrentTurn={gameState.currentTurn === color}
              turnPhase={gameState.turnPhase}
              diceValue={gameState.diceValue}
              diceRolling={diceRolling && gameState.currentTurn === color}
              canHumanRoll={canHumanRoll && gameState.currentTurn === color}
              activeEmote={activeEmotes[color]}
              align={idx === bottomRowColors.length - 1 ? 'right' : 'left'}
              onRollDice={handleRollDice}
            />
          ))}
        </div>
      </main>

      {/* 3. Authentic Bottom-Left Ludo King Circular Golden Menu Button & Popup (Matches Image 2) */}
      <div className="fixed bottom-3 left-3 z-30 flex flex-col items-start">
        {showCornerMenu && (
          <div
            className="mb-2.5 w-48 rounded-2xl p-2.5 text-white shadow-2xl border border-white/15 flex flex-col gap-2"
            style={{
              background: 'rgba(4, 20, 44, 0.96)',
            }}
          >
            {/* Quick Player Count Switcher (2P / 3P / 4P / 5P / 6P) */}
            <div className="flex items-center justify-between gap-1 bg-black/40 p-1 rounded-xl border border-white/15">
              {([2, 3, 4, 5, 6] as const).map((num) => {
                const isCurr = gameState.activeOrder.length === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      const defaultLabels: Record<FactionColor, string> = {
                        blue: 'Player 1',
                        red: 'Player 2',
                        green: 'Player 3',
                        yellow: 'Player 4',
                        purple: 'Player 5',
                        orange: 'Player 6',
                      };
                      const quickSlots: SlotSetupConfig[] = TURN_ORDER_6P.map((c) => {
                        let active = false;
                        if (num === 2) active = c === 'blue' || c === 'green';
                        else if (num === 3) active = c === 'blue' || c === 'red' || c === 'green';
                        else if (num === 4)
                          active = c === 'blue' || c === 'red' || c === 'green' || c === 'yellow';
                        else if (num === 5) active = TURN_ORDER_5P.includes(c);
                        else active = true;

                        return {
                          color: c,
                          name: defaultLabels[c],
                          isAI: c !== 'blue',
                          aiDifficulty: 'hard',
                          active,
                        };
                      });
                      handleStartConfiguredMatch(gameState.mode, quickSlots);
                    }}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-black uppercase transition ${
                      isCurr
                        ? 'bg-[#FFCB05] text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {num}P
                  </button>
                );
              })}
            </div>

            {/* REMOVE PLAYER(S) / SETUP (Exact Ludo King Menu Item) */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowCornerMenu(false);
                setShowSetupModal(true);
              }}
              className="android-btn-press flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/10 text-left"
            >
              <Users className="w-6 h-6 text-[#FFCB05] shrink-0" />
              <span className="text-xs font-extrabold uppercase leading-tight text-[#FFCB05]">
                REMOVE
                <br />
                PLAYER(S)
              </span>
            </button>

            {/* Quick Controls Row (Sound, Vibration, Restart, Online, Rules, Fullscreen) */}
            <div className="grid grid-cols-5 gap-1 pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={toggleSound}
                className="p-1.5 rounded-lg bg-white/10 flex items-center justify-center text-[#FFCB05]"
                title="Sound"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={toggleHaptics}
                className={`p-1.5 rounded-lg flex items-center justify-center ${
                  hapticsEnabled ? 'bg-[#00A651] text-white' : 'bg-white/10 text-slate-400'
                }`}
                title="Vibration"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCornerMenu(false);
                  handleStartConfiguredMatch(gameState.mode, slotConfigs);
                }}
                className="p-1.5 rounded-lg bg-white/10 flex items-center justify-center text-white"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCornerMenu(false);
                  setShowOnlineModal(true);
                }}
                className="p-1.5 rounded-lg bg-white/10 flex items-center justify-center text-sky-300"
                title="Online"
              >
                <Globe className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCornerMenu(false);
                  setShowRulesModal(true);
                }}
                className="p-1.5 rounded-lg bg-white/10 flex items-center justify-center text-amber-200"
                title="Rules"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            </div>

            {/* Exit (Exact Ludo King Menu Item) */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowCornerMenu(false);
                setScreen('home');
              }}
              className="android-btn-press flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/10 text-left border-t border-white/10 pt-2"
            >
              <X className="w-7 h-7 text-[#FFCB05] stroke-[3.5] shrink-0" />
              <span className="text-base font-black text-[#FFCB05]">Exit</span>
            </button>
          </div>
        )}

        {/* Golden Circular Hamburger Menu Button (Exact Ludo King Bottom-Left Icon) */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setShowCornerMenu((prev) => !prev);
          }}
          className="android-btn-press w-12 h-12 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.65)]"
          style={{
            background: 'linear-gradient(180deg, #0D5DB8 0%, #062B61 100%)',
            border: '3.5px solid #F5B82E',
          }}
          title="Menu"
        >
          <div className="flex flex-col gap-1 items-center justify-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#FFCB05]" />
                <span className="w-4 h-1 rounded-full bg-[#FFCB05]" />
              </div>
            ))}
          </div>
        </button>
      </div>

      {/* 4. Bottom-Right "NO ADS" Badge (Matches Image 2 & Toggles Fullscreen on Tap) */}
      <button
        type="button"
        onClick={toggleFullscreen}
        className="fixed bottom-3 right-3 z-30 android-btn-press w-13 h-13 rounded-full flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.65)]"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #E11D48 0%, #881337 70%, #4C0519 100%)',
          border: '2.5px solid #CBD5E1',
        }}
        title="100% Ad-Free (Tap for Fullscreen)"
      >
        <span className="text-[11px] font-black leading-none text-white tracking-tighter drop-shadow">
          NO
        </span>
        <span className="text-[11px] font-black leading-none text-white tracking-tighter drop-shadow">
          ADS
        </span>
        <Maximize2 className="w-2.5 h-2.5 text-amber-300 mt-0.5 opacity-80" />
      </button>

      {/* Modals */}
      {showSetupModal && (
        <MatchSetupModal
          initialMode={gameState.mode}
          initialSlots={slotConfigs}
          onStartMatch={handleStartConfiguredMatch}
          onClose={() => setShowSetupModal(false)}
        />
      )}

      {showOnlineModal && (
        <OnlineLobbyModal
          connected={onlineConnected}
          currentRoomId={currentOnlineRoomId}
          myOnlineColor={myOnlineColor}
          publicRooms={publicRooms}
          gameState={gameState}
          commanderName={profile.commanderName}
          selectedMode={gameState.mode}
          onChangeCommanderName={(name) =>
            updateProfile((prev) => ({ ...prev, commanderName: name }))
          }
          onChangeMode={(mode) => setGameState((prev) => ({ ...prev, mode }))}
          onCreateRoom={handleCreateOnlineRoom}
          onJoinRoom={handleJoinOnlineRoom}
          onQuickMatch={handleQuickMatchmaking}
          onStartOnlineWithBots={handleStartOnlineWithBots}
          onLeaveOnlineRoom={handleLeaveOnlineRoom}
          onClose={() => setShowOnlineModal(false)}
        />
      )}

      {showRulesModal && <RulesCodexModal onClose={() => setShowRulesModal(false)} />}

      {showVictoryModal && (
        <VictoryPodiumModal
          gameState={gameState}
          earnedGold={lastEarnedGold}
          earnedXp={lastEarnedXp}
          onRematch={() => handleStartConfiguredMatch(gameState.mode, slotConfigs)}
          onBackToMenu={() => {
            setShowVictoryModal(false);
            setScreen('home');
          }}
        />
      )}
    </div>
  );
};

export default App;
