import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Award, CheckCircle2 } from 'lucide-react';
import type { MatchState } from '../types/game';
import { sound } from '../utils/audio';

interface GameOverModalProps {
  state: MatchState;
  currentUserId: string;
  onRequestRematch: () => void;
  onReturnToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  currentUserId,
  onRequestRematch,
  onReturnToLobby,
}) => {
  const p1 = state.players.p1;
  const p2 = state.players.p2!;
  const winner = state.winnerId ? (p1.id === state.winnerId ? p1 : p2) : null;
  const isWinner = state.winnerId === currentUserId;
  const isTie = state.winnerId === null;

  const votes = state.rematchVotes || [];
  const hasUserVoted = votes.includes(currentUserId);
  const opponent = p1.id === currentUserId ? p2 : p1;
  const hasOpponentVoted = opponent ? votes.includes(opponent.id) : false;

  useEffect(() => {
    sound.playVictory();
    const duration = 2 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const inn1 = state.innings1;
  const inn2 = state.innings2;
  const inn1Batter = p1.id === inn1.batterId ? p1 : p2;
  const inn2Batter = p1.id === inn2.batterId ? p1 : p2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/30 backdrop-blur-sm animate-fadeIn box-border overflow-y-auto">
      <div className="w-full max-w-[min(28rem,calc(100vw-1.5rem))] liquid-card rounded-3xl shadow-2xl p-5 sm:p-6 text-center space-y-4 box-border my-auto">
        <div className="flex justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shadow-2xs">
            {isTie ? <Award className="w-7 h-7 sm:w-8 sm:h-8" /> : <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
            Match Finished
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">
            {isTie ? 'Scores Tied' : isWinner ? 'Victory' : `${winner?.name} Won`}
          </h2>
          <p className="text-xs font-medium text-neutral-500 mt-1 max-w-xs mx-auto">
            {state.winReason || 'Match completed successfully.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-left w-full box-border">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white/60 border border-neutral-200/60 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
              1st Innings
            </span>
            <div className="text-xs font-semibold text-neutral-800 truncate mt-0.5">
              {inn1Batter.name}
            </div>
            <div className="mt-0.5 text-base sm:text-lg font-mono font-bold text-neutral-900 tabular-nums">
              {inn1.runs}/{inn1.wickets}
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-2xl bg-white/60 border border-neutral-200/60 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
              2nd Innings
            </span>
            <div className="text-xs font-semibold text-neutral-800 truncate mt-0.5">
              {inn2Batter.name}
            </div>
            <div className="mt-0.5 text-base sm:text-lg font-mono font-bold text-neutral-900 tabular-nums">
              {inn2.runs}/{inn2.wickets}
            </div>
          </div>
        </div>

        {/* Rematch Status Notice */}
        {hasOpponentVoted && !hasUserVoted && (
          <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-semibold flex items-center justify-center gap-1.5 animate-pulse">
            <span className="text-center">{opponent?.name} wants a rematch! Click Rematch to accept.</span>
          </div>
        )}

        {hasUserVoted && !hasOpponentVoted && (
          <div className="p-2.5 rounded-2xl bg-neutral-100 text-neutral-600 text-xs font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Waiting for {opponent?.name} to accept...</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1 w-full box-border">
          <button
            type="button"
            disabled={hasUserVoted}
            onClick={() => {
              sound.playSelect();
              onRequestRematch();
            }}
            className={`py-2.5 sm:py-3 px-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all box-border truncate ${
              hasUserVoted
                ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                : 'btn-tactile-blue text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{hasUserVoted ? 'Requested (1/2)' : hasOpponentVoted ? 'Accept Rematch' : 'Rematch'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onReturnToLobby();
            }}
            className="py-2.5 sm:py-3 px-2 rounded-2xl text-neutral-800 font-bold text-xs btn-tactile-gray flex items-center justify-center gap-1 cursor-pointer transition-all box-border truncate"
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span>Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
