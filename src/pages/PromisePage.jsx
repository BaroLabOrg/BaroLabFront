import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuest } from '../context/QuestContext';
import styles from './PromisePage.module.css';

/* ----------------------------------------------------------------
   Web Audio — vinyl crackle + slow piano notes
   ---------------------------------------------------------------- */
function useAmbientAudio() {
    const ctxRef = useRef(null);
    const nodesRef = useRef([]);

    const start = () => {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            const ctx = new AC();
            ctxRef.current = ctx;
            const nodes = [];

            const bufSize = ctx.sampleRate * 2;
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.012;
            const crackle = ctx.createBufferSource();
            crackle.buffer = buf; crackle.loop = true;
            const cf = ctx.createBiquadFilter();
            cf.type = 'bandpass'; cf.frequency.value = 2800; cf.Q.value = 0.4;
            const cg = ctx.createGain(); cg.gain.value = 0.14;
            crackle.connect(cf); cf.connect(cg); cg.connect(ctx.destination);
            crackle.start(); nodes.push(crackle);

            const rumble = ctx.createOscillator();
            const rg = ctx.createGain();
            rumble.type = 'sine'; rumble.frequency.value = 38; rg.gain.value = 0;
            rumble.connect(rg); rg.connect(ctx.destination); rumble.start();
            rg.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 4);
            nodes.push(rumble);

            [220, 165, 110, 277, 220, 165, 294, 220].forEach((freq, i) => {
                const t = ctx.currentTime + 5 + i * 4.8;
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

            nodesRef.current = nodes;
        } catch { /* silent */ }
    };

    const stop = () => {
        try {
            nodesRef.current.forEach((n) => { try { n.stop(); } catch {} });
            nodesRef.current = [];
            if (ctxRef.current) { ctxRef.current.close(); ctxRef.current = null; }
        } catch {}
    };

    return { start, stop };
}

/* ----------------------------------------------------------------
   Boot log lines — text + delay (ms) + optional class
   ---------------------------------------------------------------- */
const LOG_LINES = [
    { text: '> INITIALIZING PENROSE OS v1.2...',         delay: 200,  cls: '' },
    { text: '> SYSTEM DIAGNOSTICS: RUNNING...',          delay: 900,  cls: '' },
    { text: '> LIFE SUPPORT: [CRITICAL FAILURE]',        delay: 1700, cls: 'critical' },
    { text: '> OXYGEN LEVELS: 0.00%',                    delay: 2500, cls: 'critical' },
    { text: '> GESTALT UNIT: DECEASED.',                 delay: 3200, cls: 'error' },
    { text: '> REPLIKA UNIT (LSTR): SIGNAL DEGRADED.',   delay: 4000, cls: 'error' },
    { text: '> CYCLE: 3000... 4000... 5423... ERROR.',   delay: 4900, cls: 'error' },
];

// Chaos blocks that appear during glitch phase
const CHAOS_ITEMS = [
    { text: 'ACHTUNG',              top: '18%', left: '12%' },
    { text: 'SYNCHRONICITY FAILED', top: '28%', left: '55%' },
    { text: 'FEHLER',               top: '42%', left: '8%'  },
    { text: 'ACHTUNG',              top: '55%', left: '70%' },
    { text: 'FEHLER',               top: '65%', left: '30%' },
    { text: 'SYNCHRONICITY FAILED', top: '72%', left: '15%' },
    { text: 'ACHTUNG',              top: '35%', left: '80%' },
    { text: 'FEHLER',               top: '80%', left: '60%' },
];

/* ----------------------------------------------------------------
   Sequence phases:
   0 — boot log printing
   1 — glitch chaos (red flashes + chaos blocks + glitching promise)
   2 — calm (black screen, white REMEMBER OUR PROMISE + button)
   ---------------------------------------------------------------- */
export default function PromisePage() {
    const navigate = useNavigate();
    const { resetQuest } = useQuest();
    const audio = useAmbientAudio();

    const [visibleLines, setVisibleLines] = useState([]);
    const [showCursor, setShowCursor] = useState(true);
    const [phase, setPhase] = useState(0); // 0=log, 1=glitch, 2=calm
    const [hoverWake, setHoverWake] = useState(false);

    // Schedule log lines
    useEffect(() => {
        audio.start();

        const timers = LOG_LINES.map(({ text, delay, cls }) =>
            setTimeout(() => {
                setVisibleLines(prev => [...prev, { text, cls }]);
            }, delay)
        );

        // After last line → start glitch phase
        const glitchTimer = setTimeout(() => {
            setShowCursor(false);
            setPhase(1);
        }, 5800);

        // After glitch → calm phase
        const calmTimer = setTimeout(() => {
            setPhase(2);
        }, 11500);

        return () => {
            [...timers, glitchTimer, calmTimer].forEach(clearTimeout);
            audio.stop();
        };
    }, []);

    const handleWake = useCallback(() => {
        audio.stop();
        resetQuest();
        navigate('/');
    }, [audio, resetQuest, navigate]);

    return (
        <div className={`${styles.page} ${phase === 1 ? styles.glitching : ''}`}>

            {/* CRT overlays */}
            <div className={styles.scanlines} aria-hidden="true" />
            <div className={styles.vignette} aria-hidden="true" />
            <div className={styles.redFlash} aria-hidden="true" />

            {/* ---- Phase 0 & 1: Boot log ---- */}
            {phase < 2 && (
                <div className={styles.logSection} aria-live="polite">
                    {visibleLines.map((line, i) => (
                        <span
                            key={i}
                            className={`${styles.logLine} ${line.cls ? styles[line.cls] : ''}`}
                            style={{ animationDelay: '0ms' }}
                        >
                            {line.text}
                        </span>
                    ))}
                    {showCursor && <span className={styles.cursor} aria-hidden="true" />}
                </div>
            )}

            {/* ---- Phase 1: Chaos blocks ---- */}
            {phase === 1 && CHAOS_ITEMS.map((item, i) => (
                <div
                    key={i}
                    className={styles.chaosBlock}
                    style={{
                        top: item.top,
                        left: item.left,
                        animationDelay: `${i * 180}ms`,
                    }}
                    aria-hidden="true"
                >
                    {item.text}
                </div>
            ))}

            {/* ---- Phase 1 & 2: Central REMEMBER OUR PROMISE ---- */}
            {phase >= 1 && (
                <div className={styles.centerSection}>
                    <div
                        className={`${styles.promiseGlitch} ${phase === 1 ? styles.glitching : styles.calm}`}
                        aria-live="polite"
                    >
                        REMEMBER OUR PROMISE
                    </div>

                    {/* Button only in calm phase */}
                    {phase === 2 && (
                        <button
                            className={styles.wakeBtn}
                            style={{ animationDelay: '800ms' }}
                            onClick={handleWake}
                            onMouseEnter={() => setHoverWake(true)}
                            onMouseLeave={() => setHoverWake(false)}
                            aria-label="Wake up and return to main page"
                        >
                            {hoverWake ? '[ WAKE UP ]' : '[ ERWACHE ]'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
