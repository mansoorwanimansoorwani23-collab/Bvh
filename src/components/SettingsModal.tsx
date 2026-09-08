import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Key,
  ShieldCheck,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Volume2,
  Cpu,
  Sparkles,
  RefreshCw,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { GeminiVoice, GeminiLiveModel, VoiceOption } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voice: GeminiVoice;
  onSelectVoice: (voice: GeminiVoice) => void;
  model: GeminiLiveModel;
  onSelectModel: (model: GeminiLiveModel) => void;
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
  hasServerKey: boolean;
  isConnected: boolean;
}

const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Hinata',
    name: 'Hinata (Alisha Signature)',
    tone: 'Sweet, Playful & Affectionate',
    description: 'Alisha premier signature voice with warm melodic cadence, charming banter, and witty comedic timing.',
    gender: 'Female',
    tag: 'Alisha Default',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    tone: 'Confident, Sassy & Expressive',
    description: 'Snappy inflection, crisp rhythm, and punchy personality with sharp one-liners.',
    gender: 'Female',
    tag: 'Sassy',
  },
  {
    id: 'Kore',
    name: 'Kore',
    tone: 'Calm, Sweet & Soothing',
    description: 'Gentle, melodious, and reassuring cadence, perfect for relaxed casual conversations.',
    gender: 'Female',
    tag: 'Calm',
  },
  {
    id: 'Puck',
    name: 'Puck',
    tone: 'Energetic, Playful & Spunky',
    description: 'High-energy, lively, and upbeat tone with animated expressions and humor.',
    gender: 'Neutral',
    tag: 'Playful',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    tone: 'Crisp, Smooth & Articulate',
    description: 'Modern, balanced, and friendly delivery with pristine clarity.',
    gender: 'Female',
    tag: 'Friendly',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    tone: 'Deep, Warm & Grounded',
    description: 'Rich, resonant baritone with steady and supportive presence.',
    gender: 'Male',
    tag: 'Deep',
  },
  {
    id: 'Charon',
    name: 'Charon',
    tone: 'Thoughtful & Contemplative',
    description: 'Calm, reflective, and deep tone suited for storytelling and advice.',
    gender: 'Male',
    tag: 'Resonant',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  voice,
  onSelectVoice,
  model,
  onSelectModel,
  customApiKey,
  onSaveApiKey,
  hasServerKey,
  isConnected,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(customApiKey);
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    valid?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'voice' | 'api'>('voice');

  // Sync input when customApiKey prop changes or modal opens
  React.useEffect(() => {
    setApiKeyInput(customApiKey);
    setVerifyResult(null);
  }, [customApiKey, isOpen]);

  const handleVerifyKey = async () => {
    const keyToTest = apiKeyInput.trim() || (hasServerKey ? undefined : '');
    if (!keyToTest && !hasServerKey) {
      setVerifyResult({ valid: false, error: 'Please enter a Gemini API key first.' });
      return;
    }

    try {
      setIsVerifying(true);
      setVerifyResult(null);

      const response = await fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest }),
      });

      const data = await response.json();
      if (response.ok && data.valid) {
        setVerifyResult({
          valid: true,
          message: data.message || 'Gemini API key is valid and connected!',
        });
      } else {
        setVerifyResult({
          valid: false,
          error: data.error || 'Invalid API key. Please check your key in Google AI Studio.',
        });
      }
    } catch (err: any) {
      setVerifyResult({
        valid: false,
        error: err.message || 'Network error verifying key.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveKey = () => {
    onSaveApiKey(apiKeyInput.trim());
    setVerifyResult({
      valid: true,
      message: apiKeyInput.trim()
        ? 'Custom API key saved successfully!'
        : 'Reverted to server default key.',
    });
  };

  const handleClearKey = () => {
    setApiKeyInput('');
    onSaveApiKey('');
    setVerifyResult({
      valid: true,
      message: 'Custom key cleared. Using server environment key.',
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl shadow-rose-950/20 overflow-hidden"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Gemini Voice & API Settings
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Latest 3.1 Live
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Customizable real-time voice timbre, live model, and API authentication
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              id="close-settings-modal-btn"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-800/80 bg-zinc-900/30 px-6 pt-2">
            <button
              onClick={() => setActiveTab('voice')}
              className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'voice'
                  ? 'border-rose-500 text-rose-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Voice & Live Model</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px]">
                {voice}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'api'
                  ? 'border-cyan-500 text-cyan-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Gemini API Key</span>
              {customApiKey ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                  Custom
                </span>
              ) : hasServerKey ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
                  Server Key
                </span>
              ) : (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                  Required
                </span>
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'voice' ? (
              <div className="space-y-6">
                {/* Voice Model Section */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                        Active Voice Model
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Latest Live Audio
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950/80 border border-cyan-500/30 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-cyan-300">
                          gemini-3.1-flash-live-preview
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-800 text-zinc-300">
                          Default
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Google DeepMind’s flagship multimodal live streaming model with bidirectional audio, native emotions, and sub-second latency.
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 ml-3" />
                  </div>
                </div>

                {/* Voice Preset Selection Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-rose-400" />
                        Official Gemini Voice Presets
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Choose Roxy’s speaking timbre and character tone
                      </p>
                    </div>
                    {isConnected && (
                      <span className="text-[11px] text-zinc-400">
                        Active session will update on select
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_VOICES.map((v) => {
                      const isSelected = voice === v.id;
                      return (
                        <button
                          key={v.id}
                          id={`voice-option-${v.id.toLowerCase()}`}
                          onClick={() => onSelectVoice(v.id)}
                          className={`relative text-left p-3.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-rose-500/10 border-rose-500/50 shadow-md shadow-rose-950/30 ring-1 ring-rose-500/40'
                              : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900/80 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{v.name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-zinc-800 text-zinc-300">
                                {v.gender}
                              </span>
                            </div>
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white">
                                <Check className="w-3 h-3" />
                              </div>
                            ) : (
                              <span className="text-[10px] font-medium text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800/50">
                                {v.tag}
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-medium text-rose-300/90 mb-1">
                            {v.tone}
                          </div>

                          <p className="text-[11px] text-zinc-400 line-clamp-2">
                            {v.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* API Key Tab */
              <div className="space-y-6">
                {/* Active Key Status Card */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs text-zinc-400">Current Authentication Status</div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        {customApiKey ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Custom Gemini Key Active
                          </>
                        ) : hasServerKey ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                            Server Environment Key Active
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            No Key Provided
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {customApiKey && (
                    <button
                      onClick={handleClearKey}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 flex items-center gap-1.5 transition-colors"
                      title="Clear custom key and use server default"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Use Default</span>
                    </button>
                  )}
                </div>

                {/* API Key Input Section */}
                <div className="space-y-2">
                  <label htmlFor="gemini-api-key-input" className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                    <span>Enter Your Gemini API Key</span>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
                    >
                      <span>Get Free API Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>

                  <div className="relative">
                    <input
                      id="gemini-api-key-input"
                      type={showKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => {
                        setApiKeyInput(e.target.value);
                        setVerifyResult(null);
                      }}
                      placeholder="Paste your key: AIzaSy..."
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1 rounded-md"
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    Your key is saved only in your local browser storage and used to establish the Gemini Live session.
                  </p>
                </div>

                {/* Verification result alerts */}
                {verifyResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                      verifyResult.valid
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {verifyResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">
                        {verifyResult.valid ? 'Verification Successful' : 'Validation Failed'}
                      </div>
                      <div className="text-zinc-300 mt-0.5">
                        {verifyResult.message || verifyResult.error}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Buttons row */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    id="verify-api-key-btn"
                    onClick={handleVerifyKey}
                    disabled={isVerifying}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-2 border border-zinc-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>{isVerifying ? 'Verifying with Gemini...' : 'Test & Verify Key'}</span>
                  </button>

                  <button
                    id="save-api-key-btn"
                    onClick={handleSaveKey}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save API Key</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer / Close */}
          <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-zinc-300 font-medium">Active Voice:</span>
              <span className="font-semibold text-rose-400">{voice}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300 font-medium">Model:</span>
              <span className="font-mono text-cyan-400 text-[11px]">{model}</span>
            </div>

            <button
              onClick={onClose}
              id="confirm-settings-btn"
              className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
