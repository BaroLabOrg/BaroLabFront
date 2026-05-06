import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuest } from '../context/QuestContext';
import styles from './PromisePage.module.css';

/* ----------------------------------------------------------------
   Web Audio — vinyl crackle + slow piano notes + deep ambient
   ---------------------------------------------------------------- */
function useAmbientAudio() {
    const ctxRef = useRef(null);
    const nodesRef = useRef([]);
    // Separate gain node for the deep ambient layer (started in phase 2)
    const ambientGainRef = useRef(null);

    const start = () => {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            const ctx = new AC();
            ctxRef.current = ctx;
            const nodes = [];

            // Vinyl crackle
            const bufSize = ctx.sampleRate * 2;
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.012;
            const crackle = ctx.createBufferSource();
            crackle.buffer = buf; crackle.loop = true;
            const cf = ctx.createBiquadFilter();
            cf.type = 'bandpass'; cf.frequency.value = 2800; cf.Q.value = 0.4;
            const cg = ctx.createGain(); cg.gain.value = 0.13;
            crackle.connect(cf); cf.connect(cg); cg.connect(ctx.destination);
            crackle.start(); nodes.push(crackle);

            // Sub rumble (terminal phase)
            const rumble = ctx.createOscillator();
            const rg = ctx.createGain();
            rumble.type = 'sine'; rumble.frequency.value = 38; rg.gain.value = 0;
            rumble.connect(rg); rg.connect(ctx.destination); rumble.start();
            rg.gain.linearRampToValueAtTime(0.028, ctx.currentTime + 4);
            nodes.push(rumble);

            // Piano notes — Chopin Raindrop feel
            [220, 165, 110, 277, 220, 165, 294, 220].forEach((freq, i) => {
                const t = ctx.currentTime + 6 + i * 4.8;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const filt = ctx.createBiquadFilter();
                osc.type = 'sine'; osc.frequency.value = freq;
                filt.type = 'lowpass'; filt.frequency.value = 700;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.06, t + 0.025);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 3.8);
                osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
                osc.start(t); osc.stop(t + 4.2); nodes.push(osc);
            });

            // ---- Deep ambient layer (starts silent, faded in during phase 2) ----
            // Two detuned sine oscillators + filtered noise = underwater pressure feel
            const ambGain = ctx.createGain();
            ambGain.gain.value = 0; // starts silent
            ambientGainRef.current = ambGain;

            [28, 31.5].forEach((freq) => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                osc.connect(ambGain);
                osc.start();
                nodes.push(osc);
            });

            // Filtered noise for "radio static / pressure" texture
            const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
            const nd = noiseBuf.getChannelData(0);
            for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.3;
            const noiseSrc = ctx.createBufferSource();
            noiseSrc.buffer = noiseBuf; noiseSrc.loop = true;
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass'; noiseFilter.frequency.value = 180;
            noiseSrc.connect(noiseFilter); noiseFilter.connect(ambGain);
            noiseSrc.start(); nodes.push(noiseSrc);

            ambGain.connect(ctx.destination);
            nodesRef.current = nodes;
        } catch { /* silent */ }
    };

    // Call this when phase transitions to 2 — fades ambient in over 3s
    const startAmbient = () => {
        try {
            const ctx = ctxRef.current;
            const ag = ambientGainRef.current;
            if (!ctx || !ag) return;
            ag.gain.cancelScheduledValues(ctx.currentTime);
            ag.gain.setValueAtTime(0, ctx.currentTime);
            ag.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 3);
        } catch { /* silent */ }
    };

    const stop = () => {
        try {
            nodesRef.current.forEach((n) => { try { n.stop(); } catch {} });
            nodesRef.current = [];
            ambientGainRef.current = null;
            if (ctxRef.current) { ctxRef.current.close(); ctxRef.current = null; }
        } catch {}
    };

    return { start, startAmbient, stop };
}

/* ----------------------------------------------------------------
   LSTR BIOS log lines
   cls: 'ok' | 'warn' | 'fault' | 'fatal'
   ---------------------------------------------------------------- */
