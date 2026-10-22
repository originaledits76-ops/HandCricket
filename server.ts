import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  MatchState,
  MatchSettings,
  ClientMessage,
  ServerMessage,
  BallResolution,
  BallHistory,
  Player,
} from './src/types/game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

interface ActiveRoom {
  id: string;
  state: MatchState;
  clients: Map<string, WebSocket>;
  pendingPicks: Map<string, number>;
  timer: NodeJS.Timeout | null;
  timeoutWait: NodeJS.Timeout | null;
}

const rooms = new Map<string, ActiveRoom>();

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastToRoom(room: ActiveRoom, msg: ServerMessage) {
  const payload = JSON.stringify(msg);
  for (const client of room.clients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function sendToClient(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function stopRoomTimer(room: ActiveRoom) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
  if (room.timeoutWait) {
    clearTimeout(room.timeoutWait);
    room.timeoutWait = null;
  }
}

function startBallTimer(room: ActiveRoom) {
  stopRoomTimer(room);
  room.state.timeRemaining = 10;
  room.state.ballActive = true;
  room.state.p1ChoiceLocked = false;
  room.state.p2ChoiceLocked = false;
  room.pendingPicks.clear();

  broadcastToRoom(room, {
    type: 'STATE_UPDATE',
    payload: { state: room.state },
  });

  room.timer = setInterval(() => {
    room.state.timeRemaining -= 1;
    if (room.state.timeRemaining <= 0) {
      stopRoomTimer(room);
      handleBallTimeout(room);
    } else {
      broadcastToRoom(room, {
        type: 'TIMER_TICK',
        payload: { timeRemaining: room.state.timeRemaining },
      });
    }
  }, 1000);
}

function handleBallTimeout(room: ActiveRoom) {
  const p1 = room.state.players.p1;
  const p2 = room.state.players.p2;
  if (!p1 || !p2) return;

  // Auto-pick random choice (0..6) if player didn't pick
  if (!room.pendingPicks.has(p1.id)) {
    room.pendingPicks.set(p1.id, Math.floor(Math.random() * 7));
    room.state.p1ChoiceLocked = true;
  }
  if (!room.pendingPicks.has(p2.id)) {
    room.pendingPicks.set(p2.id, Math.floor(Math.random() * 7));
    room.state.p2ChoiceLocked = true;
  }

  resolveBall(room);
}

function getCommentary(batterChoice: number, bowlerChoice: number, outcome: 'RUNS' | 'DEFENDED' | 'OUT', runsAdded: number): string {
  if (outcome === 'OUT') {
    if (batterChoice === 0 && bowlerChoice === 0) {
      return 'EDGE & GONE! The defensive block takes an outside edge straight to the slips!';
    }
    const dismissals = [
      'CLEAN BOWLED! Both flashed the same number and the stumps are shattered!',
      'CAUGHT AT THE BOUNDARY! Straight down the throat of long-on!',
      'TRAPPED IN FRONT! Plumb LBW as the bowler outfoxes the batter!',
      'EDGED AND TAKEN! Wicketkeeper takes a flying stunner!',
    ];
    return dismissals[Math.floor(Math.random() * dismissals.length)];
  }

  if (outcome === 'DEFENDED') {
    return 'SOLID DEFENSE! Batter stays compact with a defensive block. 0 runs added.';
  }

  if (runsAdded === 6) {
    return 'MAXIMUM! Hammered way back into the top tier for a towering SIX!';
  }
  if (runsAdded === 4) {
    return 'CRACKING BOUNDARY! Pierces the cover gap with pristine timing for FOUR!';
  }
  if (runsAdded === 3) {
    return 'Superb placement! Hard running between the wickets earns 3 quick runs!';
  }
  if (runsAdded === 2) {
    return 'Soft hands into deep square leg, easily turning 1 into 2!';
  }
  if (runsAdded === 1) {
    return 'Tucked off the hips for a single to rotate the strike.';
  }
  return 'Dot ball! No run conceded.';
}

function resolveBall(room: ActiveRoom) {
  stopRoomTimer(room);
  room.state.ballActive = false;

  const currentInnings = room.state.phase === 'INNINGS_1' ? room.state.innings1 : room.state.innings2;
  const batterId = currentInnings.batterId;
  const bowlerId = currentInnings.bowlerId;

  const batterChoice = room.pendingPicks.get(batterId) ?? 0;
  const bowlerChoice = room.pendingPicks.get(bowlerId) ?? 0;

  const p1 = room.state.players.p1;
  const p2 = room.state.players.p2!;
  const batter = p1.id === batterId ? p1 : p2;
  const bowler = p1.id === bowlerId ? p1 : p2;

  let outcome: 'RUNS' | 'DEFENDED' | 'OUT' = 'RUNS';
  let runsAdded = 0;
  let isWicket = false;
  let isDefendedSurvive = false;

  // RULE LOGIC
  if (batterChoice === 0 && bowlerChoice === 0) {
    // Clarified 0 rule: defensive with 30% chance of wicket
    const wicketRoll = Math.random();
    if (wicketRoll < 0.3) {
      outcome = 'OUT';
      isWicket = true;
    } else {
      outcome = 'DEFENDED';
      isDefendedSurvive = true;
      runsAdded = 0;
    }
  } else if (batterChoice === bowlerChoice) {
    // Matching 1..6 -> Instant OUT!
    outcome = 'OUT';
    isWicket = true;
  } else {
    // Numbers do not match -> runs added
    outcome = 'RUNS';
    runsAdded = batterChoice;
  }

  // Update innings stats
  if (isWicket) {
    currentInnings.wickets += 1;
  } else {
    currentInnings.runs += runsAdded;
  }
  currentInnings.ballsBowled += 1;

  const ballIndex = currentInnings.ballsBowled;
  const overIndex = Math.floor((ballIndex - 1) / 6);
  const ballInOver = ((ballIndex - 1) % 6) + 1;

  const historyEntry: BallHistory = {
    ballIndex,
    overIndex,
    ballInOver,
    batterChoice,
    bowlerChoice,
    outcome,
    runs: runsAdded,
    batterId,
    bowlerId,
  };
  currentInnings.history.push(historyEntry);

  const resolution: BallResolution = {
    batterChoice,
    bowlerChoice,
    outcome,
    runsAdded,
    batterName: batter.name,
    bowlerName: bowler.name,
    isWicket,
    isDefendedSurvive,
    commentary: getCommentary(batterChoice, bowlerChoice, outcome, runsAdded),
  };

  room.state.lastBall = resolution;

  // Broadcast the dramatic reveal immediately
  broadcastToRoom(room, {
    type: 'BALL_REVEAL',
    payload: { resolution, state: room.state },
  });

  // Check state transitions after brief pause for reveal animation
  setTimeout(() => {
    checkMatchProgress(room);
  }, 2200);
}

function checkMatchProgress(room: ActiveRoom) {
  const settings = room.state.settings;
  const p1 = room.state.players.p1;
  const p2 = room.state.players.p2!;

  if (room.state.phase === 'INNINGS_1') {
    const inn = room.state.innings1;
    const allOut = inn.wickets >= settings.wickets;
    const oversDone = settings.overs > 0 && inn.ballsBowled >= settings.overs * 6;

    if (allOut || oversDone) {
      // End of 1st Innings
      room.state.target = inn.runs + 1;
      room.state.phase = 'INNINGS_BREAK';

      // Setup 2nd Innings with reversed roles
      room.state.innings2 = {
        batterId: inn.bowlerId,
        bowlerId: inn.batterId,
        runs: 0,
        wickets: 0,
        ballsBowled: 0,
        history: [],
      };

      broadcastToRoom(room, {
        type: 'STATE_UPDATE',
        payload: { state: room.state },
      });

      // Pause 3.5s for innings break message, then begin Innings 2
      setTimeout(() => {
        room.state.phase = 'INNINGS_2';
        room.state.lastBall = null;
        startBallTimer(room);
      }, 3500);
      return;
    }

    // Continue Innings 1
    startBallTimer(room);
  } else if (room.state.phase === 'INNINGS_2') {
    const inn2 = room.state.innings2;
    const target = room.state.target!;
    const chasingPlayer = p1.id === inn2.batterId ? p1 : p2;
    const defendingPlayer = p1.id === inn2.bowlerId ? p1 : p2;

    // Check if target chased
    if (inn2.runs >= target) {
      room.state.phase = 'COMPLETED';
      room.state.winnerId = chasingPlayer.id;
      const wicketsLeft = settings.wickets - inn2.wickets;
      room.state.winReason = `${chasingPlayer.name} won by ${wicketsLeft} wicket${wicketsLeft > 1 ? 's' : ''}! Target chased successfully.`;
      broadcastToRoom(room, {
        type: 'STATE_UPDATE',
        payload: { state: room.state },
      });
      return;
    }

    const allOut = inn2.wickets >= settings.wickets;
    const oversDone = settings.overs > 0 && inn2.ballsBowled >= settings.overs * 6;

    if (allOut || oversDone) {
      // Innings 2 finished without reaching target
      room.state.phase = 'COMPLETED';
      if (inn2.runs === target - 1) {
        room.state.winnerId = null;
        room.state.winReason = 'THRILLING TIE! Scores are dead level!';
      } else {
        const runMargin = target - 1 - inn2.runs;
        room.state.winnerId = defendingPlayer.id;
        room.state.winReason = `${defendingPlayer.name} won by ${runMargin} run${runMargin > 1 ? 's' : ''}! Great defensive bowling.`;
      }

      broadcastToRoom(room, {
        type: 'STATE_UPDATE',
        payload: { state: room.state },
      });
      return;
    }

    // Continue Innings 2
    startBallTimer(room);
  }
}

// WebSocket Connection Management
wss.on('connection', (ws) => {
  let boundRoomId: string | null = null;
  let boundPlayerId: string | null = null;

  ws.on('message', (data) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString());

      if (msg.type === 'PING') {
        sendToClient(ws, { type: 'PONG' });
        return;
      }

      if (msg.type === 'CREATE_ROOM') {
        const roomId = generateRoomId();
        const playerId = 'player_' + Math.random().toString(36).substring(2, 9);
        const p1: Player = {
          id: playerId,
          name: msg.payload.playerName || 'Player 1',
          avatar: msg.payload.avatar || '🏏',
          isHost: true,
          connected: true,
        };

        const initialMatchState: MatchState = {
          roomId,
          settings: msg.payload.settings,
          players: {
            p1,
            p2: null,
          },
          phase: 'WAITING',
          toss: {
            callerId: playerId,
            call: null,
            result: null,
            winnerId: null,
            decision: null,
            phase: 'CALLING',
          },
          innings1: {
            batterId: '',
            bowlerId: '',
            runs: 0,
            wickets: 0,
            ballsBowled: 0,
            history: [],
          },
          innings2: {
            batterId: '',
            bowlerId: '',
            runs: 0,
            wickets: 0,
            ballsBowled: 0,
            history: [],
          },
          target: null,
          winnerId: null,
          winReason: null,
          timeRemaining: 10,
          p1ChoiceLocked: false,
          p2ChoiceLocked: false,
          lastBall: null,
          ballActive: false,
        };

        const room: ActiveRoom = {
          id: roomId,
          state: initialMatchState,
          clients: new Map([[playerId, ws]]),
          pendingPicks: new Map(),
          timer: null,
          timeoutWait: null,
        };

        rooms.set(roomId, room);
        boundRoomId = roomId;
        boundPlayerId = playerId;

        sendToClient(ws, {
          type: 'ROOM_CREATED',
          payload: { roomId, playerId, state: initialMatchState },
        });
        return;
      }

      if (msg.type === 'JOIN_ROOM') {
        const targetId = msg.payload.roomId.trim().toUpperCase();
        const room = rooms.get(targetId);

        if (!room) {
          sendToClient(ws, { type: 'ERROR', payload: { message: `Room ${targetId} not found.` } });
          return;
        }

        if (room.state.players.p2 !== null) {
          sendToClient(ws, { type: 'ERROR', payload: { message: 'This room is already full (2 players).' } });
          return;
        }

        const playerId = 'player_' + Math.random().toString(36).substring(2, 9);
        const p2: Player = {
          id: playerId,
          name: msg.payload.playerName || 'Player 2',
          avatar: msg.payload.avatar || '⚡',
          isHost: false,
          connected: true,
        };

        room.state.players.p2 = p2;
        room.clients.set(playerId, ws);
        boundRoomId = room.id;
        boundPlayerId = playerId;

        // When 2 players join, start Toss Phase! Caller is Player 2 (host tosses, guest calls)
        room.state.phase = 'TOSS';
        room.state.toss = {
          callerId: p2.id,
          call: null,
          result: null,
          winnerId: null,
          decision: null,
          phase: 'CALLING',
        };

        sendToClient(ws, {
          type: 'ROOM_JOINED',
          payload: { roomId: room.id, playerId, state: room.state },
        });

        broadcastToRoom(room, {
          type: 'STATE_UPDATE',
          payload: { state: room.state },
        });
        return;
      }

      // In-game actions requiring valid room
      if (!boundRoomId || !boundPlayerId) return;
      const room = rooms.get(boundRoomId);
      if (!room) return;

      if (msg.type === 'TOSS_CALL') {
        if (room.state.phase !== 'TOSS' || room.state.toss.phase !== 'CALLING') return;
        if (boundPlayerId !== room.state.toss.callerId) return;

        const call = msg.payload.call;
        room.state.toss.call = call;
        room.state.toss.phase = 'FLIPPING';

        broadcastToRoom(room, {
          type: 'STATE_UPDATE',
          payload: { state: room.state },
        });

        // 1.5s spin suspense
        setTimeout(() => {
          const coinResult: 'HEADS' | 'TAILS' = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
          const p1 = room.state.players.p1;
          const p2 = room.state.players.p2!;
          const tossWinner = call === coinResult ? p2 : p1;

          room.state.toss.result = coinResult;
          room.state.toss.winnerId = tossWinner.id;
          room.state.toss.phase = 'DECIDING';

          broadcastToRoom(room, {
            type: 'STATE_UPDATE',
            payload: { state: room.state },
          });
        }, 1500);
        return;
      }

      if (msg.type === 'TOSS_DECISION') {
        if (room.state.phase !== 'TOSS' || room.state.toss.phase !== 'DECIDING') return;
        if (boundPlayerId !== room.state.toss.winnerId) return;

        const decision = msg.payload.decision;
        room.state.toss.decision = decision;
        room.state.toss.phase = 'COMPLETED';

        const p1 = room.state.players.p1;
        const p2 = room.state.players.p2!;
        const winner = boundPlayerId === p1.id ? p1 : p2;
        const loser = boundPlayerId === p1.id ? p2 : p1;

        const batterId = decision === 'BAT' ? winner.id : loser.id;
        const bowlerId = decision === 'BAT' ? loser.id : winner.id;

        room.state.innings1 = {
          batterId,
          bowlerId,
          runs: 0,
          wickets: 0,
          ballsBowled: 0,
          history: [],
        };

        // Transition to Innings 1
        room.state.phase = 'INNINGS_1';
        startBallTimer(room);
        return;
      }

      if (msg.type === 'PICK_NUMBER') {
        const num = msg.payload.number;
        if (num < 0 || num > 6) return;
        if (room.state.phase !== 'INNINGS_1' && room.state.phase !== 'INNINGS_2') return;
        if (!room.state.ballActive) return;

        room.pendingPicks.set(boundPlayerId, num);
        if (boundPlayerId === room.state.players.p1.id) {
          room.state.p1ChoiceLocked = true;
        } else if (room.state.players.p2 && boundPlayerId === room.state.players.p2.id) {
          room.state.p2ChoiceLocked = true;
        }

        // Send state update showing the other player that choice is locked (without revealing the number)
        broadcastToRoom(room, {
          type: 'STATE_UPDATE',
          payload: { state: room.state },
        });

        // Check if both players have chosen
        if (
          room.state.players.p2 &&
          room.pendingPicks.has(room.state.players.p1.id) &&
          room.pendingPicks.has(room.state.players.p2.id)
        ) {
          resolveBall(room);
        }
        return;
      }

      if (msg.type === 'REQUEST_REMATCH') {
        if (room.state.phase !== 'COMPLETED') return;

        // Reset game state for rematch
        const p1 = room.state.players.p1;
        const p2 = room.state.players.p2!;
        stopRoomTimer(room);

        room.state.phase = 'TOSS';
        room.state.toss = {
          callerId: p1.id, // Alternate caller
          call: null,
          result: null,
          winnerId: null,
          decision: null,
          phase: 'CALLING',
        };
        room.state.innings1 = { batterId: '', bowlerId: '', runs: 0, wickets: 0, ballsBowled: 0, history: [] };
        room.state.innings2 = { batterId: '', bowlerId: '', runs: 0, wickets: 0, ballsBowled: 0, history: [] };
        room.state.target = null;
        room.state.winnerId = null;
        room.state.winReason = null;
        room.state.lastBall = null;
        room.state.p1ChoiceLocked = false;
        room.state.p2ChoiceLocked = false;
        room.pendingPicks.clear();

        broadcastToRoom(room, {
          type: 'STATE_UPDATE',
          payload: { state: room.state },
        });
        return;
      }
    } catch (err) {
      console.error('Socket error:', err);
    }
  });

  ws.on('close', () => {
    if (boundRoomId && boundPlayerId) {
      const room = rooms.get(boundRoomId);
      if (room) {
        room.clients.delete(boundPlayerId);
        if (room.state.players.p1?.id === boundPlayerId) {
          room.state.players.p1.connected = false;
        } else if (room.state.players.p2?.id === boundPlayerId) {
          room.state.players.p2.connected = false;
        }
        broadcastToRoom(room, {
          type: 'STATE_UPDATE',
          payload: { state: room.state },
        });
      }
    }
  });
});

// Mount Vite or serve static assets
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🏏 Hand Cricket server running on port ${PORT}`);
  });
}

startServer();
