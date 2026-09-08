import React from 'react';
import { Sparkles, MessageCircleHeart, Flame, Compass, HelpCircle } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt?: (prompt: string) => void;
}

const PROMPT_CATEGORIES = [
  {
    icon: Flame,
    color: 'text-rose-400',
    title: 'Sassy Banter',
    prompts: [
      "Roast my procrastination habits today!",
      "Give me a brutally honest pep talk.",
      "Tell me your spiciest hot take.",
    ],
  },
  {
    icon: MessageCircleHeart,
    color: 'text-pink-400',
    title: 'Flirty & Playful',
    prompts: [
      "Give me a cheesy but charming pickup line.",
      "Help me decide if I should text my crush.",
      "Hypeme up for my weekend plans!",
    ],
  },
  {
    icon: Compass,
    color: 'text-cyan-400',
    title: 'Quick Tools & Web',
    prompts: [
      "Open YouTube and show me lo-fi beats.",
      "Switch the lighting vibe to electric violet!",
      "Take a quick note: Remind me to hydrate!",
    ],
  },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = () => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-2">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Things you can ask Roxy out loud</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
          <HelpCircle className="w-3 h-3" />
          <span>Voice-to-Voice only</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {PROMPT_CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                <span className="text-xs font-semibold text-zinc-300">{cat.title}</span>
              </div>
              <p className="text-xs text-zinc-400 italic">
                "{cat.prompts[0]}"
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
