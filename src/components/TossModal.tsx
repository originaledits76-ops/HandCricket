import React, { useEffect } from 'react';
import { Sparkles, Trophy, Disc } from 'lucide-react';
import type { MatchState } from '../types/game';
import { sound } from '../utils/audio';

interface TossModalProps {
  state: MatchState;
  currentUserId: string;
  onCallToss: (call: 'HEADS' | 'TAILS') => void;
  onMakeDecision: (decision: 'BAT' | 'BOWL') => void;
}

export const TossModal: React.FC<TossModalProps> = ({
  state,
  currentUserId,
  onCallToss,
  onMakeDecision,
}) => {
  const toss = state.toss;
  const p1 = state.players.p1;
  const p2 = state.players.p2!;
  const isCaller = currentUserId === toss.callerId;
  const caller = p1.id === toss.callerId ? p1 : p2;
  const winner = toss.winnerId ? (p1.id === toss.winnerId ? p1 : p2) : null;
  const isWinner = toss.winnerId === currentUserId;

  useEffect(() => {
    if (toss.phase === 'FLIPPING') {
      sound.playCoinFlip();
    }
  }, [toss.phase]);

  return (
    <div className="max-w-md w-full mx-auto px-4 py-8 animate-fadeIn">
      <div className="liquid-card rounded-3xl p-6 sm:p-7 shadow-xl text-center space-y-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pre-Match Toss</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
            The Toss
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {toss.phase === 'CALLING'
              ? isCaller
                ? 'Make your call'
                : `Waiting for ${caller.name} to call...`
              : toss.phase === 'FLIPPING'
              ? 'Flipping...'
              : `${winner?.name} won the toss`}
          </p>
        </div>

        {/* Coin Display */}
        <div className="py-3 flex items-center justify-center">
          <div
            className={`w-24 h-24 rounded-full border-4 border-amber-300 bg-gradient-to-tr from-amber-400 via-amber-200 to-yellow-400 shadow-md flex items-center justify-center relative transition-transform ${
              toss.phase === 'FLIPPING' ? 'animate-spin' : ''
            }`}
          >
            <div className="w-18 h-18 rounded-full border border-amber-600/30 flex items-center justify-center">
              {toss.phase === 'CALLING' || toss.phase === 'FLIPPING' ? (
                <Disc className="w-8 h-8 text-amber-900/50" />
              ) : (
                <div className="text-center">
                  <span className="text-[11px] font-black tracking-widest text-amber-950 block uppercase">
                    {toss.result}
                  </span>
                  <Trophy className="w-4 h-4 text-amber-900 mx-auto mt-0.5" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STAGE 1: CALLING */}
        {toss.phase === 'CALLING' && (
          <div>
            {isCaller ? (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-neutral-500 block">
                  Select option
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSelect();
                      onCallToss('HEADS');
                    }}
                    className="py-3 px-3 rounded-2xl text-white font-bold text-xs btn-tactile-blue cursor-pointer transition-all"
                  >
                    HEADS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSelect();
                      onCallToss('TAILS');
                    }}
                    className="py-3 px-3 rounded-2xl text-white font-bold text-xs btn-tactile-indigo cursor-pointer transition-all"
                  >
                    TAILS
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/60 border border-neutral-200/60 text-xs font-semibold text-neutral-500 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>{caller.name} is making the call...</span>
              </div>
            )}
          </div>
        )}

        {/* STAGE 2: FLIPPING */}
        {toss.phase === 'FLIPPING' && (
          <div className="p-2.5 text-xs font-semibold text-amber-700 animate-pulse">
            Flipping the coin...
          </div>
        )}

        {/* STAGE 3: DECIDING */}
        {toss.phase === 'DECIDING' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/60">
              <span className="text-xs font-bold text-amber-900 block">
                {winner?.name} won the toss ({toss.result})
              </span>
            </div>

            {isWinner ? (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-neutral-500 block">
                  Choose strategy
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSelect();
                      onMakeDecision('BAT');
                    }}
                    className="py-3 px-3 rounded-2xl text-white font-bold text-xs btn-tactile-blue cursor-pointer transition-all"
                  >
                    BAT FIRST
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playSelect();
                      onMakeDecision('BOWL');
                    }}
                    className="py-3 px-3 rounded-2xl text-white font-bold text-xs btn-tactile-green cursor-pointer transition-all"
                  >
                    BOWL FIRST
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/60 border border-neutral-200/60 text-xs font-semibold text-neutral-500 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>{winner?.name} is deciding...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
