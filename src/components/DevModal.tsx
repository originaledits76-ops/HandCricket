import React, { useState } from 'react';
import { X, Code2, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface DevModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDevUnlocked: () => void;
  onReturnHome: () => void;
}

export const DevModal: React.FC<DevModalProps> = ({
  isOpen,
  onClose,
  onDevUnlocked,
  onReturnHome,
}) => {
  const [step, setStep] = useState<'CONFIRM' | 'PASSCODE'>('CONFIRM');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNo = () => {
    sound.playTap();
    setStep('CONFIRM');
    setPasscode('');
    setError(null);
    onClose();
    onReturnHome();
  };

  const handleYes = () => {
    sound.playSelect();
    setStep('PASSCODE');
    setError(null);
  };

  const handleSubmitPasscode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcode.trim() === '180457') {
      sound.playVictory();
      onDevUnlocked();
      setPasscode('');
      setError(null);
      setStep('CONFIRM');
      onClose();
    } else {
      sound.playWicket();
      setError('Incorrect passcode. Access denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fadeIn box-border overflow-y-auto">
      <div className="w-full max-w-[min(24rem,calc(100vw-1.5rem))] liquid-card rounded-3xl shadow-2xl p-5 sm:p-6 text-center space-y-4 box-border my-auto">
        <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
              Developer Access
            </h3>
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

        {/* STEP 1: CONFIRMATION */}
        {step === 'CONFIRM' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                This feature is for testing the app and is limited to developer access only.
              </p>
              <h4 className="text-sm font-bold text-neutral-900 pt-1">
                Are you a developer?
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleNo}
                className="py-2.5 px-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                No, Return Home
              </button>

              <button
                type="button"
                onClick={handleYes}
                className="py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                Yes, Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PASSCODE ENTRY */}
        {step === 'PASSCODE' && (
          <form onSubmit={handleSubmitPasscode} className="space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-neutral-900">
                Enter Passcode
              </h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Provide developer key to unlock real-time opponent inspection
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <input
                type="password"
                autoFocus
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError(null);
                }}
                placeholder="Passcode"
                maxLength={10}
                className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 px-3 rounded-2xl bg-white border border-neutral-300 focus:border-blue-600 outline-none text-neutral-900 shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('CONFIRM');
                  setError(null);
                  setPasscode('');
                }}
                className="py-2.5 px-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all cursor-pointer"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={!passcode.trim()}
                className="py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Verify Passcode
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
