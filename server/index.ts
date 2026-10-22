import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import {
  EmoteEvent,
  FactionColor,
  GameMode,
  GameState,
  TURN_ORDER,
  applyDiceRoll,
  createInitialGameState,
  executeTokenMove,
  selectBestAIMove,
} from '../src/engine/ludoEngine';
import {
  MONETIZATION_PIPELINE_FLAGS,
  STAGED_STORE_CATALOG,
  requestStagedCheckout,
} from '../src/config/monetizationPipeline';

interface OnlineRoom {
  roomId: string;
  isPublic: boolean;
  hostSocketId: string;
  hostName: string;
  state: GameState;
  socketToColor: Map<string, FactionColor>;
  aiTimer?: NodeJS.Timeout;
}

const rooms = new Map<string, OnlineRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `WAR${suffix}`;
}

function getPublicRoomSummaries() {
  const list = [];
  for (const room of rooms.values()) {
    if (room.isPublic && room.state.status !== 'finished') {
      list.push({
        roomId: room.roomId,
        mode: room.state.mode,
        hostName: room.hostName,
        playerCount: room.socketToColor.size,
        maxPlayers: 4,
        status: room.state.status,
      });
    }
  }
  return list;
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: { origin: '*' },
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      service: 'Ludo Warrior Realtime Server',
      status: 'ok',
      activeRooms: rooms.size,
      zeroAds: MONETIZATION_PIPELINE_FLAGS.ZERO_ADS_ENFORCED,
      monetizationPipelineEnabled: MONETIZATION_PIPELINE_FLAGS.MASTER_MONETIZATION_ENABLED,
    });
  });

  app.get('/api/pipeline/monetization', (_req, res) => {
    res.json({
      flags: MONETIZATION_PIPELINE_FLAGS,
      catalog: STAGED_STORE_CATALOG,
      directive: 'All purchase pipelines are staged and switched OFF for future upgrades.',
    });
  });

  app.post('/api/pipeline/checkout', (req, res) => {
    const sku = req.body?.sku ?? 'unknown';
    res.json(requestStagedCheckout(sku));
  });

  const scheduleOnlineAITurnIfNeeded = (room: OnlineRoom) => {
    if (room.aiTimer) clearTimeout(room.aiTimer);
    if (room.state.status !== 'playing') return;

    const currentPlayer = room.state.players[room.state.currentTurn];
    if (!currentPlayer || !currentPlayer.isAI) return;

    room.aiTimer = setTimeout(() => {
      if (room.state.status !== 'playing') return;

      if (room.state.turnPhase === 'ROLL') {
        const { rolled, validTokenIndices } = applyDiceRoll(room.state);
        io.to(room.roomId).emit('game:rolled', {
          rolled,
          state: room.state,
        });

        if (validTokenIndices.length > 0) {
          room.aiTimer = setTimeout(() => {
            const bestIdx = selectBestAIMove(room.state);
            const result = executeTokenMove(room.state, bestIdx);
            io.to(room.roomId).emit('game:moved', {
              result,
              state: room.state,
            });
            scheduleOnlineAITurnIfNeeded(room);
          }, 900);
        } else {
          scheduleOnlineAITurnIfNeeded(room);
        }
      }
    }, 850);
  };

  io.on('connection', (socket) => {
    socket.emit('lobby:rooms', getPublicRoomSummaries());

    socket.on('lobby:list', () => {
      socket.emit('lobby:rooms', getPublicRoomSummaries());
    });

    const leaveCurrentRooms = () => {
      for (const [roomId, room] of rooms.entries()) {
        if (room.socketToColor.has(socket.id)) {
          const color = room.socketToColor.get(socket.id)!;
          room.socketToColor.delete(socket.id);
          socket.leave(roomId);

          if (room.socketToColor.size === 0) {
            if (room.aiTimer) clearTimeout(room.aiTimer);
            rooms.delete(roomId);
          } else {
            room.state.players[color].isAI = true;
            room.state.players[color].name = `${room.state.players[color].name} (Bot)`;
            io.to(roomId).emit('game:state', room.state);
            scheduleOnlineAITurnIfNeeded(room);
          }
        }
      }
      io.emit('lobby:rooms', getPublicRoomSummaries());
    };

    socket.on(
      'room:create',
      (payload: { commanderName: string; mode: GameMode; isPublic: boolean }) => {
        leaveCurrentRooms();
        const roomId = generateRoomCode();
        const hostName = payload.commanderName?.trim() || 'Player 1';
        const mode = payload.mode || 'classic';

        const state = createInitialGameState({
          roomId,
          mode,
          playerConfigs: [
            { color: 'red', name: hostName, isAI: false, aiDifficulty: 'hard', active: true },
            { color: 'green', name: 'Green Bot', isAI: true, aiDifficulty: 'hard', active: true },
            { color: 'yellow', name: 'Yellow Bot', isAI: true, aiDifficulty: 'hard', active: true },
            { color: 'blue', name: 'Blue Bot', isAI: true, aiDifficulty: 'hard', active: true },
          ],
        });

        const room: OnlineRoom = {
          roomId,
          isPublic: Boolean(payload.isPublic),
          hostSocketId: socket.id,
          hostName,
          state,
          socketToColor: new Map([[socket.id, 'red']]),
        };

        rooms.set(roomId, room);
        socket.join(roomId);
        socket.emit('room:joined', {
          roomId,
          assignedColor: 'red',
          state: room.state,
        });
        io.emit('lobby:rooms', getPublicRoomSummaries());
      }
    );

    socket.on('room:join', (payload: { roomId: string; commanderName: string }) => {
      const code = (payload.roomId || '').trim().toUpperCase();
      const room = rooms.get(code);
      if (!room) return;

      leaveCurrentRooms();

      const availableColor =
        TURN_ORDER.find((c) => room.state.players[c].isAI) ?? 'green';
      const playerName = payload.commanderName?.trim() || `Player ${availableColor}`;

      room.state.players[availableColor].isAI = false;
      room.state.players[availableColor].name = playerName;
      room.socketToColor.set(socket.id, availableColor);

      socket.join(code);
      socket.emit('room:joined', {
        roomId: code,
        assignedColor: availableColor,
        state: room.state,
      });

      io.to(code).emit('game:state', room.state);
      io.emit('lobby:rooms', getPublicRoomSummaries());
    });

    socket.on('room:quickmatch', (payload: { commanderName: string; mode: GameMode }) => {
      let targetRoom: OnlineRoom | undefined;
      for (const r of rooms.values()) {
        if (r.isPublic && r.socketToColor.size < 4 && r.state.status === 'playing') {
          targetRoom = r;
          break;
        }
      }

      if (targetRoom) {
        leaveCurrentRooms();
        const availableColor =
          TURN_ORDER.find((c) => targetRoom!.state.players[c].isAI) ?? 'green';
        targetRoom.state.players[availableColor].isAI = false;
        targetRoom.state.players[availableColor].name =
          payload.commanderName?.trim() || 'Online Player';
        targetRoom.socketToColor.set(socket.id, availableColor);

        socket.join(targetRoom.roomId);
        socket.emit('room:joined', {
          roomId: targetRoom.roomId,
          assignedColor: availableColor,
          state: targetRoom.state,
        });
        io.to(targetRoom.roomId).emit('game:state', targetRoom.state);
        io.emit('lobby:rooms', getPublicRoomSummaries());
      } else {
        const roomId = generateRoomCode();
        const hostName = payload.commanderName?.trim() || 'Player 1';
        const state = createInitialGameState({
          roomId,
          mode: payload.mode || 'classic',
          playerConfigs: [
            { color: 'red', name: hostName, isAI: false, aiDifficulty: 'hard', active: true },
            { color: 'green', name: 'Green Bot', isAI: true, aiDifficulty: 'hard', active: true },
            { color: 'yellow', name: 'Yellow Bot', isAI: true, aiDifficulty: 'hard', active: true },
            { color: 'blue', name: 'Blue Bot', isAI: true, aiDifficulty: 'hard', active: true },
          ],
        });
        const room: OnlineRoom = {
          roomId,
          isPublic: true,
          hostSocketId: socket.id,
          hostName,
          state,
          socketToColor: new Map([[socket.id, 'red']]),
        };
        rooms.set(roomId, room);
        socket.join(roomId);
        socket.emit('room:joined', {
          roomId,
          assignedColor: 'red',
          state: room.state,
        });
        io.emit('lobby:rooms', getPublicRoomSummaries());
      }
    });

    socket.on('room:start_with_bots', (payload: { roomId: string }) => {
      const room = rooms.get(payload.roomId);
      if (!room) return;
      io.to(room.roomId).emit('game:state', room.state);
      scheduleOnlineAITurnIfNeeded(room);
    });

    socket.on('room:leave', () => {
      leaveCurrentRooms();
    });

    socket.on('game:roll', (payload: { roomId: string }) => {
      const room = rooms.get(payload.roomId);
      if (!room || room.state.status !== 'playing' || room.state.turnPhase !== 'ROLL') return;

      const playerColor = room.socketToColor.get(socket.id);
      if (playerColor !== room.state.currentTurn) return;

      const { rolled } = applyDiceRoll(room.state);
      io.to(room.roomId).emit('game:rolled', {
        rolled,
        state: room.state,
      });

      scheduleOnlineAITurnIfNeeded(room);
    });

    socket.on('game:move', (payload: { roomId: string; tokenIndex: number }) => {
      const room = rooms.get(payload.roomId);
      if (!room || room.state.status !== 'playing' || room.state.turnPhase !== 'MOVE') return;

      const playerColor = room.socketToColor.get(socket.id);
      if (playerColor !== room.state.currentTurn) return;

      const result = executeTokenMove(room.state, payload.tokenIndex);
      if (!result.valid) return;

      io.to(room.roomId).emit('game:moved', {
        result,
        state: room.state,
      });

      scheduleOnlineAITurnIfNeeded(room);
    });

    socket.on(
      'game:emote',
      (payload: { roomId: string; emote: string; message?: string }) => {
        const room = rooms.get(payload.roomId);
        if (!room) return;
        const color = room.socketToColor.get(socket.id) ?? room.state.currentTurn;
        const ev: EmoteEvent = {
          id: `emote-${Date.now()}-${Math.random()}`,
          color,
          playerName: room.state.players[color]?.name ?? 'Player',
          emote: payload.emote,
          message: payload.message,
          timestamp: Date.now(),
        };
        io.to(room.roomId).emit('game:emote', ev);
      }
    );

    socket.on('disconnect', () => {
      leaveCurrentRooms();
    });
  });

  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      allowedHosts: true,
      hmr: {
        server: httpServer,
      },
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const PORT = Number(process.env.PORT) || 5173;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`⚔️ Ludo Warrior Server & Live Preview running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Ludo Warrior server:', err);
  process.exit(1);
});
