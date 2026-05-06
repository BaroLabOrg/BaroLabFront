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

            // Vinyl crackle
            const bufSize = ctx.sampleRate * 2;
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.012;
            const crackle = ctx.createBufferSource();
            crackle.buffer = buf;
            crackle.loop = true;
            const cf = ctx.createBiquadFilter();
            cf.type = 'bandpass';
            cf.frequency.value = 2800;
            cf.Q.value = 0.4;
            const cg = ctx.createGain();
            cg.gain.value = 0.15;
            crackle.connect(cf); cf.connect(cg); cg.connect(ctx.destination);
            crackle.start();
            nodes.push(crackle);

            // Sub rumble
            const rumble = ctx.createOscillator();
            const rg = ctx.createGain();
            rumble.type = 'sine'; rumble.frequency.value = 38;
            rg.gain.value = 0;
            rumble.connect(rg); rg.connect(ctx.destination);
            rumble.start();
            rg.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 5);
            nodes.push(rumble);

            // Piano notes — Chopin Raindrop feel
            [220, 165, 110, 277, 220, 165, 294, 220].forEach((freq, i) => {
                const t = ctx.currentTime + 3 + i * 4.8;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const filt = ctx.createBiquadFilter();
                osc.type = 'sine'; osc.frequency.value = freq;
                filt.type = 'lowpass'; filt.frequency.value = 700;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.065, t + 0.025);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 3.8);
                osc.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
                osc.start(t); osc.stop(t + 4.2);
                nodes.push(osc);
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
   Typewriter hook
   ---------------------------------------------------------------- */
function useTypewriter(text, speed = 80, delay = 2000) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    useEffect(() => {
        setDisplayed(''); setDone(false);
        const t = setTimeout(() => {
            let i = 0;
            const id = setInterval(() => {
                i++;
                setDisplayed(text.slice(0, i));
                if (i >= text.length) { clearInterval(id); setDone(true); }
            }, speed);
            return () => clearInterval(id);
        }, delay);
        return () => clearTimeout(t);
    }, [text, speed, delay]);
    return { displayed, done };
}

/* ----------------------------------------------------------------
   Hexagonal Tesseract Symbol SVG
   Isometric cube illusion inside a hexagon, white strokes
   ---------------------------------------------------------------- */
function TesseractSymbol() {
    // Flat-top hexagon points at radius r centered at cx,cy
    const hexPts = (cx, cy, r, rot = 0) =>
        Array.from({ length: 6 }, (_, i) => {
            const a = (Math.PI / 3) * i + rot;
            return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
        }).join(' ');

    const cx = 170; const cy = 170;
    const R = 140; // outer hex radius
    const r2 = R * 0.577; // inner radius for cube illusion ≈ R/√3

    // Outer hex vertices
    const outerVerts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i;
        return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });

    // Inner hex vertices (rotated 30°)
    const innerVerts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        return { x: cx + r2 * Math.cos(a), y: cy + r2 * Math.sin(a) };
    });

    // Center hex (empty)
    const centerR = R * 0.18;

    // Isometric cube faces: 3 rhombus faces connecting inner to outer
    // Each face uses 2 adjacent outer verts + 2 adjacent inner verts
    const faces = [
        [outerVerts[0], outerVerts[1], innerVerts[1], innerVerts[0]],
        [outerVerts[2], outerVerts[3], innerVerts[3], innerVerts[2]],
        [outerVerts[4], outerVerts[5], innerVerts[5], innerVerts[4]],
    ];

    const ptStr = (pts) => pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

    return (
        <svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg">
            {/* Outer hexagon */}
            <polygon points={hexPts(cx, cy, R)} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"/>

            {/* Cube face rhombuses */}
            {faces.map((face, i) => (
                <polygon key={i} points={ptStr(face)}
                    fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.7)" strokeWidth="1"/>
            ))}

            {/* Spokes from center to inner hex vertices */}
            {innerVerts.map((v, i) => (
                <line key={i} x1={cx} y1={cy} x2={v.x} y2={v.y}
                    stroke="rgba(255,255,255,0.5)" strokeWidth="0.8"/>
            ))}

            {/* Inner hex */}
            <polygon points={hexPts(cx, cy, r2, Math.PI / 6)}
                fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>

            {/* Center empty hexagon */}
            <polygon points={hexPts(cx, cy, centerR)}
                fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2"/>

            {/* 6 small squares at outer hex vertices */}
            {outerVerts.map((v, i) => (
                <rect key={i}
                    x={v.x - 6} y={v.y - 6} width="12" height="12"
                    fill="#000" stroke="#fff" strokeWidth="1.2"/>
            ))}

            {/* Lines from outer verts to inner verts (alternate) */}
            {[0, 2, 4].map(i => (
                <line key={i}
                    x1={outerVerts[i].x} y1={outerVerts[i].y}
                    x2={innerVerts[i].x} y2={innerVerts[i].y}
                    stroke="rgba(255,255,255,0.4)" strokeWidth="0.6"/>
            ))}
        </svg>
    );
}

