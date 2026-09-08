/**
 * AudioStreamer - Manages 24kHz raw PCM playback from Gemini Live API
 * Handles jitter buffer, gapless scheduled playback, interruption flushing,
 * and exposes real-time AnalyserNode data for visualizers.
 */
export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime = 0;
  private scheduledSources: AudioBufferSourceNode[] = [];
  private isPlaying = false;
  private onPlaybackStateChange?: (isPlaying: boolean) => void;
  private checkInterval: any = null;

  constructor(onPlaybackStateChange?: (isPlaying: boolean) => void) {
    this.onPlaybackStateChange = onPlaybackStateChange;
  }

  public async init(): Promise<void> {
    if (!this.audioCtx) {
      // Gemini Live output sample rate is 24kHz
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 24000 });
      
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1.0;

      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.startStateMonitor();
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  /**
   * Enqueue and schedule base64-encoded PCM16 audio (24kHz)
   */
  public addAudioChunk(base64Data: string): void {
    if (!this.audioCtx || !this.gainNode) {
      this.init().then(() => this.addAudioChunk(base64Data));
      return;
    }

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit little-endian PCM bytes to Float32 [-1.0, 1.0]
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      if (float32Array.length === 0) return;

      const audioBuffer = this.audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const currentTime = this.audioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.03; // small lead cushion for jitter
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.scheduledSources.push(source);

      source.onended = () => {
        const idx = this.scheduledSources.indexOf(source);
        if (idx > -1) {
          this.scheduledSources.splice(idx, 1);
        }
      };

      this.updatePlayingState(true);
    } catch (err) {
      console.error('[AudioStreamer] Error processing audio chunk:', err);
    }
  }

  /**
   * Instantly stops playback and clears all queued chunks on interruption
   */
  public handleInterruption(): void {
    for (const src of this.scheduledSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // Source may already be stopped
      }
    }
    this.scheduledSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }
    this.updatePlayingState(false);
  }

  public stop(): void {
    this.handleInterruption();
    this.stopStateMonitor();
  }

  public close(): void {
    this.stop();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }

  private startStateMonitor(): void {
    if (this.checkInterval) return;
    this.checkInterval = setInterval(() => {
      if (!this.audioCtx) return;
      const isStillPlaying =
        this.scheduledSources.length > 0 && this.audioCtx.currentTime < this.nextStartTime;
      this.updatePlayingState(isStillPlaying);
    }, 100);
  }

  private stopStateMonitor(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private updatePlayingState(playing: boolean): void {
    if (this.isPlaying !== playing) {
      this.isPlaying = playing;
      this.onPlaybackStateChange?.(playing);
    }
  }
}
