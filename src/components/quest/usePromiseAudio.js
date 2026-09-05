import { useCallback, useEffect, useRef, useState } from 'react';

// Synthesized ambience, started only by an explicit user gesture.
export default function usePromiseAudio() {
    const context = useRef(null);
    const busy = useRef(false);
    const [enabled, setEnabled] = useState(false);
    const [available, setAvailable] = useState(true);

    const toggle = useCallback(async () => {
        if (busy.current) return;
        busy.current = true;
        try {
            if (!context.current) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) { setAvailable(false); return; }
                const ctx = new AudioContext();
                context.current = ctx;
                const master = ctx.createGain();
                master.gain.value = 0.12;
                master.connect(ctx.destination);
                [38, 38.4, 76].forEach((frequency, index) => {
                    const oscillator = ctx.createOscillator();
                    const gain = ctx.createGain();
                    oscillator.frequency.value = frequency;
                    gain.gain.value = index === 2 ? 0.04 : 0.14;
                    oscillator.connect(gain).connect(master);
                    oscillator.start();
                });
                const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.12;
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                noise.loop = true;
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 380;
                noise.connect(filter).connect(master);
                noise.start();
                await ctx.resume();
                if (context.current === ctx) setEnabled(true);
            } else {
                const ctx = context.current;
                const shouldEnable = ctx.state !== 'running';
                await (shouldEnable ? ctx.resume() : ctx.suspend());
                if (context.current === ctx) setEnabled(shouldEnable);
            }
        } catch { setEnabled(false); setAvailable(false); }
        finally { busy.current = false; }
    }, []);

    useEffect(() => () => {
        const ctx = context.current;
        context.current = null;
        if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {});
    }, []);

    return { enabled, available, toggle };
}
