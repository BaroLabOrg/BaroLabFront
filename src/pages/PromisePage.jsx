import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuest } from '../context/QuestContext';
import styles from './PromisePage.module.css';

/* ----------------------------------------------------------------
   Web Audio — vinyl crackle + slow piano notes (Chopin-inspired)
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

            // --- Vinyl crackle: filtered white noise ---
            const bufSize = ctx.sampleRate * 2;
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.015;
            const crackle = ctx.createBufferSource();
            crackle.buffer = buf;
            crackle.loop = true;
            const crackleFilter = ctx.createBiquadFilter();
            crackleFilter.type = 'bandpass';
            crackleFilter.frequency.value = 3000;
            crackleFilter.Q.value = 0.3;
            const crackleGain = ctx.createGain();
            crackleGain.gain.value = 0.18;
            crackle.connect(crackleFilter);
            crackleFilter.connect(crackleGain);
            crackleGain.connect(ctx.destination);
            crackle.start();
            nodes.push(crackle);

            // --- Deep sub rumble ---
            const rumble = ctx.createOscillator();
            const rumbleGain = ctx.createGain();
            rumble.type = 'sine';
            rumble.frequency.value = 40;
            rumbleGain.gain.value = 0;
            rumble.connect(rumbleGain);
            rumbleGain.connect(ctx.destination);
            rumble.start();
            rumbleGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 4);
            nodes.push(rumble);

            // --- Piano notes: Chopin Raindrop Prelude feel ---
            // Notes: A3(220), E3(165), A2(110), C#4(277), D4(294)
            const pianoNotes = [220, 165, 110, 277, 220, 165, 294, 220];
            const noteSpacing = 4.5; // seconds between notes

            pianoNotes.forEach((freq, i) => {
                const t = ctx.currentTime + 3 + i * noteSpacing;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();

                osc.type = 'sine';
                osc.frequency.value = freq;
                filter.type = 'lowpass';
                filter.frequency.value = 800;

                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.07, t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 3.5);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 4);
                nodes.push(osc);
            });

            nodesRef.current = nodes;
        } catch { /* silent fail */ }
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
   Typewriter hook
   ---------------------------------------------------------------- */
function useTypewriter(text, speed = 60, delay = 1500) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    useEffect(() => {
        setDisplayed('');
        setDone(false);
        const startTimer = setTimeout(() => {
            let i = 0;
            const id = setInterval(() => {
                i++;
                setDisplayed(text.slice(0, i));
                if (i >= text.length) { clearInterval(id); setDone(true); }
            }, speed);
            return () => clearInterval(id);
        }, delay);
        return () => clearTimeout(startTimer);
    }, [text, speed, delay]);
    return { displayed, done };
}

/* ----------------------------------------------------------------
   Particles
   ---------------------------------------------------------------- */
