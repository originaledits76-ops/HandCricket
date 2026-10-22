import React, { useState } from 'react';
import { Users, Bot, Key, Sparkles, Trophy, ChevronRight } from 'lucide-react';
import type { MatchSettings } from '../types/game';
import { sound } from '../utils/audio';

interface LobbyViewProps {
  onCreateRoom: (playerName: string, avatar: string, settings: MatchSettings) => void;
  onJoinRoom: (roomId: string, playerName: string, avatar: string) => void;
  onStartBotPractice: (
    playerName: string,
    avatar: string,
    settings: MatchSettings,
    botDifficulty: 'rookie' | 'pro' | 'legend'
  ) => void;
  errorMessage: string | null;
  onClearError: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  onCreateRoom,
  onJoinRoom,
  onStartBotPractice,
  errorMessage,
  onClearError,
}) => {
  const [tab, setTab] = useState<'create' | 'join' | 'bot'>('create');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('hc_player_name') || 'Player');
  const [roomCode, setRoomCode] = useState('');

  // Settings
  const [wickets, setWickets] = useState<number>(1);
  const [overs, setOvers] = useState<number>(2);
  const [botDifficulty, setBotDifficulty] = useState<'rookie' | 'pro' | 'legend'>('pro');

  const saveProfile = (name: string) => {
    localStorage.setItem('hc_player_name', name);
  };

  const handleCreate = () => {
    sound.playSelect();
    const finalName = playerName.trim() || 'Player 1';
    saveProfile(finalName);
    onCreateRoom(finalName, 'P1', { wickets, overs });
  };

  const handleJoin = () => {
    sound.playSelect();
    const finalName = playerName.trim() || 'Player 2';
    saveProfile(finalName);
    if (!roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), finalName, 'P2');
  };

  const handleBotStart = () => {
    sound.playSelect();
    const finalName = playerName.trim() || 'Player';
    saveProfile(finalName);
    onStartBotPractice(finalName, 'P1', { wickets, overs }, botDifficulty);
  };

  return (
    <div className="max-w-md w-full mx-auto px-3 sm:px-4 py-6 box-border overflow-hidden">
      {/* Title */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Online Duel</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 font-['Poppins']">
          Hand Cricket
        </h1>
        <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
          Select numbers 0 to 6 simultaneously to bat or bowl against your opponent.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center justify-between">
          <span className="truncate">{errorMessage}</span>
          <button
            onClick={onClearError}
            className="text-xs underline hover:no-underline ml-2 cursor-pointer font-semibold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Liquid Card */}
      <div className="liquid-card rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 w-full box-border">
        {/* Profile Name Input Only */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Your Name
          </span>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={16}
            placeholder="Enter your display name"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white/80 border border-neutral-200 focus:border-blue-600 focus:bg-white text-sm font-semibold text-neutral-900 outline-none transition-all shadow-2xs box-border"
          />
        </div>

        {/* Minimalist Segmented Tabs */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-neutral-100 text-xs font-semibold w-full box-border">
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setTab('create');
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
              tab === 'create'
                ? 'bg-white text-blue-600 shadow-sm font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Create</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setTab('join');
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
              tab === 'join'
                ? 'bg-white text-blue-600 shadow-sm font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Key className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Join</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setTab('bot');
            }}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
              tab === 'bot'
                ? 'bg-white text-emerald-600 shadow-sm font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Practice</span>
          </button>
        </div>

        {/* TAB 1: CREATE ROOM */}
        {tab === 'create' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-600">Wickets per Side</span>
                <span className="text-[11px] text-neutral-400">
                  {wickets === 1 ? '1 Wicket' : `${wickets} Wickets`}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 w-full">
                {[1, 3, 5].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setWickets(w);
                    }}
                    className={`py-2 px-1 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer truncate ${
                      wickets === w
                        ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-2xs font-bold'
                        : 'border-neutral-200 bg-white/60 text-neutral-600 hover:bg-white'
                    }`}
                  >
                    {w === 1 ? '1 Wicket' : `${w} Wickets`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-600">Overs per Innings</span>
                <span className="text-[11px] text-neutral-400">
                  {overs === 0 ? 'Unlimited' : `${overs} Overs`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full">
                {[
                  { label: '1 Over', val: 1 },
                  { label: '2 Overs', val: 2 },
                  { label: '5 Overs', val: 5 },
                  { label: 'Unlimited', val: 0 },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setOvers(opt.val);
                    }}
                    className={`py-2 px-0.5 text-center text-[11px] sm:text-xs font-semibold rounded-xl border transition-all cursor-pointer truncate ${
                      overs === opt.val
                        ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-2xs font-bold'
                        : 'border-neutral-200 bg-white/60 text-neutral-600 hover:bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              className="w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm btn-tactile-blue flex items-center justify-center gap-2 cursor-pointer transition-all box-border"
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Create Room</span>
              <ChevronRight className="w-4 h-4 ml-0.5 shrink-0" />
            </button>
          </div>
        )}

        {/* TAB 2: JOIN ROOM */}
        {tab === 'join' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-600">Room Code</span>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCDE"
                maxLength={6}
                className="w-full text-center tracking-widest text-2xl font-mono font-bold py-3 rounded-2xl bg-white/80 border border-neutral-200 focus:border-blue-600 focus:bg-white text-neutral-900 uppercase outline-none transition-all shadow-2xs box-border"
              />
              <p className="text-[11px] text-neutral-400 text-center">
                Enter the 5-character code from your host
              </p>
            </div>

            <button
              type="button"
              onClick={handleJoin}
              disabled={!roomCode.trim()}
              className="w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm btn-tactile-indigo disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer transition-all box-border"
            >
              <Key className="w-4 h-4 shrink-0" />
              <span>Join Match</span>
              <ChevronRight className="w-4 h-4 ml-0.5 shrink-0" />
            </button>
          </div>
        )}

        {/* TAB 3: PRACTICE VS BOT */}
        {tab === 'bot' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-600">Bot Difficulty</span>
              <div className="grid grid-cols-3 gap-1.5 w-full">
                {[
                  { id: 'rookie', title: 'Rookie', desc: 'Casual' },
                  { id: 'pro', title: 'Pro', desc: 'Balanced' },
                  { id: 'legend', title: 'Legend', desc: 'Tactical' },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setBotDifficulty(diff.id as 'rookie' | 'pro' | 'legend');
                    }}
                    className={`py-2 px-1 text-center rounded-xl border transition-all cursor-pointer truncate ${
                      botDifficulty === diff.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs font-bold'
                        : 'border-neutral-200 bg-white/60 text-neutral-600 hover:bg-white'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{diff.title}</div>
                    <div className="text-[10px] opacity-70 truncate">{diff.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/50 border border-neutral-200 flex items-center justify-between text-xs text-neutral-600 box-border">
              <span className="font-semibold">Format: 2 Overs</span>
              <span className="text-neutral-400">1 Wicket</span>
            </div>

            <button
              type="button"
              onClick={handleBotStart}
              className="w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm btn-tactile-green flex items-center justify-center gap-2 cursor-pointer transition-all box-border"
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span>Start Practice</span>
              <ChevronRight className="w-4 h-4 ml-0.5 shrink-0" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
