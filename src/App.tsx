/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  MatchState,
  MatchSettings,
  ServerMessage,
  ClientMessage,
  BallResolution,
  BallHistory,
  Player,
} from './types/game';
import { sound } from './utils/audio';
import { HandCricketBot, type BotDifficulty } from './utils/botEngine';
import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { WaitingView } from './components/WaitingView';
import { TossModal } from './components/TossModal';
import { MatchView } from './components/MatchView';
import { GameOverModal } from './components/GameOverModal';
import { RulesModal } from './components/RulesModal';
import { ShareModal } from './components/ShareModal';
import { DevModal } from './components/DevModal';
import { DevOverlay } from './components/DevOverlay';

export default function App() {
  const [screen, setScreen] = useState<'LOBBY' | 'WAITING' | 'MATCH'>('LOBBY');
  const [isSoloMode, setIsSoloMode] = useState<boolean>(false);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('player_local');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Tools
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState<boolean>(false);
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    return sessionStorage.getItem('hc_dev_mode') === 'true';
  });
  const [opponentLivePick, setOpponentLivePick] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => sound.enabled);

  const botEngineRef = useRef<HandCricketBot | null>(null);
  const soloTimerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Update Browser URL helper
  const updateUrlForRoom = (roomId: string | null) => {
    if (typeof window === 'undefined') return;
    if (roomId) {
      window.history.pushState(null, '', `/${roomId}`);
    } else {
      window.history.pushState(null, '', '/');
    }
  };

  const toggleSound = () => {
    const val = sound.toggle();
    setSoundEnabled(val);
  };

  // Developer mode unlock
  const handleDevUnlocked = () => {
    setIsDevMode(true);
    sessionStorage.setItem('hc_dev_mode', 'true');
    // If socket is open, authenticate with server
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'AUTHENTICATE_DEV',
        payload: { passcode: '180457' },
      }));
    }
  };

  const handleDisableDevMode = () => {
    setIsDevMode(false);
    sessionStorage.removeItem('hc_dev_mode');
    setOpponentLivePick(null);
  };

  // Setup WebSocket connection for online multiplayer
  const connectSocket = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return socketRef.current;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // If dev mode is already active, authenticate socket immediately
      if (sessionStorage.getItem('hc_dev_mode') === 'true') {
        ws.send(JSON.stringify({
          type: 'AUTHENTICATE_DEV',
          payload: { passcode: '180457' },
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        if (msg.type === 'ROOM_CREATED') {
          setCurrentUserId(msg.payload.playerId);
          setMatchState(msg.payload.state);
          setScreen('WAITING');
          updateUrlForRoom(msg.payload.roomId);
          setIsShareModalOpen(true); // Auto-open share modal for easy WhatsApp/link sharing!
        } else if (msg.type === 'ROOM_JOINED') {
          setCurrentUserId(msg.payload.playerId);
          setMatchState(msg.payload.state);
          setScreen('MATCH');
          updateUrlForRoom(msg.payload.roomId);
        } else if (msg.type === 'STATE_UPDATE') {
          setMatchState(msg.payload.state);
          if (msg.payload.state.phase !== 'WAITING') {
            setScreen('MATCH');
          }
          // Clear live pick when new ball starts
          if (msg.payload.state.ballActive && !msg.payload.state.p1ChoiceLocked && !msg.payload.state.p2ChoiceLocked) {
            setOpponentLivePick(null);
          }
        } else if (msg.type === 'BALL_REVEAL') {
          setMatchState(msg.payload.state);
        } else if (msg.type === 'TIMER_TICK') {
          setMatchState((prev) => (prev ? { ...prev, timeRemaining: msg.payload.timeRemaining } : prev));
        } else if (msg.type === 'DEV_OPPONENT_PICK') {
          // Secret real-time opponent pick for developer!
          setOpponentLivePick(msg.payload.opponentPick);
        } else if (msg.type === 'ERROR') {
          setErrorMessage(msg.payload.message);
        }
      } catch (err) {
        console.error('Failed to parse server message', err);
      }
    };

    ws.onerror = () => {
      setErrorMessage('Network connection lost. Please try again.');
    };

    socketRef.current = ws;
    return ws;
  }, []);

  const sendSocketMessage = (msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      const ws = connectSocket();
      ws.onopen = () => {
        ws.send(JSON.stringify(msg));
      };
    }
  };

  // Check URL on initial load for direct room link (e.g. /ABCDE or ?room=ABCDE)
  useEffect(() => {
    const path = window.location.pathname.replace(/^\//, '').trim().toUpperCase();
    const params = new URLSearchParams(window.location.search);
    const queryRoom = params.get('room')?.trim().toUpperCase();
    const candidateCode = queryRoom || (path.length >= 4 && path.length <= 8 ? path : null);

    if (candidateCode) {
      // Connect and join candidate room
      const savedName = localStorage.getItem('hc_player_name') || 'Guest';
      handleJoinRoom(candidateCode, savedName, '');
    }
  }, []);

  // ONLINE: Create Room
  const handleCreateRoom = (playerName: string, avatar: string, settings: MatchSettings) => {
    setIsSoloMode(false);
    setErrorMessage(null);
    setOpponentLivePick(null);
    const ws = connectSocket();
    const payload: ClientMessage = {
      type: 'CREATE_ROOM',
      payload: { playerName, avatar, settings },
    };
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      ws.onopen = () => ws.send(JSON.stringify(payload));
    }
  };

  // ONLINE: Join Room
  const handleJoinRoom = (roomId: string, playerName: string, avatar: string) => {
    setIsSoloMode(false);
    setErrorMessage(null);
    setOpponentLivePick(null);
    const ws = connectSocket();
    const payload: ClientMessage = {
      type: 'JOIN_ROOM',
      payload: { roomId, playerName, avatar },
    };
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      ws.onopen = () => ws.send(JSON.stringify(payload));
    }
  };

  // SOLO PRACTICE ENGINE
  const stopSoloTimer = () => {
    if (soloTimerRef.current) {
      clearInterval(soloTimerRef.current);
      soloTimerRef.current = null;
    }
  };

  const startSoloBallTimer = useCallback((stateToUpdate?: MatchState) => {
    stopSoloTimer();
    setOpponentLivePick(null);
    setMatchState((prev) => {
      const current = stateToUpdate || prev;
      if (!current) return prev;
      return {
        ...current,
        timeRemaining: 10,
        ballActive: true,
        p1ChoiceLocked: false,
        p2ChoiceLocked: false,
      };
    });

    soloTimerRef.current = setInterval(() => {
      setMatchState((prev) => {
        if (!prev) return null;
        if (prev.timeRemaining <= 1) {
          stopSoloTimer();
          handleSoloTimeout(prev);
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  }, []);

  const handleStartBotPractice = (
    playerName: string,
    avatar: string,
    settings: MatchSettings,
    diff: BotDifficulty
  ) => {
    setIsSoloMode(true);
    setErrorMessage(null);
    setOpponentLivePick(null);
    botEngineRef.current = new HandCricketBot(diff);

    const user: Player = {
      id: 'human_player',
      name: playerName || 'Player',
      avatar: '',
      isHost: true,
      connected: true,
    };

    const botNames = { rookie: 'Rookie Bot', pro: 'Pro Bot', legend: 'Legend Bot' };
    const bot: Player = {
      id: 'bot_player',
      name: botNames[diff],
      avatar: '',
      isHost: false,
      connected: true,
      isBot: true,
    };

    setCurrentUserId(user.id);

    const soloState: MatchState = {
      roomId: 'SOLO',
      settings,
      players: { p1: user, p2: bot },
      phase: 'TOSS',
      toss: {
        callerId: user.id,
        call: null,
        result: null,
        winnerId: null,
        decision: null,
        phase: 'CALLING',
      },
      innings1: { batterId: '', bowlerId: '', runs: 0, wickets: 0, ballsBowled: 0, history: [] },
      innings2: { batterId: '', bowlerId: '', runs: 0, wickets: 0, ballsBowled: 0, history: [] },
      target: null,
      winnerId: null,
      winReason: null,
      timeRemaining: 10,
      p1ChoiceLocked: false,
      p2ChoiceLocked: false,
      lastBall: null,
      ballActive: false,
      rematchVotes: [],
    };

    setMatchState(soloState);
    setScreen('MATCH');
  };

  const handleSoloTossCall = (call: 'HEADS' | 'TAILS') => {
    setMatchState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        toss: { ...prev.toss, call, phase: 'FLIPPING' },
      };
    });

    setTimeout(() => {
      const coinResult: 'HEADS' | 'TAILS' = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
      const humanWon = call === coinResult;
      const winnerId = humanWon ? 'human_player' : 'bot_player';

      setMatchState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          toss: {
            ...prev.toss,
            result: coinResult,
            winnerId,
            phase: 'DECIDING',
          },
        };
      });

      if (!humanWon) {
        setTimeout(() => {
          const botDecision: 'BAT' | 'BOWL' = Math.random() < 0.5 ? 'BAT' : 'BOWL';
          handleSoloTossDecision(botDecision, winnerId);
        }, 1200);
      }
    }, 1500);
  };

  const handleSoloTossDecision = (decision: 'BAT' | 'BOWL', deciderId = 'human_player') => {
    setMatchState((prev) => {
      if (!prev) return null;
      const batterId =
        decision === 'BAT'
          ? deciderId
          : deciderId === 'human_player'
          ? 'bot_player'
          : 'human_player';
      const bowlerId = batterId === 'human_player' ? 'bot_player' : 'human_player';

      const nextState: MatchState = {
        ...prev,
        phase: 'INNINGS_1',
        toss: { ...prev.toss, decision, phase: 'COMPLETED' },
        innings1: {
          batterId,
          bowlerId,
          runs: 0,
          wickets: 0,
          ballsBowled: 0,
          history: [],
        },
      };

      setTimeout(() => startSoloBallTimer(nextState), 50);
      return nextState;
    });
  };

  const pendingHumanPickRef = useRef<number | null>(null);

  const handleSoloPickNumber = (humanPick: number) => {
    if (!matchState || !matchState.ballActive) return;

    pendingHumanPickRef.current = humanPick;
    setMatchState((prev) => (prev ? { ...prev, p1ChoiceLocked: true } : prev));

    setTimeout(() => {
      setMatchState((prev) => (prev ? { ...prev, p2ChoiceLocked: true } : prev));
      resolveSoloBall(humanPick);
    }, 650);
  };

  const handleSoloTimeout = (state: MatchState) => {
    const humanPick = pendingHumanPickRef.current ?? Math.floor(Math.random() * 7);
    resolveSoloBall(humanPick, state);
  };

  const resolveSoloBall = (humanPick: number, overrideState?: MatchState) => {
    stopSoloTimer();
    pendingHumanPickRef.current = null;

    setMatchState((prev) => {
      const cur = overrideState || prev;
      if (!cur) return prev;

      const isFirst = cur.phase === 'INNINGS_1';
      const inn = isFirst ? cur.innings1 : cur.innings2;
      const isHumanBatting = inn.batterId === 'human_player';

      const target = cur.target;
      const ballsLeft =
        cur.settings.overs > 0 ? cur.settings.overs * 6 - inn.ballsBowled : null;
      const playerHistory = inn.history.map((h) => (isHumanBatting ? h.batterChoice : h.bowlerChoice));
      const recentBalls = inn.history.map((h) => (isHumanBatting ? h.bowlerChoice : h.batterChoice));

      const botPick =
        botEngineRef.current?.makePick(
          !isHumanBatting,
          target,
          inn.runs,
          ballsLeft,
          playerHistory,
          recentBalls
        ) ?? Math.floor(Math.random() * 7);

      // In Dev Mode during solo play, show what the bot picked immediately
      if (isDevMode) {
        setOpponentLivePick(botPick);
      }

      const batterChoice = isHumanBatting ? humanPick : botPick;
      const bowlerChoice = isHumanBatting ? botPick : humanPick;

      let outcome: 'RUNS' | 'DEFENDED' | 'OUT' = 'RUNS';
      let runsAdded = 0;
      let isWicket = false;
      let isDefendedSurvive = false;

      if (batterChoice === 0 && bowlerChoice === 0) {
        if (Math.random() < 0.3) {
          outcome = 'OUT';
          isWicket = true;
        } else {
          outcome = 'DEFENDED';
          isDefendedSurvive = true;
          runsAdded = 0;
        }
      } else if (batterChoice === bowlerChoice) {
        outcome = 'OUT';
        isWicket = true;
      } else {
        outcome = 'RUNS';
        runsAdded = batterChoice;
      }

      const newRuns = inn.runs + runsAdded;
      const newWickets = inn.wickets + (isWicket ? 1 : 0);
      const newBalls = inn.ballsBowled + 1;

      const hist: BallHistory = {
        ballIndex: newBalls,
        overIndex: Math.floor((newBalls - 1) / 6),
        ballInOver: ((newBalls - 1) % 6) + 1,
        batterChoice,
        bowlerChoice,
        outcome,
        runs: runsAdded,
        batterId: inn.batterId,
        bowlerId: inn.bowlerId,
      };

      const updatedHistory = [...inn.history, hist];
      const updatedInnings = {
        ...inn,
        runs: newRuns,
        wickets: newWickets,
        ballsBowled: newBalls,
        history: updatedHistory,
      };

      const batter = cur.players.p1.id === inn.batterId ? cur.players.p1 : cur.players.p2!;
      const bowler = cur.players.p1.id === inn.bowlerId ? cur.players.p1 : cur.players.p2!;

      let commentary = '';
      if (outcome === 'OUT') {
        commentary =
          batterChoice === 0 && bowlerChoice === 0
            ? 'Edge and caught behind on the defensive block.'
            : 'Both players picked the same number. Wicket falls.';
      } else if (outcome === 'DEFENDED') {
        commentary = 'Defensive block. 0 runs added.';
      } else if (runsAdded === 6) {
        commentary = 'Maximum six runs scored.';
      } else if (runsAdded === 4) {
        commentary = 'Boundary four runs scored.';
      } else {
        commentary = `Scored ${runsAdded} run${runsAdded > 1 ? 's' : ''}.`;
      }

      const resolution: BallResolution = {
        batterChoice,
        bowlerChoice,
        outcome,
        runsAdded,
        batterName: batter.name,
        bowlerName: bowler.name,
        isWicket,
        isDefendedSurvive,
        commentary,
      };

      const intermediateState: MatchState = {
        ...cur,
        ballActive: false,
        lastBall: resolution,
        innings1: isFirst ? updatedInnings : cur.innings1,
        innings2: !isFirst ? updatedInnings : cur.innings2,
      };

      setTimeout(() => {
        checkSoloProgress(intermediateState);
      }, 2000);

      return intermediateState;
    });
  };

  const checkSoloProgress = (st: MatchState) => {
    const isFirst = st.phase === 'INNINGS_1';
    const settings = st.settings;

    if (isFirst) {
      const inn = st.innings1;
      const allOut = inn.wickets >= settings.wickets;
      const oversDone = settings.overs > 0 && inn.ballsBowled >= settings.overs * 6;

      if (allOut || oversDone) {
        const target = inn.runs + 1;
        const nextState: MatchState = {
          ...st,
          phase: 'INNINGS_BREAK',
          target,
          innings2: {
            batterId: inn.bowlerId,
            bowlerId: inn.batterId,
            runs: 0,
            wickets: 0,
            ballsBowled: 0,
            history: [],
          },
        };
        setMatchState(nextState);

        setTimeout(() => {
          setMatchState((prev) => {
            if (!prev) return null;
            const inn2State: MatchState = {
              ...prev,
              phase: 'INNINGS_2',
              lastBall: null,
            };
            setTimeout(() => startSoloBallTimer(inn2State), 50);
            return inn2State;
          });
        }, 2800);
        return;
      }

      startSoloBallTimer(st);
    } else if (st.phase === 'INNINGS_2') {
      const inn2 = st.innings2;
      const target = st.target!;
      const chasingPlayer = st.players.p1.id === inn2.batterId ? st.players.p1 : st.players.p2!;
      const defendingPlayer = st.players.p1.id === inn2.bowlerId ? st.players.p1 : st.players.p2!;

      if (inn2.runs >= target) {
        setMatchState({
          ...st,
          phase: 'COMPLETED',
          winnerId: chasingPlayer.id,
          winReason: `${chasingPlayer.name} won the match. Target chased down.`,
        });
        return;
      }

      const allOut = inn2.wickets >= settings.wickets;
      const oversDone = settings.overs > 0 && inn2.ballsBowled >= settings.overs * 6;

      if (allOut || oversDone) {
        if (inn2.runs === target - 1) {
          setMatchState({
            ...st,
            phase: 'COMPLETED',
            winnerId: null,
            winReason: 'Match tied. Scores are level.',
          });
        } else {
          setMatchState({
            ...st,
            phase: 'COMPLETED',
            winnerId: defendingPlayer.id,
            winReason: `${defendingPlayer.name} won the match by defending the total.`,
          });
        }
        return;
      }

      startSoloBallTimer(st);
    }
  };

  const handleTossCall = (call: 'HEADS' | 'TAILS') => {
    if (isSoloMode) {
      handleSoloTossCall(call);
    } else {
      sendSocketMessage({ type: 'TOSS_CALL', payload: { call } });
    }
  };

  const handleTossDecision = (decision: 'BAT' | 'BOWL') => {
    if (isSoloMode) {
      handleSoloTossDecision(decision);
    } else {
      sendSocketMessage({ type: 'TOSS_DECISION', payload: { decision } });
    }
  };

  const handlePickNumber = (num: number) => {
    if (isSoloMode) {
      handleSoloPickNumber(num);
    } else {
      sendSocketMessage({ type: 'PICK_NUMBER', payload: { number: num } });
    }
  };

  const handleRequestRematch = () => {
    if (isSoloMode) {
      if (matchState) {
        handleStartBotPractice(
          matchState.players.p1.name,
          matchState.players.p1.avatar,
          matchState.settings,
          botEngineRef.current?.difficulty || 'pro'
        );
      }
    } else {
      sendSocketMessage({ type: 'REQUEST_REMATCH' });
    }
  };

  const handleLeaveGame = () => {
    stopSoloTimer();
    updateUrlForRoom(null);
    setOpponentLivePick(null);
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setMatchState(null);
    setScreen('LOBBY');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#111827] flex flex-col font-sans transition-colors antialiased w-full max-w-full overflow-x-hidden box-border">
      <Header
        onShowRules={() => setIsRulesOpen(true)}
        onOpenDevModal={() => setIsDevModalOpen(true)}
        onLeaveRoom={screen !== 'LOBBY' ? handleLeaveGame : undefined}
        isInGame={screen !== 'LOBBY'}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        isDevMode={isDevMode}
      />

      <main className="flex-1 flex flex-col justify-center py-2 sm:py-4 w-full max-w-full min-w-0 overflow-x-hidden box-border">
        {screen === 'LOBBY' && (
          <LobbyView
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onStartBotPractice={handleStartBotPractice}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
          />
        )}

        {screen === 'WAITING' && matchState && (
          <WaitingView
            state={matchState}
            onCancel={handleLeaveGame}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        )}

        {screen === 'MATCH' && matchState && (
          <>
            {matchState.phase === 'TOSS' && (
              <TossModal
                state={matchState}
                currentUserId={currentUserId}
                onCallToss={handleTossCall}
                onMakeDecision={handleTossDecision}
              />
            )}

            {(matchState.phase === 'INNINGS_1' ||
              matchState.phase === 'INNINGS_BREAK' ||
              matchState.phase === 'INNINGS_2' ||
              matchState.phase === 'COMPLETED') && (
              <MatchView
                state={matchState}
                currentUserId={currentUserId}
                onPickNumber={handlePickNumber}
              />
            )}

            {matchState.phase === 'INNINGS_BREAK' && (
              <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/25 backdrop-blur-sm animate-fadeIn box-border overflow-y-auto">
                <div className="p-6 rounded-3xl liquid-card shadow-xl text-center space-y-2 w-full max-w-[min(20rem,calc(100vw-1.5rem))] box-border my-auto">
                  <h3 className="text-lg font-bold text-neutral-900">
                    Innings Break
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Target is <span className="font-bold text-blue-600 text-base">{matchState.target}</span> runs.
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Switching innings...
                  </p>
                </div>
              </div>
            )}

            {matchState.phase === 'COMPLETED' && (
              <GameOverModal
                state={matchState}
                currentUserId={currentUserId}
                onRequestRematch={handleRequestRematch}
                onReturnToLobby={handleLeaveGame}
              />
            )}
          </>
        )}
      </main>

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Share Room Modal */}
      {matchState && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          roomId={matchState.roomId}
        />
      )}

      {/* Developer Access Modal */}
      <DevModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
        onDevUnlocked={handleDevUnlocked}
        onReturnHome={handleLeaveGame}
      />

      {/* Secret Dev Live Overlay (Active only for authenticated developer) */}
      {isDevMode && (
        <DevOverlay
          matchState={matchState}
          currentUserId={currentUserId}
          opponentLivePick={opponentLivePick}
          onDisableDevMode={handleDisableDevMode}
        />
      )}
    </div>
  );
}