const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 14}s`,
    duration: `${9 + Math.random() * 10}s`,
    size: `${1 + Math.random() * 1.5}px`,
}));

/* ----------------------------------------------------------------
   Red Gate / Hexagon SVG
   ---------------------------------------------------------------- */
function RedGateSvg({ hexClass, innerClass, pulseClass }) {
    // Hexagon points helper
    const hex = (cx, cy, r, offset = 0) => {
        return Array.from({ length: 6 }, (_, i) => {
            const a = (Math.PI / 3) * i + offset;
            return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }).join(' ');
    };

    return (
        <svg className={hexClass} viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
            {/* Outer rotating ring */}
            <polygon points={hex(90, 90, 82)} fill="none" stroke="rgba(255,0,0,0.15)" strokeWidth="0.5"/>

            {/* Mid ring — counter-rotates via CSS on group */}
            <g className={innerClass}>
                <polygon points={hex(90, 90, 68)} fill="none" stroke="rgba(255,0,0,0.3)" strokeWidth="0.8"/>
                <polygon points={hex(90, 90, 68, Math.PI / 6)} fill="none" stroke="rgba(255,0,0,0.12)" strokeWidth="0.4"/>
            </g>

            {/* Inner gate — pulses */}
            <g className={pulseClass}>
                <polygon points={hex(90, 90, 50)} fill="rgba(255,0,0,0.04)" stroke="#ff0000" strokeWidth="1.2"/>
                <polygon points={hex(90, 90, 50, Math.PI / 6)} fill="none" stroke="rgba(255,0,0,0.25)" strokeWidth="0.6"/>
                {/* Core */}
                <polygon points={hex(90, 90, 28)} fill="rgba(255,0,0,0.06)" stroke="#ff0000" strokeWidth="1"/>
                <polygon points={hex(90, 90, 14)} fill="rgba(255,0,0,0.12)" stroke="rgba(255,0,0,0.6)" strokeWidth="0.8"/>
                {/* Center dot */}
                <circle cx="90" cy="90" r="4" fill="#ff0000" opacity="0.8"/>
                <circle cx="90" cy="90" r="2" fill="#fff" opacity="0.4"/>
            </g>

            {/* Decorative spokes */}
            {[0, 60, 120, 180, 240, 300].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                return (
                    <line key={deg}
                        x1={90 + 28 * Math.cos(rad)} y1={90 + 28 * Math.sin(rad)}
                        x2={90 + 50 * Math.cos(rad)} y2={90 + 50 * Math.sin(rad)}
                        stroke="rgba(255,0,0,0.2)" strokeWidth="0.5"/>
                );
            })}

            {/* Circuit traces */}
            <line x1="90" y1="8" x2="90" y2="22" stroke="rgba(255,0,0,0.15)" strokeWidth="0.5"/>
            <line x1="90" y1="158" x2="90" y2="172" stroke="rgba(255,0,0,0.15)" strokeWidth="0.5"/>
            <line x1="8" y1="90" x2="22" y2="90" stroke="rgba(255,0,0,0.15)" strokeWidth="0.5"/>
            <line x1="158" y1="90" x2="172" y2="90" stroke="rgba(255,0,0,0.15)" strokeWidth="0.5"/>
        </svg>
    );
}

/* ----------------------------------------------------------------
   Main page
   ---------------------------------------------------------------- */
const MAIN_TEXT = 'REMEMBER OUR PROMISE';

export default function PromisePage() {
    const navigate = useNavigate();
    const { resetQuest } = useQuest();
    const audio = useAmbientAudio();
    const [hoverWake, setHoverWake] = useState(false);

    const { displayed, done } = useTypewriter(MAIN_TEXT, 80, 1800);

    useEffect(() => {
        audio.start();
        return () => audio.stop();
    }, []);

    const handleWake = () => {
        audio.stop();
        resetQuest();
        navigate('/');
    };

    return (
        <div className={styles.page}>
            {/* Layers */}
            <div className={styles.noise} aria-hidden="true" />
            <div className={styles.scanlines} aria-hidden="true" />
            <div className={styles.vignette} aria-hidden="true" />
            <div className={styles.glitchFlash} aria-hidden="true" />

            {/* Particles */}
            <div className={styles.particles} aria-hidden="true">
                {PARTICLES.map((p) => (
                    <div key={p.id} className={styles.particle} style={{
                        left: p.left, bottom: '-4px',
                        animationDelay: p.delay, animationDuration: p.duration,
                        width: p.size, height: p.size,
                    }} />
                ))}
            </div>

            {/* Main content */}
            <div className={styles.content}>
                {/* Rotating hexagon / Red Gate */}
                <div className={styles.geoWrapper} aria-hidden="true">
                    <RedGateSvg
                        hexClass={styles.hexSvg}
                        innerClass={styles.hexInner}
                        pulseClass={styles.hexPulse}
                    />
                </div>

                {/* Typewriter title */}
                <div className={styles.mainTitle} aria-live="polite">
                    {displayed}
                    {!done && <span className={styles.titleCursor}>█</span>}
                </div>

                {/* Lore text */}
                <p className={styles.loreText}>
                    Синхронизация завершена.<br />
                    Капсула Penrose-512 достигла дна Европы.<br />
                    Возможно, это ад.
                </p>

                {/* Wake button */}
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
        </div>
    );
}
