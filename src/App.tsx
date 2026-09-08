/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { App as CapacitorApp } from '@capacitor/app';
import {
  Sparkles,
  Bookmark,
  Radio,
  Clock,
  ShieldCheck,
  Zap,
  AlertCircle,
  HelpCircle,
  X,
  Key,
  Volume2,
} from 'lucide-react';
import { useLiveSession } from './hooks/useLiveSession';
import { AudioOrb } from './components/AudioOrb';
import { SoundBars } from './components/SoundBars';
import { ToolActionCard } from './components/ToolActionCard';
import { NotesDrawer } from './components/NotesDrawer';
import { QuickPrompts } from './components/QuickPrompts';
import { ThemePicker } from './components/ThemePicker';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [showPersonaInfo, setShowPersonaInfo] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    status,
    theme,
    setTheme,
    isMuted,
    toggleMute,
    errorMessage,
    setErrorMessage,
    lastAction,
    setLastAction,
    notes,
    setNotes,
    reactions,
    sessionTime,
    isAiSpeaking,
    analysers,
    voice,
    setVoice,
    model,
    setModel,
    customApiKey,
    setCustomApiKey,
    hasServerKey,
    needsApiKey,
    setNeedsApiKey,
    connect,
    disconnect,
  } = useLiveSession('neon-cyber');

  const handleTogglePower = () => {
    if (status === 'disconnected' || status === 'error') {
      connect();
    } else {
      disconnect();
    }
  };

  const handleVoiceChange = (newVoice: any) => {
    setVoice(newVoice);
    if (status === 'listening' || status === 'speaking') {
      disconnect();
      setTimeout(() => connect(), 250);
    }
  };

  const handleApiKeySave = (key: string) => {
    setCustomApiKey(key);
    if (status === 'listening' || status === 'speaking') {
      disconnect();
      setTimeout(() => connect(), 250);
    }
  };

  // Handle native Android hardware back button
  useEffect(() => {
    let removeListener: (() => void) | undefined;
    try {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isNotesOpen) {
          setIsNotesOpen(false);
        } else if (showPersonaInfo) {
          setShowPersonaInfo(false);
        } else if (canGoBack) {
          window.history.back();
        } else {
          CapacitorApp.exitApp();
        }
      }).then((handle) => {
        removeListener = () => handle.remove();
      });
    } catch {
      // Running inside standard desktop browser
    }
    return () => {
      if (removeListener) removeListener();
    };
  }, [isSettingsOpen, isNotesOpen, showPersonaInfo]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current active attitude reaction text
  const currentReaction = reactions[0]?.text || (
    status === 'speaking'
      ? "Dropping some truth bombs..."
      : status === 'listening'
      ? "I'm listening, tell me everything..."
      : status === 'connecting'
      ? "Connecting to satellite..."
      : "Tap the core to talk to Alisha"
  );

  return (
    <div
      className={`min-h-screen w-full bg-black text-white relative overflow-hidden flex flex-col justify-between selection:bg-rose-500/30 selection:text-rose-200 transition-colors duration-700 font-sans`}
    >
      {/* Background Ambient Cyber Grid & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        {/* Brand & Persona Identity */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-500 to-amber-400 p-[1px] shadow-lg shadow-rose-500/20">
              <div className="w-full h-full rounded-2xl bg-zinc-950 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            {status !== 'disconnected' && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Alisha
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Hinata Persona
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800/90 text-zinc-300 border border-zinc-700/60">
                by Rauf
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">Real-Time Voice AI Companion</p>
          </div>
        </div>

        {/* Center/Right Status & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Session Time */}
          {status !== 'disconnected' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 font-mono"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formatTimer(sessionTime)}</span>
            </motion.div>
          )}

          {/* Gemini API Key & Voice Settings Button */}
          <button
            id="voice-ai-settings-button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all flex items-center gap-2"
            title="Gemini Voice Model & API Key Settings"
            aria-label="Open settings"
          >
            <Key className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline text-xs font-semibold text-zinc-300">
              {voice}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                customApiKey
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : hasServerKey
                  ? 'bg-cyan-400'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
          </button>

          {/* Theme Switcher */}
          <div className="hidden md:block">
            <ThemePicker currentTheme={theme} onSelectTheme={setTheme} />
          </div>

          {/* Notes / Memory Button */}
          <button
            id="voice-ai-memory-button"
            onClick={() => setIsNotesOpen(true)}
            className="relative p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
            title="Saved Notes & Memory"
            aria-label="Open saved notes"
          >
            <Bookmark className="w-4 h-4 text-purple-400" />
            {notes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[10px] font-bold">
                {notes.length}
              </span>
            )}
          </button>

          {/* Persona Info Modal Button */}
          <button
            id="voice-ai-info-button"
            onClick={() => setShowPersonaInfo(true)}
            className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
            title="About Persona"
            aria-label="Persona Details"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Center Voice Experience Stage */}
      <main className="relative z-20 flex-1 max-w-4xl w-full mx-auto px-4 flex flex-col items-center justify-center py-4 sm:py-6">
        {/* Error Alert if any */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 w-full max-w-md p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-200 flex items-start gap-3 text-xs"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-rose-100">Session Notice</p>
              <p className="text-rose-300/90 mt-0.5">{errorMessage}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
              >
                API Settings
              </button>
              <button
                onClick={() => handleTogglePower()}
                className="px-2.5 py-1 rounded-lg bg-rose-800/60 hover:bg-rose-700 text-rose-100 font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* Active Tool Action Notification */}
        {lastAction && (
          <div className="w-full mb-4">
            <ToolActionCard action={lastAction} onDismiss={() => setLastAction(null)} />
          </div>
        )}

        {/* Dynamic Sassy Status Bubble */}
        <motion.div
          key={currentReaction}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center max-w-md px-4 py-2 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-md"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <p className="text-sm font-medium text-zinc-200 tracking-wide italic">
              "{currentReaction}"
            </p>
          </div>
        </motion.div>

        {/* Central Audio Holographic Orb */}
        <div className="my-2 sm:my-4 flex items-center justify-center">
          <AudioOrb
            status={status}
            theme={theme}
            isMuted={isMuted}
            isAiSpeaking={isAiSpeaking}
            analysers={analysers}
            onTogglePower={handleTogglePower}
            onToggleMute={toggleMute}
          />
        </div>

        {/* Audio Spectrum Frequency Waveform */}
        <div className="mt-4 w-full flex flex-col items-center">
          <SoundBars
            status={status}
            theme={theme}
            isAiSpeaking={isAiSpeaking}
            isMuted={isMuted}
            analysers={analysers}
          />
        </div>

        {/* Status Pill Badges & Quick Settings Trigger */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1.5 transition-colors"
            title="Click to view or change voice model"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-mono">Gemini 3.1 Flash Live</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1.5 transition-colors"
            title="Click to change voice"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Voice: <strong className="text-zinc-200">{voice}</strong></span>
          </button>

          <div className="px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 text-xs flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Sub-second Latency</span>
          </div>

          <div className="px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{customApiKey ? 'Custom Key' : 'Server Key'}</span>
          </div>
        </div>
      </main>

      {/* Bottom Section: Sassy Voice Prompts & Mobile Theme Switcher */}
      <footer className="relative z-20 w-full pb-4 sm:pb-6">
        <div className="md:hidden flex justify-center mb-3">
          <ThemePicker currentTheme={theme} onSelectTheme={setTheme} />
        </div>
        <QuickPrompts />
        <div className="mt-3 text-center">
          <p className="text-[11px] text-zinc-500 font-medium">
            Developed by <span className="text-zinc-300 font-semibold">Rauf</span> • Powered by Gemini Live API
          </p>
        </div>
      </footer>

      {/* Slide-over Notes & Memory Drawer */}
      <NotesDrawer
        isOpen={isNotesOpen}
        notes={notes}
        onClose={() => setIsNotesOpen(false)}
        onClearNotes={() => setNotes([])}
        onDeleteNote={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
      />

      {/* Settings Modal (Gemini Voice & API Key Input Option) */}
      <SettingsModal
        isOpen={isSettingsOpen || needsApiKey}
        onClose={() => {
          setIsSettingsOpen(false);
          setNeedsApiKey(false);
        }}
        voice={voice}
        onSelectVoice={handleVoiceChange}
        model={model}
        onSelectModel={setModel}
        customApiKey={customApiKey}
        onSaveApiKey={handleApiKeySave}
        hasServerKey={hasServerKey}
        isConnected={status !== 'disconnected'}
      />

      {/* Persona & Features Info Modal */}
      <AnimatePresence>
        {showPersonaInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPersonaInfo(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-400" />
                  <h3 className="text-base font-bold text-white">Meet Alisha (Hinata)</h3>
                </div>
                <button
                  onClick={() => setShowPersonaInfo(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs text-zinc-300 leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
                  <h4 className="font-semibold text-amber-300 text-sm mb-1">
                    Developer & Creator
                  </h4>
                  <p className="text-zinc-300">
                    Proudly developed and engineered by <span className="font-semibold text-white">Rauf</span>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
                  <h4 className="font-semibold text-rose-300 text-sm mb-1">
                    Persona & Attitude
                  </h4>
                  <p>
                    Warm, confident, witty, and playfully affectionate. Speaks with the sweet yet sassy energy
                    of Hinata and Alisha with charming banter, quick jokes, and heartfelt connection.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
                  <h4 className="font-semibold text-cyan-300 text-sm mb-1">
                    Gemini Live Streaming Pipeline
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400">
                    <li>Pure bidirectional voice streaming (PCM16 16kHz in, 24kHz out).</li>
                    <li>Powered by the latest <strong className="text-zinc-200">gemini-3.1-flash-live-preview</strong> model.</li>
                    <li>Default Voice: <strong className="text-zinc-200">Hinata</strong> (plus Aoede, Kore, Puck, Zephyr, Fenrir, Charon).</li>
                    <li>Robust init handshake and real-time interruption handling.</li>
                    <li>Support for custom user Gemini API keys and server-configured credentials.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
                  <h4 className="font-semibold text-purple-300 text-sm mb-1">
                    Function Calling Tools
                  </h4>
                  <p className="text-zinc-400">
                    Alisha can open websites (<code className="text-purple-300">openWebsite</code>), switch
                    lighting moods (<code className="text-purple-300">changeVibeTheme</code>), store memories (
                    <code className="text-purple-300">takeQuickNote</code>), or play sound effects (
                    <code className="text-purple-300">triggerSoundEffect</code>).
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPersonaInfo(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg transition-all"
              >
                Let's Talk!
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

