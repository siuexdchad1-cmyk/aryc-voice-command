/** Records microphone audio as a complete 16 kHz mono WAV file (safe on every browser). */
export interface Recorder {
  stop: () => Promise<Blob>;
  cancel: () => void;
}

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  source.connect(node);
  node.connect(ctx.destination);

  const teardown = () => {
    stream.getTracks().forEach((t) => t.stop());
    node.disconnect();
    source.disconnect();
  };

  return {
    cancel: () => {
      teardown();
      void ctx.close();
    },
    stop: async () => {
      teardown();
      const rate = ctx.sampleRate;
      await ctx.close();
      return encodeWav(chunks, rate);
    },
  };
}

function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }

  const target = 16000;
  const ratio = sampleRate / target;
  const outLength = Math.floor(merged.length / ratio);
  const samples = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const s = Math.max(-1, Math.min(1, merged[Math.floor(i * ratio)] ?? 0));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (pos: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(pos + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, target, true);
  view.setUint32(28, target * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  new Int16Array(buffer, 44).set(samples);
  return new Blob([buffer], { type: "audio/wav" });
}

export async function transcribe(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", blob, "recording.wav");
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  const json = (await res.json()) as { text?: string; error?: string };
  if (!res.ok) throw new Error(json.error || "Transcription failed");
  return (json.text ?? "").trim();
}
