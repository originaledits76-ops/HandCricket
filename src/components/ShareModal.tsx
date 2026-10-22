import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle } from 'lucide-react';
import { sound } from '../utils/audio';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, roomId }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const roomUrl = `${window.location.origin}/${roomId}`;

  const copyUrl = () => {
    sound.playTap();
    navigator.clipboard.writeText(roomUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const copyCode = () => {
    sound.playTap();
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareWhatsApp = () => {
    sound.playTap();
    const text = `Join my Hand Cricket duel!\nRoom Code: ${roomId}\nPlay here: ${roomUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareNative = () => {
    sound.playTap();
    if (navigator.share) {
      navigator
        .share({
          title: 'Hand Cricket Duel',
          text: `Join my Hand Cricket room using code ${roomId}:`,
          url: roomUrl,
        })
        .catch(() => copyUrl());
    } else {
      copyUrl();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/35 backdrop-blur-sm animate-fadeIn box-border overflow-y-auto">
      <div className="w-full max-w-[min(24rem,calc(100vw-1.5rem))] liquid-card rounded-3xl shadow-2xl p-5 sm:p-6 text-center space-y-4 box-border my-auto">
        <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
          <div className="text-left">
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">
              Share Room
            </h3>
            <p className="text-[11px] text-neutral-500">
              Invite your opponent to start
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

        {/* Room Code Display */}
        <div className="p-3.5 rounded-2xl bg-white/70 border border-neutral-200/80 flex items-center justify-between shadow-2xs">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Room Code
            </span>
            <span className="text-2xl font-mono font-bold tracking-widest text-neutral-900">
              {roomId}
            </span>
          </div>
          <button
            onClick={copyCode}
            className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-xs font-semibold text-neutral-800 transition-all flex items-center gap-1 cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Room URL Display */}
        <div className="space-y-1.5 text-left">
          <span className="text-[11px] font-semibold text-neutral-600">Direct Match URL</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={roomUrl}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-neutral-100/80 border border-neutral-200 text-xs font-mono text-neutral-700 outline-none select-all truncate"
            />
            <button
              onClick={copyUrl}
              className="px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Share Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={shareWhatsApp}
            className="py-2.5 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={shareNative}
            className="py-2.5 px-3 rounded-2xl bg-neutral-800 hover:bg-neutral-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>More Apps</span>
          </button>
        </div>
      </div>
    </div>
  );
};
