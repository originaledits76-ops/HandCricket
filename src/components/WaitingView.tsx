import React, { useState } from 'react';
import { Copy, Check, Users, ArrowLeft, Share2 } from 'lucide-react';
import type { MatchState } from '../types/game';
import { sound } from '../utils/audio';

interface WaitingViewProps {
  state: MatchState;
  onCancel: () => void;
}

export const WaitingView: React.FC<WaitingViewProps> = ({ state, onCancel }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    sound.playTap();
    navigator.clipboard.writeText(state.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRoom = () => {
    sound.playTap();
    if (navigator.share) {
      navigator
        .share({
          title: 'Hand Cricket Room',
          text: `Join room: ${state.roomId}`,
          url: window.location.href,
        })
        .catch(() => copyCode());
    } else {
      copyCode();
    }
  };

  const p1 = state.players.p1;
  const oversLabel =
    state.settings.overs === 0
      ? 'Unlimited'
      : `${state.settings.overs} Over${state.settings.overs > 1 ? 's' : ''}`;
  const wicketsLabel =
    state.settings.wickets === 1
      ? '1 Wicket'
      : `${state.settings.wickets} Wickets`;

  return (
    <div className="max-w-md w-full mx-auto px-4 py-8 animate-fadeIn">
      <button
        onClick={() => {
          sound.playTap();
          onCancel();
        }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Cancel Room</span>
      </button>

      <div className="liquid-card rounded-3xl p-6 shadow-xl text-center space-y-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Room Active
          </span>
          <h2 className="text-2xl font-bold text-neutral-900 mt-0.5">
            Waiting for Opponent
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Share the code below with your opponent to start the match
          </p>
        </div>

        {/* Big Code Pill */}
        <div className="p-4 rounded-2xl bg-white/70 border border-neutral-200/80 flex items-center justify-between gap-3 shadow-2xs">
          <div className="text-left pl-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Room Code
            </span>
            <span className="text-3xl font-mono font-bold tracking-widest text-neutral-900">
              {state.roomId}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={copyCode}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 shadow-2xs border border-neutral-200 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              aria-label="Copy Room Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={shareRoom}
              className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200/60 transition-all active:scale-95 cursor-pointer"
              aria-label="Share Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Players Slot Cards */}
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-neutral-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                H
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-900 block">
                  {p1.name} (Host)
                </span>
                <span className="text-[10px] text-blue-600 font-semibold">Ready</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
              Joined
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl border border-dashed border-neutral-300 bg-white/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-neutral-200/70 flex items-center justify-center text-neutral-500">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-500 block">
                  Opponent Slot
                </span>
                <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Waiting for player...
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Match Settings Recap */}
        <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-xs text-neutral-500 font-medium">
          <span>{oversLabel}</span>
          <span>·</span>
          <span>{wicketsLabel}</span>
        </div>
      </div>
    </div>
  );
};
