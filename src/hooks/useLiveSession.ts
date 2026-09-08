import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioStreamer } from '../services/AudioStreamer';
import { AudioRecorder } from '../services/AudioRecorder';
import { soundEffects } from '../services/soundEffects';
import { SessionStatus, ToolActionCall, QuickNote, SassyReaction, VibeTheme, GeminiVoice, GeminiLiveModel } from '../types';

export function useLiveSession(initialTheme: VibeTheme = 'neon-cyber') {
  const [status, setStatus] = useState<SessionStatus>('disconnected');
  const [theme, setTheme] = useState<VibeTheme>(initialTheme);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<ToolActionCall | null>(null);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [reactions, setReactions] = useState<SassyReaction[]>([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  // Gemini Voice, Model & API Key state
  const [voice, setVoiceState] = useState<GeminiVoice>(() => {
    return (localStorage.getItem('alisha_voice') || localStorage.getItem('roxy_voice') || 'Hinata') as GeminiVoice;
  });
  const [model, setModelState] = useState<GeminiLiveModel>(() => {
    return (localStorage.getItem('alisha_model') || localStorage.getItem('roxy_model') || 'gemini-3.1-flash-live-preview') as GeminiLiveModel;
  });
  const [customApiKey, setCustomApiKeyState] = useState<string>(() => {
    return localStorage.getItem('gemini_custom_api_key') || '';
  });
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [needsApiKey, setNeedsApiKey] = useState<boolean>(false);

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const streamerRef = useRef<AudioStreamer | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // Visualizer analysers
  const [analysers, setAnalysers] = useState<{
    input: AnalyserNode | null;
    output: AnalyserNode | null;
  }>({ input: null, output: null });

  // Add sassy status quotes
  const addReaction = useCallback((text: string, type: SassyReaction['type'] = 'status') => {
    const reaction: SassyReaction = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      type,
      timestamp: Date.now(),
    };
    setReactions((prev) => [reaction, ...prev.slice(0, 15)]);
  }, []);

  const setVoice = useCallback((newVoice: GeminiVoice) => {
    setVoiceState(newVoice);
    localStorage.setItem('alisha_voice', newVoice);
    addReaction(`Voice set to ${newVoice}`, 'status');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'changeVoice', voice: newVoice }));
    }
  }, [addReaction]);

  const setModel = useCallback((newModel: GeminiLiveModel) => {
    setModelState(newModel);
    localStorage.setItem('alisha_model', newModel);
    addReaction(`Voice model switched to ${newModel}`, 'status');
  }, [addReaction]);

  const setCustomApiKey = useCallback((newKey: string) => {
    const trimmed = newKey.trim();
    setCustomApiKeyState(trimmed);
    if (trimmed) {
      localStorage.setItem('gemini_custom_api_key', trimmed);
      setNeedsApiKey(false);
      setErrorMessage(null);
    } else {
      localStorage.removeItem('gemini_custom_api_key');
    }
  }, []);

  // Check server health on mount
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        const serverKeyAvailable = !!data.hasApiKey;
        setHasServerKey(serverKeyAvailable);
        // If neither server key nor custom key is set, guide the user to input their key
        const storedKey = localStorage.getItem('gemini_custom_api_key');
        if (!serverKeyAvailable && !storedKey) {
          setNeedsApiKey(true);
        }
      }
    } catch (err) {
      console.warn('[useLiveSession] Health check warning:', err);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Handle incoming tool calls
  const handleToolCalls = useCallback((calls: any[]) => {
    for (const call of calls) {
      const toolCall: ToolActionCall = {
        id: call.id || Math.random().toString(),
        name: call.name,
        args: call.args || {},
        timestamp: Date.now(),
      };

      setLastAction(toolCall);

      if (call.name === 'openWebsite') {
        const { url, title, reason } = call.args || {};
        if (url) {
          addReaction(`Opening ${title || url}: "${reason || 'Check this out!'}"`, 'tool');
          try {
            window.open(url, '_blank', 'noopener,noreferrer');
          } catch {
            console.log('[useLiveSession] Browser popup blocked, presenting HUD card');
          }
        }
      } else if (call.name === 'changeVibeTheme') {
        const newTheme = call.args?.theme as VibeTheme;
        if (newTheme) {
          setTheme(newTheme);
          addReaction(call.args?.moodComment || `Lighting shifted to ${newTheme}!`, 'tool');
          soundEffects.playChime();
        }
      } else if (call.name === 'takeQuickNote') {
        const { note, category } = call.args || {};
        if (note) {
          const newNote: QuickNote = {
            id: Math.random().toString(36).substring(2, 9),
            text: note,
            category: category || 'Note',
            timestamp: Date.now(),
          };
          setNotes((prev) => [newNote, ...prev]);
          addReaction(`Saved to memory: "${note}"`, 'tool');
          soundEffects.playChime();
        }
      } else if (call.name === 'triggerSoundEffect') {
        const effect = call.args?.effect;
        if (effect) {
          soundEffects.playEffect(effect);
          addReaction(`*${effect.toUpperCase()}* - ${call.args?.reason || 'Nailed it!'}`, 'tease');
        }
      }
    }
  }, [addReaction]);

  // Connect function
  const connect = useCallback(async () => {
    if (status === 'connecting' || status === 'listening' || status === 'speaking') {
      return;
    }

    try {
      setStatus('connecting');
      setErrorMessage(null);
      setNeedsApiKey(false);

      // 1. Initialize Audio Streamer (24kHz Web Audio playback)
      const streamer = new AudioStreamer((playing) => {
        setIsAiSpeaking(playing);
        setStatus((current) => {
          if (current === 'disconnected' || current === 'error') return current;
          return playing ? 'speaking' : 'listening';
        });
      });
      await streamer.init();
      streamerRef.current = streamer;

      // 2. Initialize Audio Recorder (16kHz mic capture)
      const recorder = new AudioRecorder((pcm16Base64) => {
        if (isMutedRef.current) return;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'audio',
              audio: pcm16Base64,
            })
          );
        }
      });
      await recorder.start();
      recorderRef.current = recorder;

      setAnalysers({
        input: recorder.getAnalyser(),
        output: streamer.getAnalyser(),
      });

      // 3. Connect to WebSocket with query params for model, voice, and optional custom apiKey
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const searchParams = new URLSearchParams();
      searchParams.set('voice', voice);
      searchParams.set('model', model);
      if (customApiKey.trim()) {
        searchParams.set('apiKey', customApiKey.trim());
      }
      const wsUrl = `${protocol}//${window.location.host}/live?${searchParams.toString()}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[useLiveSession] WebSocket connected');
        // Send init handshake payload with apiKey, voice, and model
        ws.send(
          JSON.stringify({
            type: 'init',
            apiKey: customApiKey.trim(),
            voice,
            model,
          })
        );
        soundEffects.playConnected();
        addReaction(`Connecting Alisha with ${voice} voice on ${model}...`, 'status');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'connectionEstablished') {
            if (!msg.hasServerKey && !customApiKey.trim()) {
              setNeedsApiKey(true);
              setErrorMessage('Gemini API key is required. Please enter your key in Settings.');
            }
          } else if (msg.type === 'sessionReady') {
            setStatus('listening');
            addReaction(`Alisha is live! Speaking in ${msg.voice || voice} voice. Created by Rauf.`, 'status');
          } else if (msg.type === 'needsApiKey') {
            setNeedsApiKey(true);
            setErrorMessage(msg.message || 'Please enter your Gemini API key in Settings.');
            setStatus('error');
          } else if (msg.type === 'audio' && msg.audio) {
            streamerRef.current?.addAudioChunk(msg.audio);
          } else if (msg.type === 'interrupted') {
            streamerRef.current?.handleInterruption();
            soundEffects.playInterrupted();
            setStatus('listening');
            addReaction("Hold on, you've got my full attention!", 'status');
          } else if (msg.type === 'toolCall' && msg.calls) {
            handleToolCalls(msg.calls);
          } else if (msg.type === 'error') {
            setErrorMessage(msg.message || 'Live session encountered an issue.');
            if (msg.needsApiKey || String(msg.message || '').includes('API key') || String(msg.message || '').includes('credentials')) {
              setNeedsApiKey(true);
            }
            setStatus('error');
          }
        } catch (err) {
          console.error('[useLiveSession] Error handling WS message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[useLiveSession] WebSocket error:', err);
        setErrorMessage('Connection error. Please check your internet connection.');
        setStatus('error');
      };

      ws.onclose = () => {
        console.log('[useLiveSession] WebSocket disconnected');
        disconnect();
      };

      // Start duration timer
      setSessionTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSessionTime((t) => t + 1);
      }, 1000);
    } catch (err: any) {
      console.error('[useLiveSession] Connection failure:', err);
      setErrorMessage(
        err?.message || 'Could not access microphone or connect to Gemini Live.'
      );
      setStatus('error');
      disconnect();
    }
  }, [status, voice, model, customApiKey, handleToolCalls, addReaction]);

  // Disconnect function
  const disconnect = useCallback(() => {
    soundEffects.playDisconnected();
    setStatus('disconnected');
    setIsAiSpeaking(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    if (streamerRef.current) {
      streamerRef.current.stop();
      streamerRef.current.close();
      streamerRef.current = null;
    }

    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    setAnalysers({ input: null, output: null });
    addReaction('Session paused. Tap to call me back anytime!', 'status');
  }, [addReaction]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      addReaction(next ? 'Mic muted 🤐' : 'Mic unmuted 🎙️', 'status');
      return next;
    });
  }, [addReaction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
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
    checkHealth,
    connect,
    disconnect,
    addReaction,
  };
}
