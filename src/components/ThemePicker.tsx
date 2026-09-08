import React from 'react';
import { Palette } from 'lucide-react';
import { VibeTheme } from '../types';

interface ThemePickerProps {
  currentTheme: VibeTheme;
  onSelectTheme: (theme: VibeTheme) => void;
}

const THEMES: { id: VibeTheme; name: string; colors: string; border: string }[] = [
  {
    id: 'neon-cyber',
    name: 'Cyber',
    colors: 'from-cyan-500 to-violet-600',
    border: 'border-cyan-500',
  },
  {
    id: 'sunset-rose',
    name: 'Sunset',
    colors: 'from-rose-500 to-amber-500',
    border: 'border-rose-500',
  },
  {
    id: 'electric-violet',
    name: 'Violet',
    colors: 'from-purple-500 to-pink-500',
    border: 'border-purple-500',
  },
  {
    id: 'midnight-emerald',
    name: 'Emerald',
    colors: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-500',
  },
  {
    id: 'crimson-passion',
    name: 'Crimson',
    colors: 'from-red-600 to-orange-500',
    border: 'border-red-500',
  },
];

export const ThemePicker: React.FC<ThemePickerProps> = ({ currentTheme, onSelectTheme }) => {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-md">
      <div className="pl-2 pr-1 text-zinc-500 flex items-center">
        <Palette className="w-3.5 h-3.5" />
      </div>
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelectTheme(t.id)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            currentTheme === t.id
              ? `bg-gradient-to-r ${t.colors} text-white shadow-md font-semibold`
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
};