const LOG_LINES = [
    { text: '> AEON BIOS v1.2.4 .......................... [ OK ]',       delay: 300,  cls: 'ok'    },
    { text: '> LSTR-512 INITIALIZATION ................... [ OK ]',       delay: 1100, cls: 'ok'    },
    { text: '> MOTOR CORTEX CALIBRATION .................. [ OK ]',       delay: 1900, cls: 'ok'    },
    { text: '> GESTALT MEMORY SUPPRESSION ................ [ OK ]',       delay: 2700, cls: 'ok'    },
    { text: '> SYNCHRONICITY LINK ........................ [ DEGRADED ]',  delay: 3500, cls: 'fault' },
    { text: '> WARNING: UNKNOWN SIGNAL DETECTED',                         delay: 4400, cls: 'warn'  },
    { text: '> BIORESONANCE LEVEL: CRITICAL',                             delay: 5100, cls: 'fault' },
    { text: '> FATAL ERROR AT 0x00A4F92...',                              delay: 5900, cls: 'fatal' },
];

/*
   Phases:
   0 — log printing
   1 — text glitch (skew + chromatic aberration, ~1s)
   2 — final screen (REMEMBER OUR PROMISE + lore + button)
*/
export default function PromisePage() {
    const navigate = useNavigate();
    const { resetQuest } = useQuest();
    const audio = useAmbientAudio();

    const [visibleLines, setVisibleLines] = useState([]);
    const [showCursor, setShowCursor] = useState(true);
    const [phase, setPhase] = useState(0);
    const [hoverWake, setHoverWake] = useState(false);

    useEffect(() => {
        audio.start();

        // Schedule each log line
        const timers = LOG_LINES.map(({ text, delay, cls }) =>
            setTimeout(() => setVisibleLines(prev => [...prev, { text, cls }]), delay)
        );

        // Hide cursor when last line appears
        const hideCursorTimer = setTimeout(() => setShowCursor(false), 6600);

        // Start glitch phase after fatal error line
        const glitchTimer = setTimeout(() => setPhase(1), 6700);

        // Transition to final calm screen + start deep ambient fade-in
        const finalTimer = setTimeout(() => {
            setPhase(2);
            audio.startAmbient();
        }, 8000);

        return () => {
            [...timers, hideCursorTimer, glitchTimer, finalTimer].forEach(clearTimeout);
            audio.stop();
        };
    }, []);

    const handleWake = useCallback(() => {
        audio.stop();
        resetQuest();
        navigate('/');
    }, [audio, resetQuest, navigate]);

    return (
        <div className={styles.page}>
            {/* CRT overlays — always visible */}
            <div className={styles.scanlines} aria-hidden="true" />
            <div className={styles.vignette} aria-hidden="true" />

            {/* ---- Phases 0 & 1: Boot log ---- */}
            {phase < 2 && (
                <div
                    className={`${styles.logSection} ${phase === 1 ? styles.logGlitch : ''}`}
                    aria-live="polite"
                >
                    {visibleLines.map((line, i) => {
                        const isLast = i === visibleLines.length - 1;
                        // In glitch phase replace last (fatal) line with error message
                        const text = (phase === 1 && isLast)
                            ? '[ SYSTEM FATAL ERROR — SYNCHRONICITY LOST ]'
                            : line.text;
                        const cls = (phase === 1 && isLast) ? 'fatal' : line.cls;
                        return (
                            <span
                                key={i}
                                className={`${styles.logLine} ${cls ? styles[cls] : ''}`}
                                style={{ animationDelay: '0ms' }}
                            >
                                {text}
                            </span>
                        );
                    })}
                    {showCursor && phase === 0 && (
                        <span className={styles.cursor} aria-hidden="true" />
                    )}
                </div>
            )}

            {/* ---- Phase 2: Final lore screen ---- */}
            {phase === 2 && (
                <div className={styles.finalSection}>
                    <div className={styles.promiseText}>
                        R E M E M B E R &nbsp; O U R &nbsp; P R O M I S E
                    </div>

                    <p className={styles.loreText}>
                        Синхронизация завершена. Космическая пустота<br />
                        сменилась сокрушительным давлением глубин.<br />
                        Мы падали так долго...
                    </p>

                    <p className={styles.quoteText}>
                        «Великие бездны тайно вырыты там, где хватило бы<br />
                        и земных пор, и существа научились ходить,<br />
                        хотя должны были только ползать.»
                    </p>

                    <button
                        className={styles.wakeBtn}
                        onClick={handleWake}
                        onMouseEnter={() => setHoverWake(true)}
                        onMouseLeave={() => setHoverWake(false)}
                        aria-label="Wake up and return to main page"
                    >
                        {hoverWake ? '[ ERWACHE ]' : '[ WAKE UP ]'}
                    </button>
                </div>
            )}
        </div>
    );
}
