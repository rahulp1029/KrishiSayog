// Web Audio API Synthesizer Chime for Emergency Alerts
// Safe audio generation that respects browser user interaction requirements

let audioCtx: AudioContext | null = null;
let isUnlocked = false;

// Unlock audio context on first user click or interaction
export function initAudioSystem(): void {
    if (typeof window === "undefined") return;
    
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }

    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().then(() => {
            isUnlocked = true;
        }).catch(err => {
            console.warn("Audio unlock failed:", err);
        });
    } else if (audioCtx && audioCtx.state === "running") {
        isUnlocked = true;
    }
}

// Attach user gesture listener once to unlock Web Audio
if (typeof window !== "undefined") {
    const unlock = () => {
        initAudioSystem();
        window.removeEventListener("click", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock);
}

export function playEmergencyAlertSound(severity: "CRITICAL" | "SEVERE" | string): void {
    if (!audioCtx) initAudioSystem();
    if (!audioCtx) return;

    try {
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (severity === "CRITICAL") {
            // Urgent 2-tone alarm: 880Hz -> 440Hz -> 880Hz
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(440, now + 0.2);
            osc.frequency.setValueAtTime(880, now + 0.4);
            osc.frequency.setValueAtTime(440, now + 0.6);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

            osc.start(now);
            osc.stop(now + 0.8);
        } else if (severity === "SEVERE") {
            // Dual warning beep: 660Hz -> 550Hz
            osc.type = "sine";
            osc.frequency.setValueAtTime(660, now);
            osc.frequency.setValueAtTime(550, now + 0.25);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

            osc.start(now);
            osc.stop(now + 0.5);
        }
    } catch (err) {
        console.warn("Audio playback error:", err);
    }
}