/* ----------------------------------------------------------------
   Gate foreground SVG
   Two massive rectangular pillars + crossbar + ruined landscape
   ---------------------------------------------------------------- */
function GateSvg() {
    const W = 1200; const H = 700;
    const pillarW = 90;
    const pillarH = 480;
    const gateLeft = W / 2 - 160;
    const gateRight = W / 2 + 160 - pillarW;
    const crossbarY = H - pillarH - 20;
    const crossbarH = 28;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet">

            {/* Left pillar */}
            <rect x={gateLeft} y={crossbarY} width={pillarW} height={pillarH} fill="#000"/>
            {/* Right pillar */}
            <rect x={gateRight} y={crossbarY} width={pillarW} height={pillarH} fill="#000"/>
            {/* Crossbar */}
            <rect x={gateLeft} y={crossbarY} width={gateRight + pillarW - gateLeft} height={crossbarH} fill="#000"/>

            {/* Pillar detail lines */}
            <line x1={gateLeft + 10} y1={crossbarY + crossbarH} x2={gateLeft + 10} y2={H}
                stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <line x1={gateRight + pillarW - 10} y1={crossbarY + crossbarH} x2={gateRight + pillarW - 10} y2={H}
                stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>

            {/* Ruined landscape — left side */}
            <polygon points={`
                0,${H}
                0,${H - 80}
                60,${H - 120}
                100,${H - 90}
                160,${H - 160}
                220,${H - 100}
                280,${H - 180}
                340,${H - 130}
                ${gateLeft},${H - 60}
                ${gateLeft},${H}
            `} fill="#000"/>

            {/* Ruined landscape — right side */}
            <polygon points={`
                ${gateRight + pillarW},${H - 60}
                ${W - 340},${H - 130}
                ${W - 280},${H - 180}
                ${W - 220},${H - 100}
                ${W - 160},${H - 160}
                ${W - 100},${H - 90}
                ${W - 60},${H - 120}
                ${W},${H - 80}
                ${W},${H}
                ${gateRight + pillarW},${H}
            `} fill="#000"/>

            {/* Ground strip */}
            <rect x="0" y={H - 55} width={W} height="55" fill="#000"/>

            {/* Subtle gate glow outline */}
            <rect x={gateLeft} y={crossbarY} width={pillarW} height={pillarH}
                fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <rect x={gateRight} y={crossbarY} width={pillarW} height={pillarH}
                fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
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
    const { displayed, done } = useTypewriter(MAIN_TEXT, 80, 2000);

    // Parallax refs
    const bgRef = useRef(null);
    const symbolRef = useRef(null);
    const gateRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const xAxis = (window.innerWidth / 2 - e.clientX);
        const yAxis = (window.innerHeight / 2 - e.clientY);

        if (bgRef.current) {
            bgRef.current.style.transform =
                `translate(${xAxis / 100}px, ${yAxis / 100}px)`;
        }
        if (symbolRef.current) {
            symbolRef.current.style.transform =
                `translate(${xAxis / 45}px, ${yAxis / 45}px)`;
        }
        if (gateRef.current) {
            gateRef.current.style.transform =
                `translate(${xAxis / 18}px, ${yAxis / 18}px)`;
        }
    }, []);

    useEffect(() => {
        audio.start();
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            audio.stop();
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [handleMouseMove]);

    const handleWake = () => {
        audio.stop();
        resetQuest();
        navigate('/');
    };

    return (
        <div className={styles.page}>
            {/* Layer 1 — Red background */}
            <div className={styles.layerBg} ref={bgRef}>
                <div className={styles.bgNoise} aria-hidden="true" />
            </div>

            {/* Layer 2 — Tesseract symbol */}
            <div className={styles.layerSymbol} ref={symbolRef} aria-hidden="true">
                <TesseractSymbol />
            </div>

            {/* Layer 3 — Gate foreground */}
            <div className={styles.layerGate} ref={gateRef} aria-hidden="true">
                <GateSvg />
            </div>

            {/* Post-processing */}
            <div className={styles.scanlines} aria-hidden="true" />
            <div className={styles.vignette} aria-hidden="true" />
            <div className={styles.glitchFlash} aria-hidden="true" />

            {/* Lore text — right side, no parallax */}
            <p className={styles.loreText} aria-hidden="true">
                S I G N A L I S<br />
                ——————————<br />
                Синхронизация завершена.<br />
                Капсула Penrose-512<br />
                достигла дна Европы.<br />
                Возможно, это ад.
            </p>

            {/* UI layer — title + button */}
            <div className={styles.layerUi}>
                <div className={styles.titleText} aria-live="polite">
                    {displayed}
                    {!done && <span className={styles.titleCursor}>█</span>}
                </div>

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
