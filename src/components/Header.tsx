import React from 'react';
import { Volume2, VolumeX, HelpCircle, LogOut } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  onShowRules: () => void;
  onLeaveRoom?: () => void;
  isInGame: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onShowRules,
  onLeaveRoom,
  isInGame,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3 liquid-glass transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            HC
          </div>
          <span className="text-base sm:text-lg font-semibold tracking-tight text-neutral-900 whitespace-nowrap">
            Hand Cricket <span className="text-blue-600 font-medium text-xs ml-1">Live</span>
          </span>
        </div>

        {/* Zone 2: Navigation & Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => {
              sound.playTap();
              onShowRules();
            }}
            aria-label="Rules"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-black/5 transition-all whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>

          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
            className="p-2 text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-black/5 transition-all active:scale-95 cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-blue-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-400" />
            )}
          </button>
        </div>

        {/* Zone 3: Exit or Status */}
        <div className="shrink-0 flex items-center">
          {isInGame && onLeaveRoom ? (
            <button
              onClick={() => {
                sound.playTap();
                onLeaveRoom();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-full transition-all whitespace-nowrap active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/50 text-emerald-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ready</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
