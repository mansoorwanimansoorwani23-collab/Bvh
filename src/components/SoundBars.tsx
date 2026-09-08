import React, { useEffect, useRef } from 'react';
import { SessionStatus, VibeTheme } from '../types';

interface SoundBarsProps {
  status: SessionStatus;
  theme: VibeTheme;
  isAiSpeaking: boolean;
  isMuted: boolean;
  analysers: {
    input: AnalyserNode | null;
    output: AnalyserNode | null;
  };
}

export const SoundBars: React.FC<SoundBarsProps> = ({
  status,
  theme,
  isAiSpeaking,
  isMuted,
  analysers,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const themeColors: Record<VibeTheme, [string, string]> = {
    'neon-cyber': ['#06b6d4', '#8b5cf6'],
    'sunset-rose': ['#f43f5e', '#fb923c'],
    'electric-violet': ['#a855f7', '#ec4899'],
    'midnight-emerald': ['#10b981', '#06b6d4'],
    'crimson-passion': ['#e11d48', '#f59e0b'],
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activeAnalyser = isAiSpeaking ? analysers.output : analysers.input;
    const bufferLength = activeAnalyser ? activeAnalyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const numBars = 36;
    const [c1, c2] = themeColors[theme] || themeColors['neon-cyber'];

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isActive =
        (status === 'listening' && !isMuted) || (status === 'speaking' && isAiSpeaking);

      if (activeAnalyser && isActive) {
        activeAnalyser.getByteFrequencyData(dataArray);
      }

      const barWidth = 3;
      const gap = 5;
      const totalWidth = numBars * (barWidth + gap);
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < numBars; i++) {
        let value = 0;
        if (isActive && activeAnalyser) {
          // Map to symmetric EQ (higher in middle, lower on edges)
          const distFromCenter = Math.abs(i - numBars / 2) / (numBars / 2);
          const binIndex = Math.floor((1 - distFromCenter) * 20);
          value = dataArray[binIndex] || 0;
        } else if (status === 'connecting') {
          // Gentle animated idle wave
          value = 30 + Math.sin(Date.now() * 0.005 + i * 0.3) * 20;
        } else {
          value = 6;
        }

        const barHeight = Math.max(3, (value / 255) * (height - 8));
        const x = startX + i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [status, theme, isAiSpeaking, isMuted, analysers]);

  return (
    <div className="w-full max-w-sm flex items-center justify-center h-14">
      <canvas
        ref={canvasRef}
        width={340}
        height={48}
        className="w-[340px] h-[48px] pointer-events-none"
      />
    </div>
  );
};
