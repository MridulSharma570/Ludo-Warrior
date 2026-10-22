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
  Home,
} from 'lucide-react';

// Unhurried, readable Ludo King hop timing & captured piece return speed
const HOP_DURATION_MS = 265;
const REWIND_SEG_MS = 85;

const QUICK_EMOJIS = [
  { emoji: '😂', text: 'Haha!' },
  { emoji: '😎', text: 'Cool!' },
  { emoji: '🔥', text: 'Roll 6!' },
  { emoji: '👏', text: 'Nice!' },
  { emoji: '😱', text: 'Oops!' },
  { emoji: '👑', text: 'GG!' },
];

export const App: React.FC = () => {
  const [profile, setProfile] = useState<WarriorProfile>(() => loadWarriorProfile());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(false);
  const [screen, setScreen] = useState<'home' | 'game'>('home');

  const [slotConfigs, setSlotConfigs] = useState<SlotSetupConfig[]>([
    { color: 'red', name: profile.commanderName, isAI: false, aiDifficulty: 'hard', active: true },
    { color: 'green', name: 'Green Bot', isAI: true, aiDifficulty: 'hard', active: true },
    { color: 'yellow', name: 'Yellow Bot', isAI: true, aiDifficulty: 'hard', active: true },
    { color: 'blue', name: 'Blue Bot', isAI: true, aiDifficulty: 'hard', active: true },
    { color: 'purple', name: 'Purple Bot', isAI: true, aiDifficulty: 'hard', active: false },
    { color: 'orange', name: 'Orange Bot', isAI: true, aiDifficulty: 'hard', active: false },
  ]);

  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState({
      mode: 'classic',
      playerConfigs: [
        { color: 'red', name: profile.commanderName, isAI: false, aiDifficulty: 'hard', active: true },
        { color: 'green', name: 'Green Bot', isAI: true, aiDifficulty: 'hard', active: true },
        { color: 'yellow', name: 'Yellow Bot', isAI: true, aiDifficulty: 'hard', active: true },
        { color: 'blue', name: 'Blue Bot', isAI: true, aiDifficulty: 'hard', active: true },
        { color: 'purple', name: 'Purple Bot', isAI: true, aiDifficulty: 'hard', active: false },
        { color: 'orange', name: 'Orange Bot', isAI: true, aiDifficulty: 'hard', active: false },
      ],
    })
  );

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
      if (screen === 'game') {
        setScreen('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [screen, showSetupModal, showRulesModal, showOnlineModal]);

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

    setGameState(freshState);
    window.history.pushState({ ludoScreen: 'game' }, '');
    setScreen('game');
    soundEngine.playModeStart();
  };

  // Send Quick Emote / Chat Bubble
  const handleSendQuickEmote = (emote: string, message: string) => {
    const senderColor =
      myOnlineColor ??
      gameState.activeOrder.find((c) => !gameState.players[c].isAI) ??
      gameState.currentTurn;

    const event: EmoteEvent = {
      id: `emote-${Date.now()}`,
      color: senderColor,
      playerName: gameState.players[senderColor]?.name ?? profile.commanderName,
      emote,
      message,
      timestamp: Date.now(),
    };

    soundEngine.playClick();

    if (currentOnlineRoomId && socketRef.current) {
      socketRef.current.emit('game:emote', {
        roomId: currentOnlineRoomId,
        emote,
        message,
      });
    } else {
      setActiveEmotes((prev) => ({ ...prev, [senderColor]: event }));
      setTimeout(() => {
        setActiveEmotes((prev) => {
          const copy = { ...prev };
          if (copy[senderColor]?.id === event.id) {
            delete copy[senderColor];
          }
          return copy;
        });
      }, 2800);
    }
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
    <div
      className="h-[100dvh] w-screen overflow-hidden flex flex-col justify-between select-none text-white android-safe-top android-safe-bottom"
      style={{
        backgroundColor: '#0A2558',
        backgroundImage: `
          radial-gradient(circle at 50% 45%, rgba(28, 92, 197, 0.55) 0%, rgba(7, 24, 61, 0.92) 78%),
          repeating-linear-gradient(45deg, rgba(255, 215, 0, 0.04) 0px, rgba(255, 215, 0, 0.04) 2px, transparent 2px, transparent 28px),
          repeating-linear-gradient(-45deg, rgba(255, 215, 0, 0.04) 0px, rgba(255, 215, 0, 0.04) 2px, transparent 2px, transparent 28px)
        `,
      }}
    >
      {/* Android Portrait Top Navigation & Quick Player Count Bar */}
      <header className="w-full max-w-[540px] mx-auto px-2 pt-1 pb-0.5 flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setScreen('home');
            }}
            className="android-btn-press w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0B2854] border-2 border-[#FFCB05] flex items-center justify-center text-[#FFCB05] shadow"
            title="Home Menu"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* 1-Tap Player Count Switcher (2P / 3P / 4P / 5P / 6P) */}
          <div className="flex items-center gap-0.5 bg-[#061836] p-0.5 rounded-xl border border-white/25">
            {([2, 3, 4, 5, 6] as const).map((num) => {
              const isCurr = gameState.activeOrder.length === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    const quickSlots: SlotSetupConfig[] = TURN_ORDER_6P.map((c) => {
                      let active = false;
                      if (num === 2) active = c === 'red' || c === 'yellow';
                      else if (num === 3) active = c === 'red' || c === 'green' || c === 'yellow';
                      else if (num === 4)
                        active = c === 'red' || c === 'green' || c === 'yellow' || c === 'blue';
                      else if (num === 5) active = TURN_ORDER_5P.includes(c);
                      else active = true;

                      return {
                        color: c,
                        name: c === 'red' ? profile.commanderName : `${FACTIONS[c].name} Bot`,
                        isAI: c !== 'red',
                        aiDifficulty: 'hard',
                        active,
                      };
                    });
                    handleStartConfiguredMatch(gameState.mode, quickSlots);
                  }}
                  className={`android-btn-press px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase transition ${
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
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowSetupModal(true);
            }}
            className="android-btn-press px-2 py-1 rounded-xl bg-[#00A651] border-2 border-white text-white text-[10px] font-black uppercase flex items-center gap-1 shadow"
            title="Match Setup"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Setup</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowOnlineModal(true);
            }}
            className="android-btn-press px-2 py-1 rounded-xl bg-[#0072BC] border-2 border-white text-white text-[10px] font-black uppercase flex items-center gap-1 shadow"
            title="Online Room"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {currentOnlineRoomId ? currentOnlineRoomId : 'Online'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStartConfiguredMatch(gameState.mode, slotConfigs)}
            className="android-btn-press p-1.5 rounded-xl bg-[#0B2854] border border-white/25 text-white"
            title="Restart Match"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShowRulesModal(true);
            }}
            className="android-btn-press p-1.5 rounded-xl bg-[#0B2854] border border-white/25 text-white"
            title="Rules"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleHaptics}
            className={`android-btn-press p-1.5 rounded-xl border border-white/25 ${
              hapticsEnabled ? 'bg-[#00A651] text-white' : 'bg-[#0B2854] text-slate-400'
            }`}
            title={hapticsEnabled ? 'Vibration ON' : 'Vibration OFF'}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="android-btn-press p-1.5 rounded-xl bg-[#0B2854] border border-white/25 text-white"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleSound}
            className="android-btn-press p-1.5 rounded-xl bg-[#FFCB05] text-slate-950 font-bold"
            title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Android Portrait Ludo King Arena: Top Player Pods -> Edge-to-Edge Board -> Bottom Player Pods */}
      <main className="flex-1 flex flex-col items-center justify-between w-full max-w-[540px] mx-auto px-1.5 py-0.5 min-h-0">
        {/* Top Row Player Pods */}
        <div
          className={`w-full grid ${
            topRowColors.length === 3 ? 'grid-cols-3 gap-1' : 'grid-cols-2 gap-2'
          } shrink-0`}
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

        {/* Center Full-Width Ludo King Board (4P Square, 5P Pentagon, or 6P Hexagon) */}
        <div className="flex-1 w-full flex items-center justify-center min-h-0 my-0.5">
          <div className="w-full max-w-[min(98vw,60dvh)] sm:max-w-[min(92vw,65dvh)] aspect-square flex items-center justify-center">
            <BoardArena
              gameState={gameState}
              boardThemeId={profile.boardTheme}
              activeAnim={activeAnim}
              clashEffects={clashEffects}
              canInteractMove={canHumanMove}
              onSelectToken={handleSelectToken}
            />
          </div>
        </div>

        {/* Bottom Row Player Pods */}
        <div
          className={`w-full grid ${
            bottomRowColors.length === 3 ? 'grid-cols-3 gap-1' : 'grid-cols-2 gap-2'
          } shrink-0`}
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

      {/* Android Ludo King Bottom Emoji & Quick-Reaction Bar */}
      <footer className="w-full max-w-[540px] mx-auto px-2 pb-1 pt-0.5 shrink-0">
        <div className="flex items-center justify-between gap-1 bg-[#061836]/90 border border-[#FFCB05]/40 rounded-2xl px-2 py-1 shadow-lg">
          {QUICK_EMOJIS.map((item) => (
            <button
              key={item.emoji}
              type="button"
              onClick={() => handleSendQuickEmote(item.emoji, item.text)}
              className="android-btn-press flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-extrabold text-white"
            >
              <span className="text-sm leading-none">{item.emoji}</span>
              <span className="hidden sm:inline text-[10px] text-amber-200">{item.text}</span>
            </button>
          ))}
        </div>
      </footer>

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
