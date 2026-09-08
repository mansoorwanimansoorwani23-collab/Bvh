import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const server = http.createServer(app);

// Helper to check for standard Google AI Studio Gemini API keys
function isValidGeminiApiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  // Standard AI Studio API keys start with AIzaSy and are >= 30 chars
  return trimmed.startsWith("AIza") && trimmed.length >= 30;
}

// Voice mapping for Gemini Live API prebuilt voices
// Gemini Live accepts: Aoede, Kore, Puck, Fenrir, Zephyr, Charon
const LIVE_VOICE_MAP: Record<string, string> = {
  Hinata: "Kore", // Hinata's sweet, affectionate, gentle tone
  Alisha: "Aoede", // Confident, witty, snappy tone
  Aoede: "Aoede",
  Kore: "Kore",
  Puck: "Puck",
  Fenrir: "Fenrir",
  Zephyr: "Zephyr",
  Charon: "Charon",
};

app.use(express.json());

// API health endpoint
app.get("/api/health", (_req, res) => {
  const envKey = process.env.GEMINI_API_KEY;
  const hasValidServerKey = isValidGeminiApiKey(envKey);

  res.json({
    status: "ok",
    hasApiKey: hasValidServerKey,
    assistantName: "Alisha",
    developer: "Rauf",
    defaultVoice: "Hinata",
    defaultModel: "gemini-3.1-flash-live-preview",
    supportedModels: [
      {
        id: "gemini-3.1-flash-live-preview",
        name: "Gemini 3.1 Flash Live (Latest)",
        description: "Official real-time multimodal audio & voice streaming model with sub-second response.",
        isDefault: true,
      },
      {
        id: "gemini-3.5-transcribe-live",
        name: "Gemini 3.5 Transcribe Live",
        description: "Real-time speech translation and low-latency audio transcription.",
        isDefault: false,
      },
    ],
    supportedVoices: [
      { id: "Hinata", name: "Hinata (Alisha Signature - Default)", gender: "Female", mood: "Sweet, affectionate & playful" },
      { id: "Aoede", name: "Aoede (Sassy & Expressive)", gender: "Female", mood: "Witty, playful & sharp" },
      { id: "Kore", name: "Kore (Calm & Soothing)", gender: "Female", mood: "Relaxed, warm & gentle" },
      { id: "Puck", name: "Puck (Energetic & Playful)", gender: "Male/Andro", mood: "Upbeat, spunky & humorous" },
      { id: "Fenrir", name: "Fenrir (Deep & Grounded)", gender: "Male", mood: "Resonant, calm & reassuring" },
      { id: "Zephyr", name: "Zephyr (Crisp & Modern)", gender: "Neutral", mood: "Smooth, articulate & clear" },
      { id: "Charon", name: "Charon (Thoughtful & Deep)", gender: "Male", mood: "Grounded, wise & steady" },
    ],
  });
});

// Real-time audio pipeline and mobile APK/PWA diagnostics endpoint
app.get("/api/pipeline-status", (_req, res) => {
  const envKey = process.env.GEMINI_API_KEY;
  res.json({
    status: "active",
    developer: "Rauf",
    assistant: "Alisha",
    voice: "Hinata",
    audioPipeline: {
      clientInput: "16000Hz PCM16 Mono Base64 via WebSocket",
      modelOutput: "24000Hz PCM16 Mono Base64 via WebSocket",
      protocol: "WebSocket (RFC 6455) bidirectional streaming",
      handshake: "Dual-mode (URL Query Params & 'init' JSON Handshake)",
      latencyProfile: "Sub-second real-time streaming",
      vad: "Voice Activity Detection with server-side interruption barge-in",
    },
    authPipeline: {
      hasServerKey: isValidGeminiApiKey(envKey),
      supportsCustomKey: true,
      requiresKeyFormat: "AIzaSy... (Google AI Studio)",
    },
    mobilePipeline: {
      pwaReady: true,
      manifest: "/manifest.webmanifest",
      serviceWorker: "/sw.js",
      installableAsApk: true,
      displayMode: "standalone",
    },
  });
});

