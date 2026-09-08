/**
 * AudioRecorder - Captures microphone audio, encodes into 16kHz PCM16,
 * and streams chunks to the server for Gemini Live API input.
 */
export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isRecording = false;
  private onAudioChunk?: (base64Chunk: string) => void;

  constructor(onAudioChunk?: (base64Chunk: string) => void) {
    this.onAudioChunk = onAudioChunk;
  }

  public async start(): Promise<void> {
    if (this.isRecording) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      // Target 16kHz context for direct Live API compatibility
      this.audioCtx = new AudioCtxClass({ sampleRate: 16000 });
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.6;
      this.sourceNode.connect(this.analyser);

      // Buffer size of 2048 gives ~128ms low latency chunks at 16kHz
      this.processorNode = this.audioCtx.createScriptProcessor(2048, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const base64Pcm = this.convertFloat32ToPCM16Base64(inputData);
        if (base64Pcm && this.onAudioChunk) {
          this.onAudioChunk(base64Pcm);
        }
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioCtx.destination);
      this.isRecording = true;
    } catch (err) {
      console.error('[AudioRecorder] Failed to start audio recording:', err);
      this.stop();
      throw err;
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public stop(): void {
    this.isRecording = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }

  /**
   * Converts Float32 [-1.0, 1.0] to 16-bit signed PCM little-endian Base64
   */
  private convertFloat32ToPCM16Base64(inputData: Float32Array): string {
    const l = inputData.length;
    const buffer = new ArrayBuffer(l * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < l; i++) {
      let s = Math.max(-1, Math.min(1, inputData[i]));
      // Convert to 16-bit signed integer [-32768, 32767]
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
