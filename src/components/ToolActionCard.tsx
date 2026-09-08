import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Palette, Bookmark, Volume2, X } from 'lucide-react';
import { ToolActionCall } from '../types';

interface ToolActionCardProps {
  action: ToolActionCall | null;
  onDismiss: () => void;
}

export const ToolActionCard: React.FC<ToolActionCardProps> = ({ action, onDismiss }) => {
  if (!action) return null;

  const renderContent = () => {
    switch (action.name) {
      case 'openWebsite': {
        const { url, title, reason } = action.args;
        return (
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Browser Action
                </span>
                <span className="text-[10px] text-zinc-500">Just now</span>
              </div>
              <p className="text-sm font-medium text-white truncate mt-0.5">{title || url}</p>
              {reason && <p className="text-xs text-zinc-400 mt-1 italic">"{reason}"</p>}
              <div className="mt-2.5 flex items-center gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition-colors"
                >
                  <span>Open Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <span className="text-[11px] text-zinc-500 truncate">{url}</span>
              </div>
            </div>
          </div>
        );
      }

      case 'changeVibeTheme': {
        const { theme, moodComment } = action.args;
        return (
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                  Vibe Switch
                </span>
                <span className="text-[10px] text-zinc-500">Just now</span>
              </div>
              <p className="text-sm font-medium text-white mt-0.5">Atmosphere changed to: {theme}</p>
              {moodComment && <p className="text-xs text-zinc-400 mt-1 italic">"{moodComment}"</p>}
            </div>
          </div>
        );
      }

      case 'takeQuickNote': {
        const { note, category } = action.args;
        return (
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Bookmark className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Memory Saved: {category || 'Quick Note'}
                </span>
                <span className="text-[10px] text-zinc-500">Just now</span>
              </div>
              <p className="text-sm font-medium text-white mt-0.5">"{note}"</p>
            </div>
          </div>
        );
      }

      case 'triggerSoundEffect': {
        const { effect, reason } = action.args;
        return (
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Audio Reaction
                </span>
                <span className="text-[10px] text-zinc-500">Just now</span>
              </div>
              <p className="text-sm font-medium text-white mt-0.5 capitalize">{effect} Effect</p>
              {reason && <p className="text-xs text-zinc-400 mt-1 italic">"{reason}"</p>}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="w-full max-w-md mx-auto relative rounded-2xl bg-zinc-900/90 border border-zinc-700/60 p-4 shadow-2xl backdrop-blur-xl z-30"
      >
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          aria-label="Dismiss action notification"
        >
          <X className="w-4 h-4" />
        </button>
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
};
