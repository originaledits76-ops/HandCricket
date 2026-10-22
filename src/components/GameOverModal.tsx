import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Award } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md liquid-card rounded-3xl shadow-2xl p-6 text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shadow-2xs">
            {isTie ? <Award className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Match Finished
          </span>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mt-0.5">
            {isTie ? 'Scores Tied' : isWinner ? 'Victory' : `${winner?.name} Won`}
          </h2>
          <p className="text-xs font-medium text-neutral-500 mt-1 max-w-xs mx-auto">
            {state.winReason || 'Match completed successfully.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-left">
          <div className="p-3 rounded-2xl bg-white/60 border border-neutral-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              1st Innings
            </span>
            <div className="text-xs font-semibold text-neutral-800 truncate mt-0.5">
              {inn1Batter.name}
            </div>
            <div className="mt-1 text-lg font-mono font-bold text-neutral-900 tabular-nums">
              {inn1.runs}/{inn1.wickets}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/60 border border-neutral-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              2nd Innings
            </span>
            <div className="text-xs font-semibold text-neutral-800 truncate mt-0.5">
              {inn2Batter.name}
            </div>
            <div className="mt-1 text-lg font-mono font-bold text-neutral-900 tabular-nums">
              {inn2.runs}/{inn2.wickets}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              sound.playSelect();
              onRequestRematch();
            }}
            className="py-3 px-3 rounded-2xl text-white font-bold text-xs btn-tactile-blue flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rematch</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              onReturnToLobby();
            }}
            className="py-3 px-3 rounded-2xl text-neutral-800 font-bold text-xs btn-tactile-gray flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
