import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuest } from '../context/QuestContext';
import styles from './PromisePage.module.css';

/* Ambient audio — base64 encoded minimal sine-wave tone generated inline via Web Audio API */
function useAmbientAudio() {
    const ctxRef = useRef(null);
    const nodesRef = useRef([]);

    const start = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            ctxRef.current = ctx;

            // Layer 1: deep drone ~55 Hz
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.value = 55;
            gain1.gain.value = 0;
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start();
            gain1.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 3);

            // Layer 2: mid tone ~110 Hz with slow LFO
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.value = 110;
            lfo.type = 'sine';
            lfo.frequency.value = 0.15;
            lfoGain.gain.value = 0.015;
            lfo.connect(lfoGain);
            lfoGain.connect(gain2.gain);
            gain2.gain.value = 0;
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start();
            lfo.start();
            gain2.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 4);

            // Layer 3: high shimmer ~880 Hz very quiet
            const osc3 = ctx.createOscillator();
            const gain3 = ctx.createGain();
            osc3.type = 'sine';
            osc3.frequency.value = 880;
            gain3.gain.value = 0;
            osc3.connect(gain3);
            gain3.connect(ctx.destination);
            osc3.start();
            gain3.gain.linearRampToValueAtTime(0.008, ctx.currentTime + 5);

            nodesRef.current = [osc1, osc2, osc3, lfo];
        } catch {
            // Audio not available — silent fail
        }
    };

    const stop = () => {
        try {
            nodesRef.current.forEach((n) => { try { n.stop(); } catch {} });
            nodesRef.current = [];
            if (ctxRef.current) {
                ctxRef.current.close();
                ctxRef.current = null;
            }
        } catch {}
    };

    return { start, stop };
}

/* Particle data — generated once */
const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 12}s`,
    duration: `${8 + Math.random() * 10}s`,
    size: `${1 + Math.random() * 2}px`,
}));

/* SVG Eye illustration */
function EyeSvg({ className, pupilClassName }) {
    return (
        <svg className={className} viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
            {/* Outer glow ring */}
            <circle cx="80" cy="80" r="75" fill="none" stroke="rgba(255,0,0,0.08)" strokeWidth="1"/>
            <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(255,0,0,0.06)" strokeWidth="0.5"/>

            {/* Eye white */}
            <ellipse cx="80" cy="80" rx="60" ry="35" fill="#0a0505" stroke="rgba(255,0,0,0.3)" strokeWidth="0.8"/>

            {/* Iris */}
            <g className={pupilClassName}>
                <circle cx="80" cy="80" r="28" fill="#0d0000" stroke="rgba(255,0,0,0.5)" strokeWidth="0.8"/>
                {/* Iris detail rings */}
                <circle cx="80" cy="80" r="22" fill="none" stroke="rgba(255,0,0,0.2)" strokeWidth="0.5"/>
                <circle cx="80" cy="80" r="16" fill="none" stroke="rgba(255,0,0,0.15)" strokeWidth="0.5"/>
                {/* Pupil */}
                <circle cx="80" cy="80" r="10" fill="#000"/>
                {/* Highlight */}
                <circle cx="86" cy="74" r="3" fill="rgba(255,255,255,0.08)"/>
            </g>

            {/* Eyelashes / lashes */}
            {[-40, -20, 0, 20, 40].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const x1 = 80 + 60 * Math.cos(rad);
                const y1 = 80 + 35 * Math.sin(rad);
                const x2 = 80 + 68 * Math.cos(rad);
                const y2 = 80 + 40 * Math.sin(rad);
                return (
                    <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="rgba(255,0,0,0.2)" strokeWidth="0.8"/>
                );
            })}

            {/* Decorative circuit lines */}
            <line x1="20" y1="80" x2="5" y2="80" stroke="rgba(255,0,0,0.15)" strokeWidth="0.5"/>
            <line x1="140" y1="80" x2="155" y2="80" stroke="rgba(255,0,0,0.15)" strokeWidth="0.5"/>
            <line x1="80" y1="45" x2="80" y2="30" stroke="rgba(255,0,0,0.1)" strokeWidth="0.5"/>
            <line x1="80" y1="115" x2="80" y2="130" stroke="rgba(255,0,0,0.1)" strokeWidth="0.5"/>
        </svg>
    );
}

export default function PromisePage() {
    const navigate = useNavigate();
    const { resetQuest } = useQuest();
    const audio = useAmbientAudio();

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
            {/* Ambient particles */}
            <div className={styles.particles} aria-hidden="true">
                {PARTICLES.map((p) => (
                    <div
                        key={p.id}
                        className={styles.particle}
                        style={{
                            left: p.left,
                            bottom: '-4px',
                            animationDelay: p.delay,
                            animationDuration: p.duration,
                            width: p.size,
                            height: p.size,
                        }}
                    />
                ))}
            </div>

            {/* Glitch flash overlay */}
            <div className={styles.glitchFlash} aria-hidden="true" />

            {/* Main content */}
            <div className={styles.eyeWrapper}>
                <EyeSvg className={styles.eyeSvg} pupilClassName={styles.eyePupil} />

                <div className={styles.loreText}>
                    <span className={styles.loreHighlight}>
                        <span
                            className={styles.aberration}
                            data-text="SYNCHRONICITY ACHIEVED"
                        >
                            SYNCHRONICITY ACHIEVED
                        </span>
                    </span>
                    {`Ты нашёл то, что не должно было быть найдено.
Сигнал принят. Протокол выполнен.

Где-то в глубине — она всё ещё ждёт.
Частота 240.0. Протокол 512.

Это не конец.
Это обещание.`}
                </div>

                <button
                    className={styles.wakeBtn}
                    onClick={handleWake}
                    aria-label="Wake up and return to main page"
                >
                    [ ПРОСНУТЬСЯ ]
                </button>
            </div>
        </div>
    );
}
