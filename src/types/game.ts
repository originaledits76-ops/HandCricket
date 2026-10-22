/**
 * Hand Cricket Types & State Definitions
 */

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  avatar: string;
  connected: boolean;
  isBot?: boolean;
}

export interface MatchSettings {
  wickets: number; // 1, 3, or 5
  overs: number; // 1, 2, 5, or 0 (0 for unlimited)
}

export interface BallHistory {
  ballIndex: number;
  overIndex: number;
  ballInOver: number;
  batterChoice: number;
  bowlerChoice: number;
  outcome: 'RUNS' | 'DEFENDED' | 'OUT';
  runs: number;
  batterId: string;
  bowlerId: string;
}

export interface InningsState {
  batterId: string;
  bowlerId: string;
  runs: number;
  wickets: number;
  ballsBowled: number;
  history: BallHistory[];
}

export interface TossState {
  callerId: string;
  call: 'HEADS' | 'TAILS' | null;
  result: 'HEADS' | 'TAILS' | null;
  winnerId: string | null;
  decision: 'BAT' | 'BOWL' | null;
  phase: 'CALLING' | 'FLIPPING' | 'DECIDING' | 'COMPLETED';
}

export interface BallResolution {
  batterChoice: number;
  bowlerChoice: number;
  outcome: 'RUNS' | 'DEFENDED' | 'OUT';
  runsAdded: number;
  batterName: string;
  bowlerName: string;
  isWicket: boolean;
  isDefendedSurvive: boolean;
  commentary: string;
}

export interface MatchState {
  roomId: string;
  settings: MatchSettings;
  players: {
    p1: Player;
    p2: Player | null;
  };
  phase: 'WAITING' | 'TOSS' | 'INNINGS_1' | 'INNINGS_BREAK' | 'INNINGS_2' | 'COMPLETED';
  toss: TossState;
  innings1: InningsState;
  innings2: InningsState;
  target: number | null;
  winnerId: string | null;
  winReason: string | null;
  timeRemaining: number; // 10s timer
  p1ChoiceLocked: boolean;
  p2ChoiceLocked: boolean;
  lastBall: BallResolution | null;
  ballActive: boolean;
}

// Client to Server Events
export type ClientMessage =
  | { type: 'CREATE_ROOM'; payload: { playerName: string; avatar: string; settings: MatchSettings } }
  | { type: 'JOIN_ROOM'; payload: { roomId: string; playerName: string; avatar: string } }
  | { type: 'TOSS_CALL'; payload: { call: 'HEADS' | 'TAILS' } }
  | { type: 'TOSS_DECISION'; payload: { decision: 'BAT' | 'BOWL' } }
  | { type: 'PICK_NUMBER'; payload: { number: number } }
  | { type: 'REQUEST_REMATCH' }
  | { type: 'PING' };

// Server to Client Events
export type ServerMessage =
  | { type: 'ROOM_CREATED'; payload: { roomId: string; playerId: string; state: MatchState } }
  | { type: 'ROOM_JOINED'; payload: { roomId: string; playerId: string; state: MatchState } }
  | { type: 'STATE_UPDATE'; payload: { state: MatchState } }
  | { type: 'BALL_REVEAL'; payload: { resolution: BallResolution; state: MatchState } }
  | { type: 'TIMER_TICK'; payload: { timeRemaining: number } }
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'PONG' };
