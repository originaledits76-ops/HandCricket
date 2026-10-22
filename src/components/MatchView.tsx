import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import type { MatchState } from '../types/game';
import { sound } from '../utils/audio';

interface MatchViewProps {
  state: MatchState;
  currentUserId: string;
  onPickNumber: (num: number) => void;
}

export const MatchView: React.FC<MatchViewProps> = ({
  state,
  currentUserId,
  onPickNumber,
}) => {
  const [selectedNum, setSelectedNum] = useState<number | null>(null);

  const isFirstInnings = state.phase === 'INNINGS_1';
  const currentInnings = isFirstInnings ? state.innings1 : state.innings2;

  const p1 = state.players.p1;
  const p2 = state.players.p2!;
  const isP1 = currentUserId === p1.id;
  const userPlayer = isP1 ? p1 : p2;
  const opponentPlayer = isP1 ? p2 : p1;

  const isBatter = currentUserId === currentInnings.batterId;
  const batterPlayer = currentInnings.batterId === p1.id ? p1 : p2;

  const userLocked = isP1 ? state.p1ChoiceLocked : state.p2ChoiceLocked;
  const opponentLocked = isP1 ? state.p2ChoiceLocked : state.p1ChoiceLocked;

  useEffect(() => {
    if (state.ballActive && !userLocked) {
      setSelectedNum(null);
    }
  }, [state.ballActive, userLocked]);

  useEffect(() => {
    if (state.ballActive && state.timeRemaining <= 3 && state.timeRemaining > 0) {
      sound.playTimerTick(true);
    } else if (state.ballActive && state.timeRemaining > 3) {
      sound.playTimerTick(false);
    }
  }, [state.timeRemaining, state.ballActive]);

  useEffect(() => {
    if (state.lastBall) {
      if (state.lastBall.isWicket) {
        sound.playWicket();
      } else if (state.lastBall.isDefendedSurvive) {
        sound.playDefended();
      } else {
        sound.playBatHit(state.lastBall.runsAdded);
      }
    }
  }, [state.lastBall]);

  const handlePick = useCallback(
    (num: number) => {
      if (!state.ballActive || userLocked) return;
      setSelectedNum(num);
      sound.playSelect();
      onPickNumber(num);
    },
    [state.ballActive, userLocked, onPickNumber]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (['0', '1', '2', '3', '4', '5', '6'].includes(key)) {
        handlePick(parseInt(key, 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePick]);

  const ballsBowled = currentInnings.ballsBowled;
  const completedOvers = Math.floor(ballsBowled / 6);
  const ballsInCurrentOver = ballsBowled % 6;
  const oversString = `${completedOvers}.${ballsInCurrentOver}`;
  const totalOversString = state.settings.overs === 0 ? '∞' : `${state.settings.overs}.0`;

  const target = state.target;
  const runsNeeded = target !== null ? Math.max(0, target - currentInnings.runs) : null;
  const totalBallsAllowed = state.settings.overs > 0 ? state.settings.overs * 6 : null;
  const ballsRemaining = totalBallsAllowed !== null ? Math.max(0, totalBallsAllowed - ballsBowled) : null;

  const timerRadius = 18;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerProgress = (state.timeRemaining / 10) * timerCircumference;
  const timerColor =
    state.timeRemaining > 5
      ? 'text-emerald-500'
      : state.timeRemaining > 2
      ? 'text-amber-500'
      : 'text-rose-500 animate-pulse';

  return (
    <div className="max-w-xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4 box-border overflow-hidden">
      {/* 1. SCOREBOARD HUD */}
      <div className="liquid-card rounded-3xl p-4 sm:p-5 shadow-sm space-y-2.5 w-full box-border">
        <div className="flex items-center justify-between text-xs text-neutral-500 pb-2 border-b border-black/5 gap-2 min-w-0">
          <div className="flex items-center gap-1.5 shrink min-w-0">
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold text-[11px] truncate shrink-0">
              {isFirstInnings ? '1st Inn' : '2nd Inn'}
            </span>
            <span className="font-medium text-neutral-700 truncate text-[11px] sm:text-xs">
              {batterPlayer.name} batting
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono font-semibold text-neutral-800 shrink-0 text-[11px] sm:text-xs">
            <span className="text-neutral-400 font-sans font-normal text-[10px]">Overs:</span>
            <span>{oversString}/{totalOversString}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="shrink min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-5xl font-bold tracking-tight font-mono text-neutral-900 tabular-nums">
                {currentInnings.runs}/{currentInnings.wickets}
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                ({ballsBowled}b)
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 block mt-0.5 font-medium truncate">
              Max {state.settings.wickets} Wicket{state.settings.wickets > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {target !== null && !isFirstInnings && (
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                  Target: {target}
                </span>
                <span className="text-xs font-semibold text-neutral-800 block">
                  Need <span className="text-blue-600 font-bold">{runsNeeded}</span>
                  {ballsRemaining !== null ? ` (${ballsRemaining}b)` : ''}
                </span>
              </div>
            )}

            {/* Timer Ring */}
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0">
              <svg className="w-10 h-10 sm:w-11 sm:h-11 -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r={timerRadius}
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-neutral-200/60"
                  fill="transparent"
                />
                <circle
                  cx="20"
                  cy="20"
                  r={timerRadius}
                  stroke="currentColor"
                  strokeWidth="3"
                  className={`transition-all duration-300 ${timerColor}`}
                  fill="transparent"
                  strokeDasharray={timerCircumference}
                  strokeDashoffset={timerCircumference - timerProgress}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-mono font-bold text-[11px] sm:text-xs text-neutral-900">
                {state.timeRemaining}s
              </span>
            </div>
          </div>
        </div>

        {target !== null && !isFirstInnings && (
          <div className="pt-0.5">
            <div className="w-full h-1.5 rounded-full bg-neutral-200/60 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (currentInnings.runs / target) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. ROLE INDICATOR */}
      <div
        className={`px-3 py-1.5 rounded-2xl flex items-center justify-between text-xs font-semibold transition-colors w-full box-border ${
          isBatter
            ? 'bg-blue-50/80 text-blue-700 border border-blue-100/80'
            : 'bg-emerald-50/80 text-emerald-700 border border-emerald-100/80'
        }`}
      >
        <span className="truncate">
          {isBatter ? 'You are Batting' : 'You are Bowling'}
        </span>
        <span className="font-mono text-[11px] opacity-75 shrink-0 ml-1">#{ballsBowled + 1}</span>
      </div>

      {/* 3. REVEAL ARENA */}
      <div className="liquid-card rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 w-full box-border">
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full">
          {/* YOU */}
          <div
            className={`p-3 rounded-2xl text-center border transition-all w-full min-w-0 box-border ${
              userLocked
                ? 'bg-blue-50/50 border-blue-200/80'
                : 'bg-white/50 border-neutral-200/50'
            }`}
          >
            <div className="text-xs font-semibold text-neutral-800 mb-1 truncate">
              {userPlayer.name} (You)
            </div>

            <div className="h-14 sm:h-16 flex flex-col items-center justify-center">
              {state.lastBall && !state.ballActive ? (
                <div className="animate-scaleIn text-center">
                  <span className="block text-xl sm:text-2xl font-mono font-bold text-neutral-900">
                    {isBatter ? state.lastBall.batterChoice : state.lastBall.bowlerChoice}
                  </span>
                </div>
              ) : userLocked ? (
                <div className="text-center">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 mt-1 block">
                    Locked
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-dashed border-neutral-300 flex items-center justify-center mx-auto text-neutral-400 text-xs font-semibold">
                    ?
                  </div>
                </div>
              )}
            </div>
            <span className="text-[9px] uppercase font-bold text-neutral-400 block truncate">
              {isBatter ? 'Batting' : 'Bowling'}
            </span>
          </div>

          {/* OPPONENT */}
          <div
            className={`p-3 rounded-2xl text-center border transition-all w-full min-w-0 box-border ${
              opponentLocked
                ? 'bg-indigo-50/50 border-indigo-200/80'
                : 'bg-white/50 border-neutral-200/50'
            }`}
          >
            <div className="text-xs font-semibold text-neutral-800 truncate mb-1">
              {opponentPlayer.name}
            </div>

            <div className="h-14 sm:h-16 flex flex-col items-center justify-center">
              {state.lastBall && !state.ballActive ? (
                <div className="animate-scaleIn text-center">
                  <span className="block text-xl sm:text-2xl font-mono font-bold text-neutral-900">
                    {!isBatter ? state.lastBall.batterChoice : state.lastBall.bowlerChoice}
                  </span>
                </div>
              ) : opponentLocked ? (
                <div className="text-center">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-2xs">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 mt-1 block">
                    Ready
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-dashed border-neutral-300 flex items-center justify-center mx-auto text-neutral-400 text-xs">
                    ...
                  </div>
                </div>
              )}
            </div>
            <span className="text-[9px] uppercase font-bold text-neutral-400 block truncate">
              {!isBatter ? 'Batting' : 'Bowling'}
            </span>
          </div>
        </div>

        {/* Commentary */}
        {state.lastBall && (
          <div
            className={`p-2.5 sm:p-3 rounded-2xl text-center border animate-slideDown text-xs font-semibold w-full box-border ${
              state.lastBall.isWicket
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : state.lastBall.isDefendedSurvive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : state.lastBall.runsAdded >= 4
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-white/60 border-neutral-200 text-neutral-800'
            }`}
          >
            <div className="font-bold mb-0.5 truncate">
              {state.lastBall.isWicket
                ? 'Wicket Out'
                : state.lastBall.isDefendedSurvive
                ? 'Defended Dot'
                : state.lastBall.runsAdded === 6
                ? 'Maximum Six'
                : state.lastBall.runsAdded === 4
                ? 'Boundary Four'
                : `+${state.lastBall.runsAdded} Run${state.lastBall.runsAdded > 1 ? 's' : ''}`}
            </div>
            <p className="text-[11px] opacity-80 leading-tight">{state.lastBall.commentary}</p>
          </div>
        )}
      </div>

      {/* 4. KEYPAD (0 to 6) - Strictly bounded within container */}
      <div className="liquid-card rounded-3xl p-3 sm:p-4 shadow-sm space-y-2 w-full box-border">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="font-semibold uppercase tracking-wider text-[10px] truncate">
            {isBatter ? 'Select runs' : 'Select prediction'}
          </span>
          <span className="font-medium text-[10px] shrink-0 ml-1">Keys 0–6</span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full box-border">
          {[0, 1, 2, 3, 4, 5, 6].map((num) => {
            const isZero = num === 0;
            const isSelected = selectedNum === num;

            const btnClass = isZero
              ? 'btn-tactile-gray text-neutral-800'
              : num >= 4
              ? 'btn-tactile-blue text-white'
              : 'btn-tactile-indigo text-white';

            return (
              <button
                key={num}
                type="button"
                disabled={!state.ballActive || userLocked}
                onClick={() => handlePick(num)}
                className={`w-full min-w-0 py-2.5 sm:py-3.5 px-0 rounded-xl sm:rounded-2xl font-bold flex flex-col items-center justify-center select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all box-border ${btnClass} ${
                  isSelected ? 'ring-2 ring-blue-600 scale-105' : ''
                }`}
              >
                <span className="font-mono text-sm sm:text-lg font-bold leading-none">
                  {num}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. CURRENT OVER BALLS */}
      {currentInnings.history.length > 0 && (
        <div className="px-3.5 py-2 rounded-2xl bg-white/60 border border-neutral-200/60 shadow-2xs flex items-center justify-between w-full box-border gap-2">
          <span className="text-xs font-semibold text-neutral-500 shrink-0">This Over</span>
          <div className="flex items-center gap-1.5 overflow-x-auto shrink min-w-0 py-0.5">
            {currentInnings.history.slice(-6).map((ball, idx) => (
              <div
                key={idx}
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-semibold shrink-0 ${
                  ball.outcome === 'OUT'
                    ? 'bg-rose-500 text-white'
                    : ball.outcome === 'DEFENDED'
                    ? 'bg-neutral-600 text-white'
                    : ball.runs >= 4
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200'
                }`}
              >
                {ball.outcome === 'OUT' ? 'W' : ball.runs}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
