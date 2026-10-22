import React, { useState } from 'react';
import { Eye, ShieldCheck, X, Minimize2, Maximize2 } from 'lucide-react';
import type { MatchState } from '../types/game';

interface DevOverlayProps {
  matchState: MatchState | null;
  currentUserId: string;
  opponentLivePick: number | null;
  onDisableDevMode: () => void;
}

export const DevOverlay: React.FC<DevOverlayProps> = ({
  matchState,
  currentUserId,
  opponentLivePick,
  onDisableDevMode,
}) => {
  const [minimized, setMinimized] = useState(false);

  if (!matchState) {
    return (
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 animate-fadeIn max-w-[calc(100vw-1.5rem)]">
        <div className="liquid-card rounded-2xl p-2 px-3 border border-emerald-500/40 bg-white/95 shadow-xl flex items-center gap-2 text-xs box-border">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-mono font-bold text-neutral-800 text-[11px] truncate">DEV MODE</span>
          <button
            onClick={onDisableDevMode}
            className="text-neutral-400 hover:text-neutral-700 p-0.5 ml-1 shrink-0"
            title="Disable"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const p1 = matchState.players.p1;
  const p2 = matchState.players.p2;
  const isP1 = currentUserId === p1.id;
  const opponent = isP1 ? p2 : p1;

  const currentInnings = matchState.phase === 'INNINGS_1' ? matchState.innings1 : matchState.innings2;
  const isOpponentBatting = opponent ? currentInnings.batterId === opponent.id : false;
  const opponentRole = isOpponentBatting ? 'Batting' : 'Bowling';

  const opponentLocked = isP1 ? matchState.p2ChoiceLocked : matchState.p1ChoiceLocked;

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 animate-fadeIn max-w-[calc(100vw-1.5rem)]">
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          className="liquid-card rounded-2xl p-2 px-3 border border-emerald-500/50 bg-white/95 shadow-xl flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 cursor-pointer active:scale-95 max-w-[calc(100vw-1.5rem)] truncate box-border"
        >
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">INSPECT: {opponentLivePick !== null ? `[ ${opponentLivePick} ]` : 'WAITING'}</span>
          <Maximize2 className="w-3 h-3 text-neutral-400 ml-1 shrink-0" />
        </button>
      ) : (
        <div className="w-72 max-w-[calc(100vw-1.5rem)] liquid-card rounded-3xl p-3.5 sm:p-4 shadow-2xl border border-emerald-500/40 bg-white/95 text-neutral-900 space-y-2.5 box-border">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/5 pb-2">
            <div className="flex items-center gap-1.5 shrink min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-mono font-bold text-[11px] sm:text-xs text-emerald-700 tracking-wide truncate">
                DEV TEST OVERLAY
              </span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => setMinimized(true)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-black/5"
                title="Minimize"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
              <button
                onClick={onDisableDevMode}
                className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-black/5"
                title="Disable Dev Mode"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Opponent Info */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-neutral-500 gap-1">
              <span className="shrink-0">Opponent:</span>
              <span className="font-semibold text-neutral-800 truncate">
                {opponent?.name || 'Waiting...'}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-500 gap-1">
              <span className="shrink-0">Role:</span>
              <span className="font-semibold text-neutral-800 truncate">
                {opponentRole}
              </span>
            </div>
          </div>

          {/* Live Pick Inspector */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">
              Live Opponent Selection
            </span>

            {opponentLivePick !== null ? (
              <div>
                <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-700">
                  {opponentLivePick}
                </span>
                <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                  Opponent selected {opponentLivePick}!
                </p>
                <p className="text-[10px] text-emerald-600 mt-0.5 leading-tight">
                  {isOpponentBatting
                    ? `Match ${opponentLivePick} for OUT.`
                    : `Match ${opponentLivePick} causes wicket.`}
                </p>
              </div>
            ) : opponentLocked ? (
              <div className="py-0.5">
                <span className="text-xs font-bold text-amber-700">Choice Locked</span>
                <p className="text-[10px] text-neutral-500">Processing...</p>
              </div>
            ) : (
              <div className="py-1 text-neutral-400 font-medium text-[11px] flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="truncate">Waiting for opponent pick...</span>
              </div>
            )}
          </div>

          <div className="text-[9px] text-neutral-400 text-center truncate">
            Secret inspection enabled · Opponent cannot see this
          </div>
        </div>
      )}
    </div>
  );
};
