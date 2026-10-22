import React from 'react';
import { X, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/30 backdrop-blur-sm animate-fadeIn box-border overflow-y-auto">
      <div className="relative w-full max-w-[min(28rem,calc(100vw-1.5rem))] liquid-card rounded-3xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col box-border my-auto">
        <div className="pt-2.5 pb-1 flex justify-center">
          <div className="w-8 h-1 rounded-full bg-neutral-300/80" />
        </div>

        <div className="px-5 py-2.5 flex items-center justify-between border-b border-black/5">
          <div>
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">
              Rules & Instructions
            </h2>
            <p className="text-[11px] text-neutral-500">
              Hand Cricket guide
            </p>
          </div>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            aria-label="Close"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-black/5 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3 text-xs text-neutral-600">
          <div className="flex gap-3 p-3.5 rounded-2xl bg-white/60 border border-neutral-200/60">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-xs">Batting & Bowling</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                Both players pick a number from 0 to 6 simultaneously. If numbers differ, the batter scores runs equal to their choice. If numbers match (1 to 6), the batter is out.
              </p>
            </div>
          </div>

          {/* Only mention once here about 0 = 30% out rule */}
          <div className="flex gap-3 p-3.5 rounded-2xl bg-white/60 border border-neutral-200/60">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-xs">The Zero Rule</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                Choosing 0 acts as a defensive block (0 runs added). If both batter and bowler choose 0, there is a 30% chance of an edge dismissal, and 70% safe survival.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3.5 border-t border-black/5 bg-white/40 flex justify-end">
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs btn-tactile-blue flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Got It</span>
          </button>
        </div>
      </div>
    </div>
  );
};
