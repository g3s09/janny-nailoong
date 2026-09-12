let context: AudioContext | undefined;
let ambience: { nodes: OscillatorNode[]; gain: GainNode } | undefined;
function audioContext() {
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}
export function playSound(kind: "tap" | "letter" | "food" | "unlock" = "tap") {
  try {
    const ctx = audioContext();
    const notes =
      kind === "letter"
        ? [523, 659, 784]
        : kind === "unlock"
          ? [392, 523, 659, 784]
          : kind === "food"
            ? [280, 380]
            : [420];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const at = ctx.currentTime + i * 0.12;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.035, at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.24);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.26);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  } catch {
    /* Audio is an optional enhancement. */
  }
}
export function setAmbience(enabled: boolean) {
  if (ambience) {
    const old = ambience;
    old.nodes.forEach((n) => {
      n.stop();
      n.disconnect();
    });
    old.gain.disconnect();
    ambience = undefined;
  }
  if (!enabled) return;
  try {
    const ctx = audioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.008;
    gain.connect(ctx.destination);
    const nodes = [130.81, 196, 261.63].map((f) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.connect(gain);
      osc.start();
      return osc;
    });
    ambience = { nodes, gain };
  } catch {
    /* Optional sound. */
  }
}
