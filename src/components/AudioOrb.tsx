import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Power, Sparkles, Volume2 } from 'lucide-react';
import { SessionStatus, VibeTheme } from '../types';

interface AudioOrbProps {
  status: SessionStatus;
  theme: VibeTheme;
  isMuted: boolean;
  isAiSpeaking: boolean;
  analysers: {
    input: AnalyserNode | null;
    output: AnalyserNode | null;
  };
  onTogglePower: () => void;
  onToggleMute: () => void;
}

export const AudioOrb: React.FC<AudioOrbProps> = ({
  status,
  theme,
  isMuted,
  isAiSpeaking,
  analysers,
  onTogglePower,
  onToggleMute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Theme color maps for dynamic glowing aura
  const themeGradients: Record<VibeTheme, { primary: string; secondary: string; glow: string; text: string }> = {
    'neon-cyber': {
      primary: '#06b6d4', // cyan-500
      secondary: '#8b5cf6', // violet-500
      glow: 'rgba(6, 182, 212, 0.4)',
      text: 'text-cyan-400',
    },
    'sunset-rose': {
      primary: '#f43f5e', // rose-500
      secondary: '#fb923c', // orange-400
      glow: 'rgba(244, 63, 94, 0.45)',
      text: 'text-rose-400',
    },
    'electric-violet': {
      primary: '#a855f7', // purple-500
      secondary: '#ec4899', // pink-500
      glow: 'rgba(168, 85, 247, 0.45)',
      text: 'text-purple-400',
    },
    'midnight-emerald': {
      primary: '#10b981', // emerald-500
      secondary: '#06b6d4', // cyan-500
      glow: 'rgba(16, 185, 129, 0.45)',
      text: 'text-emerald-400',
    },
    'crimson-passion': {
      primary: '#e11d48', // rose-600
      secondary: '#f59e0b', // amber-500
      glow: 'rgba(225, 29, 72, 0.5)',
      text: 'text-rose-400',
    },
  };

  const currentTheme = themeGradients[theme] || themeGradients['neon-cyber'];

  // Render concentric audio-reactive wave particles inside the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const activeAnalyser = isAiSpeaking ? analysers.output : analysers.input;
    const dataArray = new Uint8Array(activeAnalyser ? activeAnalyser.frequencyBinCount : 64);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      let volume = 0;
      if (activeAnalyser && (status === 'speaking' || status === 'listening') && !isMuted) {
        activeAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 32; i++) {
          sum += dataArray[i];
        }
        volume = sum / 32 / 255; // 0 to 1
      }

      phase += 0.03 + volume * 0.05;

      const baseRadius = 80 + volume * 45;
      const numPoints = 64;

      // Outer wave ring
      if (status !== 'disconnected') {
        ctx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const freqVal = dataArray[i % 32] || 0;
          const displacement = Math.sin(angle * 6 + phase) * (8 + (freqVal / 255) * 30);
          const r = baseRadius + displacement;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, currentTheme.primary);
        grad.addColorStop(1, currentTheme.secondary);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 + volume * 4;
        ctx.shadowColor = currentTheme.primary;
        ctx.shadowBlur = 15 + volume * 20;
        ctx.stroke();

        // Inner secondary wave ring
        ctx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const freqVal = dataArray[(i + 8) % 32] || 0;
          const displacement = Math.cos(angle * 4 - phase * 1.5) * (5 + (freqVal / 255) * 20);
          const r = baseRadius * 0.78 + displacement;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = currentTheme.secondary;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [status, isAiSpeaking, isMuted, analysers, currentTheme]);

  const isConnected = status === 'listening' || status === 'speaking' || status === 'connecting';

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Dynamic Background Aura */}
      <motion.div
        className="absolute w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60"
        style={{
          background: `radial-gradient(circle, ${currentTheme.primary} 0%, ${currentTheme.secondary} 50%, transparent 75%)`,
        }}
        animate={{
          scale: status === 'speaking' ? [1.1, 1.35, 1.1] : status === 'listening' ? [0.95, 1.08, 0.95] : [0.85, 0.95, 0.85],
          opacity: isConnected ? [0.5, 0.8, 0.5] : [0.2, 0.35, 0.2],
        }}
        transition={{
          repeat: Infinity,
          duration: status === 'speaking' ? 1.4 : 3,
          ease: 'easeInOut',
        }}
      />

      {/* Reactive HTML5 Canvas for real-time soundwaves */}
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        className="absolute pointer-events-none z-10 w-[340px] h-[340px]"
      />

      {/* Main Central Interactive Core / Mic Button */}
      <motion.button
        id="voice-ai-power-button"
        onClick={onTogglePower}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        className="relative z-20 w-44 h-44 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/40"
        style={{
          background: isConnected
            ? `radial-gradient(circle at 35% 35%, #1e1b4b 0%, #0f172a 70%, #020617 100%)`
            : `radial-gradient(circle at 35% 35%, #1f2937 0%, #111827 70%, #030712 100%)`,
          boxShadow: isConnected
            ? `0 0 50px ${currentTheme.glow}, inset 0 0 25px rgba(255, 255, 255, 0.15), 0 10px 30px rgba(0, 0, 0, 0.8)`
            : `0 0 20px rgba(255, 255, 255, 0.05), inset 0 0 15px rgba(255, 255, 255, 0.05)`,
          border: `1.5px solid ${isConnected ? currentTheme.primary : 'rgba(255, 255, 255, 0.12)'}`,
        }}
        aria-label={isConnected ? 'Disconnect Voice Session' : 'Start Voice Session'}
      >
        {/* Core State Icon & Holographic Shimmer */}
        <div className="relative flex items-center justify-center">
          {status === 'connecting' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-2 border-t-transparent border-cyan-400"
            />
          ) : status === 'speaking' ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="flex items-center justify-center"
            >
              <Volume2 className="w-12 h-12 text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]" />
            </motion.div>
          ) : status === 'listening' ? (
            <motion.div
              animate={{ scale: isMuted ? 1 : [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex items-center justify-center"
            >
              {isMuted ? (
                <MicOff className="w-12 h-12 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
              ) : (
                <Mic className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
              )}
            </motion.div>
          ) : (
            <Power className="w-12 h-12 text-zinc-400 hover:text-white transition-colors" />
          )}
        </div>

        {/* State Label */}
        <div className="mt-3 text-center">
          <span
            className={`text-xs font-semibold uppercase tracking-widest ${
              status === 'speaking'
                ? 'text-rose-400 animate-pulse'
                : status === 'listening'
                ? 'text-cyan-400'
                : status === 'connecting'
                ? 'text-purple-400 animate-pulse'
                : 'text-zinc-500'
            }`}
          >
            {status === 'speaking'
              ? 'Roxy Speaking'
              : status === 'listening'
              ? isMuted
                ? 'Muted'
                : 'Listening...'
              : status === 'connecting'
              ? 'Connecting...'
              : 'Tap to Talk'}
          </span>
        </div>
      </motion.button>

      {/* Quick Mic Mute / Action Sub-control */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center gap-3 z-20"
        >
          <button
            id="voice-ai-mute-toggle"
            onClick={onToggleMute}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 border backdrop-blur-md transition-all ${
              isMuted
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-zinc-900/60 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800/80 hover:text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
          </button>

          <div className="px-3 py-1.5 rounded-full bg-zinc-900/70 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>24kHz Real-time Audio</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
