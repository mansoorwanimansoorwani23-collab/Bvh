export type SessionStatus =
  | 'disconnected'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'interrupted'
  | 'error';

export type VibeTheme =
  | 'neon-cyber'
  | 'sunset-rose'
  | 'electric-violet'
  | 'midnight-emerald'
  | 'crimson-passion';

export type GeminiVoice =
  | 'Hinata'
  | 'Aoede'
  | 'Kore'
  | 'Puck'
  | 'Fenrir'
  | 'Zephyr'
  | 'Charon';

export type GeminiLiveModel =
  | 'gemini-3.1-flash-live-preview'
  | 'gemini-3.5-transcribe-live';

export interface VoiceOption {
  id: GeminiVoice;
  name: string;
  tone: string;
  description: string;
  gender: 'Female' | 'Male' | 'Neutral';
  tag: string;
}

export interface ModelOption {
  id: GeminiLiveModel;
  name: string;
  tag: string;
  description: string;
  isLatest: boolean;
}

export interface ToolActionCall {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: number;
}

export interface QuickNote {
  id: string;
  text: string;
  category: string;
  timestamp: number;
}

export interface SassyReaction {
  id: string;
  text: string;
  type: 'status' | 'quote' | 'tool' | 'tease';
  timestamp: number;
}

export interface LiveSessionConfig {
  voice: GeminiVoice;
  model: GeminiLiveModel;
  theme: VibeTheme;
  apiKey?: string;
  autoConnect?: boolean;
}

