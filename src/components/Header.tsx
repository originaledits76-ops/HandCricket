import React from 'react';
import { Volume2, VolumeX, HelpCircle, LogOut, Code2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  onShowRules: () => void;
  onOpenDevModal: () => void;
  onLeaveRoom?: () => void;
  isInGame: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isDevMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onShowRules,
  onOpenDevModal,
  onLeaveRoom,
  isInGame,
  soundEnabled,
  onToggleSound,
  isDevMode,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full max-w-full px-3 sm:px-6 py-2.5 liquid-glass box-border">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 w-full min-w-0">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2 shrink min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
            HC
          </div>
          <span className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 truncate font-['Poppins']">
            Hand Cricket <span className="text-blue-600 font-medium text-xs ml-0.5 hidden sm:inline">Live</span>
          </span>
        </div>

        {/* Zone 2: Navigation & Quick Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              sound.playTap();
              onShowRules();
            }}
            aria-label="Rules"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-black/5 transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Rules</span>
          </button>

          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
            className="p-1.5 sm:p-2 text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-black/5 transition-all cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-blue-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-400" />
            )}
          </button>

          {/* Dev / Debug button */}
          <button
            onClick={() => {
              sound.playTap();
              onOpenDevModal();
            }}
            aria-label="Developer Tools"
            title="Developer Mode"
            className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
              isDevMode
                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400/50 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-700 hover:bg-black/5'
            }`}
          >
            <Code2 className="w-4 h-4" />
          </button>

          {/* Leave or Online */}
          {isInGame && onLeaveRoom ? (
            <button
              onClick={() => {
                sound.playTap();
                onLeaveRoom();
              }}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-full transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/50 text-emerald-700 text-xs font-medium shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