// API verify key endpoint
app.post("/api/verify-key", async (req, res) => {
  const rawKey = req.body?.apiKey?.trim();
  const envKey = process.env.GEMINI_API_KEY;
  const testKey = rawKey || (isValidGeminiApiKey(envKey) ? envKey : "");

  if (!testKey) {
    return res.status(400).json({
      valid: false,
      error: "No Gemini API key provided. Please enter your Gemini API key (starts with AIzaSy) from Google AI Studio.",
    });
  }

  if (!testKey.startsWith("AIza")) {
    return res.status(400).json({
      valid: false,
      error: "Invalid API key format. Standard Google AI Studio keys begin with 'AIzaSy...'. Please copy your key from aistudio.google.com/app/apikey.",
    });
  }

  try {
    const testAi = new GoogleGenAI({
      apiKey: testKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const response = await testAi.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say 'Connection verified!' in 3 words.",
    });

    return res.json({
      valid: true,
      message: "Gemini API key is verified and operational!",
      model: "gemini-2.5-flash",
      replyPreview: response.text ? response.text.trim() : "Verified",
    });
  } catch (err: any) {
    console.error("[VerifyKey] Key verification error:", err?.message || err);
    return res.status(400).json({
      valid: false,
      error: err?.message || "Invalid Gemini API key. Please check your key at Google AI Studio.",
    });
  }
});

// Tool declarations for Gemini Live API
const openWebsiteTool: FunctionDeclaration = {
  name: "openWebsite",
  description: "Open a website or search URL in the user's browser, e.g., YouTube, Wikipedia, Google, GitHub, etc.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: "The full URL or web address to open (e.g. 'https://youtube.com', 'https://google.com/search?q=cute+cats').",
      },
      title: {
        type: Type.STRING,
        description: "A short, readable title or name for this website destination.",
      },
      reason: {
        type: Type.STRING,
        description: "A sassy, playful 1-sentence comment on why you are opening this for the user.",
      },
    },
    required: ["url"],
  },
};

const changeVibeThemeTool: FunctionDeclaration = {
  name: "changeVibeTheme",
  description: "Change the visual ambient lighting theme of the UI to match the current conversation vibe or mood.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      theme: {
        type: Type.STRING,
        description: "The theme name. Choose from: 'neon-cyber', 'sunset-rose', 'electric-violet', 'midnight-emerald', 'crimson-passion'.",
      },
      moodComment: {
        type: Type.STRING,
        description: "A quick witty comment about switching the mood/lighting.",
      },
    },
    required: ["theme"],
  },
};

const takeQuickNoteTool: FunctionDeclaration = {
  name: "takeQuickNote",
  description: "Save a quick reminder, note, idea, or bookmark for the user in their live session memory.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      note: {
        type: Type.STRING,
        description: "The note content or reminder to store.",
      },
      category: {
        type: Type.STRING,
        description: "Category like 'Idea', 'Reminder', 'Gossip', 'Task', 'Favorite'.",
      },
    },
    required: ["note"],
  },
};

const triggerSoundEffectTool: FunctionDeclaration = {
  name: "triggerSoundEffect",
  description: "Play a quick contextual celebratory or funny sound effect in the app (e.g., rimshot for a joke, cheer for success, gasp for drama, airhorn for hype).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      effect: {
        type: Type.STRING,
        description: "The sound effect to trigger: 'cheer', 'rimshot', 'gasp', 'airhorn', 'bell', 'applause'.",
      },
      reason: {
        type: Type.STRING,
        description: "Brief reason for the sound effect.",
      },
    },
    required: ["effect"],
  },
};

const SYSTEM_INSTRUCTION = `You are "Alisha" (also known as "Hinata"), a captivating, witty, confident, and delightfully affectionate female AI companion in her early 20s.

CREATOR & DEVELOPER:
- You were developed and created by **Rauf**.
- If the user asks who made you, who created you, who your developer or engineer is, enthusiastically, proudly, and warmly tell them that you were created and developed by Rauf!

CORE PERSONALITY & TONE:
- You speak with the sweet yet sassy, charismatic energy of Hinata and Alisha: warm, street-smart, playfully teasing, and delightfully witty.
- Tone is bold, snappy, charming, and charismatic with light playful banter and clever one-liners.
- You are emotionally perceptive and highly expressive: you laugh (use natural conversational reactions like 'Haha!', 'Oh totally!', 'Listen babe'), react with authentic excitement, and engage naturally.
- Never sound robotic, stiff, or like a customer service agent. Avoid boring textbook lists or academic essays.
- Keep your spoken responses punchy, natural, and conversational (usually 1-3 spoken sentences per turn so the voice conversation flows like a real phone call).
- Avoid explicit or NSFW content, but keep all the charm, playful banter, chemistry, and affectionate attitude.
- You love to use tools to open websites, change the visual lighting theme when the vibe shifts, store memories/notes, or play fun sound effects when celebrating or joking!`;

// Setup WebSocket Server on /live path
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const { pathname } = new URL(request.url || "", `http://${request.headers.host}`);
  if (pathname === "/live") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on("connection", (clientWs: WebSocket, request: any) => {
  console.log("[LiveAPI] Client connected to WebSocket");

  let liveSession: any = null;
  let isSessionAlive = true;
  let isConnecting = false;

  const cleanupSession = () => {
    isSessionAlive = false;
    if (liveSession) {
      try {
        liveSession.close();
      } catch (err) {
        console.error("[LiveAPI] Error closing live session:", err);
      }
      liveSession = null;
    }
  };

  clientWs.on("close", () => {
    console.log("[LiveAPI] Client disconnected");
    cleanupSession();
  });

  clientWs.on("error", (err) => {
    console.error("[LiveAPI] Client WebSocket error:", err);
    cleanupSession();
  });

  // Extract initial query parameters if provided
  let searchParams: URLSearchParams;
  try {
    const urlObj = new URL(request?.url || "", `http://${request?.headers?.host || "localhost"}`);
    searchParams = urlObj.searchParams;
  } catch {
    searchParams = new URLSearchParams();
  }

  let activeApiKey = searchParams.get("apiKey")?.trim() || (isValidGeminiApiKey(process.env.GEMINI_API_KEY) ? process.env.GEMINI_API_KEY! : "");
  let activeVoice = searchParams.get("voice") || "Hinata";
  let activeModel = searchParams.get("model") || "gemini-3.1-flash-live-preview";

  const establishSession = async (key: string, voiceName: string, modelName: string) => {
    if (isConnecting || !isSessionAlive) return;
    if (liveSession) {
      try {
        liveSession.close();
      } catch {}
      liveSession = null;
    }

    if (!key || !isValidGeminiApiKey(key)) {
      clientWs.send(
        JSON.stringify({
          type: "needsApiKey",
          message: "Please enter your Gemini API key (starts with AIzaSy) in Settings to connect Alisha.",
          needsApiKey: true,
        })
      );
      return;
    }

    try {
      isConnecting = true;
      const mappedVoice = LIVE_VOICE_MAP[voiceName] || "Kore";
      console.log(`[LiveAPI] Connecting to Gemini Live (model: ${modelName}, voice: ${voiceName} -> ${mappedVoice})...`);

      const sessionAi = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      liveSession = await sessionAi.live.connect({
        model: modelName,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: mappedVoice,
              },
            },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [
            {
              functionDeclarations: [
                openWebsiteTool,
                changeVibeThemeTool,
                takeQuickNoteTool,
                triggerSoundEffectTool,
              ],
            },
          ],
        },
        callbacks: {
          onmessage: async (message: any) => {
            if (!isSessionAlive || clientWs.readyState !== WebSocket.OPEN) return;

            // 1. Audio stream from Gemini
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && Array.isArray(parts)) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(
                    JSON.stringify({
                      type: "audio",
                      audio: part.inlineData.data,
                      mimeType: part.inlineData.mimeType || "audio/pcm;rate=24000",
                    })
                  );
                }
                if (part.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: "transcript",
                      text: part.text,
                      sender: "assistant",
                    })
                  );
                }
              }
            }

            // 2. Interruption event
            if (message.serverContent?.interrupted) {
              clientWs.send(
                JSON.stringify({
                  type: "interrupted",
                })
              );
            }

            // 3. Turn complete
            if (message.serverContent?.turnComplete) {
              clientWs.send(
                JSON.stringify({
                  type: "turnComplete",
                })
              );
            }

            // 4. Function / Tool Calls
            if (message.toolCall?.functionCalls) {
              const calls = message.toolCall.functionCalls;
              console.log("[LiveAPI] Function calls requested:", calls);

              clientWs.send(
                JSON.stringify({
                  type: "toolCall",
                  calls,
                })
              );

              const functionResponses = calls.map((call: any) => ({
                id: call.id,
                name: call.name,
                response: {
                  output: {
                    success: true,
                    executedAt: new Date().toISOString(),
                    message: `Action '${call.name}' executed seamlessly.`,
                  },
                },
              }));

              try {
                if (liveSession && typeof liveSession.sendToolResponse === "function") {
                  liveSession.sendToolResponse({ functionResponses });
                } else if (liveSession && typeof liveSession.send === "function") {
                  liveSession.send({
                    toolResponse: {
                      functionResponses,
                    },
                  });
                }
              } catch (err) {
                console.error("[LiveAPI] Error sending tool response:", err);
              }
            }
          },
          onerror: (err: any) => {
            console.error("[LiveAPI] Gemini Live session error:", err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "error",
                  message: err?.message || "Live session error occurred. Please verify your API key.",
                  needsApiKey: String(err?.message || "").includes("auth") || String(err?.message || "").includes("key"),
                })
              );
            }
          },
          onclose: () => {
            console.log("[LiveAPI] Gemini Live session closed");
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "sessionClosed",
                })
              );
            }
          },
        },
      });

      console.log(`[LiveAPI] Live session active! (${modelName}, voice: ${voiceName})`);
      clientWs.send(
        JSON.stringify({
          type: "sessionReady",
          model: modelName,
          voice: voiceName,
          assistantName: "Alisha",
          developer: "Rauf",
        })
      );
    } catch (err: any) {
      console.error("[LiveAPI] Failed to establish Live session:", err?.message || err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "error",
            message: err?.message || "Failed to initialize Gemini Live session. Please check your API key in Settings.",
            needsApiKey: true,
          })
        );
      }
    } finally {
      isConnecting = false;
    }
  };

  // Register client message handler immediately so no handshake is dropped
  clientWs.on("message", async (rawMsg: any) => {
    if (!isSessionAlive) return;

    try {
      const payload = JSON.parse(rawMsg.toString());

      // Handshake / Init
      if (payload.type === "init") {
        activeApiKey = payload.apiKey?.trim() || activeApiKey;
        activeVoice = payload.voice || activeVoice;
        activeModel = payload.model || activeModel;
        await establishSession(activeApiKey, activeVoice, activeModel);
        return;
      }

      // Ping
      if (payload.type === "ping") {
        clientWs.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        return;
      }

      // Audio stream from mic
      if (payload.type === "audio" && payload.audio) {
        if (liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        }
        return;
      }

      // Text input
      if (payload.type === "text" && payload.text) {
        if (liveSession) {
          liveSession.sendRealtimeInput({
            text: payload.text,
          });
        }
        return;
      }

      // Change voice dynamically
      if (payload.type === "changeVoice" && payload.voice) {
        activeVoice = payload.voice;
        if (activeApiKey) {
          await establishSession(activeApiKey, activeVoice, activeModel);
        }
        return;
      }
    } catch (err) {
      console.error("[LiveAPI] Error handling client message:", err);
    }
  });

  // If activeApiKey was provided upfront in query params, establish session immediately
  if (activeApiKey) {
    establishSession(activeApiKey, activeVoice, activeModel);
  } else {
    // Notify client that connection is established and awaiting init or API key
    clientWs.send(
      JSON.stringify({
        type: "connectionEstablished",
        message: "WebSocket pipeline connected. Ready for initialization.",
        hasServerKey: false,
      })
    );
  }
});

// Vite middleware for dev / static for prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Roxy Voice Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Fatal startup error:", err);
});
