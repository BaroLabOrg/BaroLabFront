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
            const cg = ctx.createGain(); cg.gain.value = 0.15;
            crackle.connect(cf); cf.connect(cg); cg.connect(ctx.destination);
            crackle.start(); nodes.push(crackle);

            const rumble = ctx.createOscillator();
            const rg = ctx.createGain();
            rumble.type = 'sine'; rumble.frequency.value = 38; rg.gain.value = 0;
            rumble.connect(rg); rg.connect(ctx.destination); rumble.start();
            rg.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 5);
            nodes.push(rumble);

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
   Bioresonance Hexagon Symbol
   
   Geometry:
   - Outer regular hexagon, pointy-top (one vertex up, one down)
   - Inner regular hexagon (same orientation, ~57.7% size = 1/√3)
   - Each outer vertex connected to the nearest inner vertex
     → creates isometric cube / tesseract optical illusion
   - 6 small squares just outside each outer vertex
   - fill: none, stroke: white, stroke-width: 1
   ---------------------------------------------------------------- */
function BioresonanceHexagon() {
    const cx = 200; const cy = 200;
    const R = 170;   // outer hex radius
    const r = 98;    // inner hex radius ≈ R / √3

    // Pointy-top: first vertex at top (angle = -90° = -π/2)
    const outerV = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });
    const innerV = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });

    const outerPts = outerV.map(v => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ');
    const innerPts = innerV.map(v => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ');

    // Square size and offset from vertex
    const sq = 9; const sqOff = 14;

    return (
        <svg className={styles.symbolSvg} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            {/* Outer hexagon */}
            <polygon points={outerPts} fill="none" stroke="white" strokeWidth="1"/>

            {/* Inner hexagon */}
            <polygon points={innerPts} fill="none" stroke="white" strokeWidth="1"/>

            {/* Connect each outer vertex to corresponding inner vertex */}
            {outerV.map((ov, i) => (
                <line key={`spoke-${i}`}
                    x1={ov.x.toFixed(2)} y1={ov.y.toFixed(2)}
                    x2={innerV[i].x.toFixed(2)} y2={innerV[i].y.toFixed(2)}
                    stroke="white" strokeWidth="1"/>
            ))}

            {/*
                Cross-connections to create isometric cube illusion:
                Connect each inner vertex to the NEXT outer vertex (i+1)
                This creates the "depth" lines of the cube faces
            */}
            {innerV.map((iv, i) => (
                <line key={`cross-${i}`}
                    x1={iv.x.toFixed(2)} y1={iv.y.toFixed(2)}
                    x2={outerV[(i + 1) % 6].x.toFixed(2)} y2={outerV[(i + 1) % 6].y.toFixed(2)}
                    stroke="white" strokeWidth="1"/>
            ))}

            {/* 6 small squares outside each outer vertex */}
            {outerV.map((v, i) => {
                const a = (Math.PI / 3) * i - Math.PI / 2;
                const sx = v.x + sqOff * Math.cos(a);
                const sy = v.y + sqOff * Math.sin(a);
                return (
                    <rect key={`sq-${i}`}
                        x={(sx - sq / 2).toFixed(2)} y={(sy - sq / 2).toFixed(2)}
                        width={sq} height={sq}
                        fill="none" stroke="white" strokeWidth="1"/>
                );
            })}
        </svg>
    );
}

/* ----------------------------------------------------------------
   Gate SVG — П-shape, smaller scale, left of center
   Landscape with ruined buildings
   ---------------------------------------------------------------- */
function GateSvg() {
    const W = 1600; const H = 900;

    // Gate center at ~28% from left
    const gateCX = W * 0.28;
    const pillarW = 55;
    const pillarH = 380;   // shorter than before
    const openingW = 180;
    const lx = gateCX - openingW / 2 - pillarW;  // left pillar x
    const rx = gateCX + openingW / 2;              // right pillar x
    const barY = H - pillarH - 8;
    const barH = 24;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet">

            {/* Left pillar */}
            <rect x={lx} y={barY} width={pillarW} height={pillarH} fill="#000"/>
            {/* Right pillar */}
            <rect x={rx} y={barY} width={pillarW} height={pillarH} fill="#000"/>
            {/* Crossbar */}
            <rect x={lx} y={barY} width={rx + pillarW - lx} height={barH} fill="#000"/>

            {/* Ruined buildings — left of gate */}
            <polygon points={`
                0,${H}
                0,${H - 60}
                40,${H - 100}
                80,${H - 70}
                120,${H - 130}
                160,${H - 85}
                200,${H - 155}
                250,${H - 110}
                310,${H - 175}
                370,${H - 125}
                ${lx},${H - 48}
                ${lx},${H}
            `} fill="#000"/>

            {/* Ground under gate opening */}
            <rect x={lx + pillarW} y={H - 48} width={openingW} height="48" fill="#000"/>

            {/* Ruined buildings — right of gate */}
            <polygon points={`
                ${rx + pillarW},${H - 48}
                ${W - 370},${H - 125}
                ${W - 310},${H - 175}
                ${W - 250},${H - 110}
                ${W - 200},${H - 155}
                ${W - 160},${H - 85}
                ${W - 120},${H - 130}
                ${W - 80},${H - 70}
                ${W - 40},${H - 100}
                ${W},${H - 60}
                ${W},${H}
                ${rx + pillarW},${H}
            `} fill="#000"/>

            {/* Ground strip */}
            <rect x="0" y={H - 44} width={W} height="44" fill="#000"/>
        </svg>
    );
}

/* ----------------------------------------------------------------
   Foreground blocks SVG — massive ruins in front of gate
   ---------------------------------------------------------------- */
function ForegroundSvg() {
    const W = 1600; const H = 900;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet">

            {/* Far-left tall block */}
            <rect x="0" y={H - 280} width="90" height="280" fill="#000"/>
            {/* Left cluster */}
            <rect x="80" y={H - 180} width="70" height="180" fill="#000"/>
            <rect x="140" y={H - 240} width="50" height="240" fill="#000"/>
            <rect x="185" y={H - 150} width="80" height="150" fill="#000"/>

            {/* Right cluster */}
            <rect x={W - 265} y={H - 150} width="80" height="150" fill="#000"/>
            <rect x={W - 190} y={H - 240} width="50" height="240" fill="#000"/>
            <rect x={W - 145} y={H - 180} width="70" height="180" fill="#000"/>
            <rect x={W - 90} y={H - 280} width="90" height="280" fill="#000"/>

            {/* Ground strip */}
            <rect x="0" y={H - 38} width={W} height="38" fill="#000"/>
        </svg>
    );
}

/* ----------------------------------------------------------------
   Main page
   ---------------------------------------------------------------- */
const PROMISE_TEXT = 'REMEMBER OUR PROMISE';

export default function PromisePage() {
    const navigate = useNavigate();
    const { resetQuest } = useQuest();
    const audio = useAmbientAudio();
    const [hoverWake, setHoverWake] = useState(false);
    const { displayed, done } = useTypewriter(PROMISE_TEXT, 80, 2200);

    const bgRef     = useRef(null);
    const symbolRef = useRef(null);
    const gateRef   = useRef(null);
    const fgRef     = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const xAxis = window.innerWidth  / 2 - e.clientX;
        const yAxis = window.innerHeight / 2 - e.clientY;

        if (bgRef.current)
            bgRef.current.style.transform     = `translate(${xAxis / 110}px, ${yAxis / 110}px)`;
        if (symbolRef.current)
            symbolRef.current.style.transform = `translate(${xAxis / 50}px,  ${yAxis / 50}px)`;
        if (gateRef.current)
            gateRef.current.style.transform   = `translate(${xAxis / 25}px,  ${yAxis / 25}px)`;
        if (fgRef.current)
            fgRef.current.style.transform     = `translate(${xAxis / 12}px,  ${yAxis / 12}px)`;
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
            {/* Layer 1 — Red background (slowest) */}
            <div className={styles.layerBg} ref={bgRef}>
                <div className={styles.bgNoise} aria-hidden="true" />
            </div>

            {/* Layer 2 — Bioresonance hexagon symbol */}
            <div className={styles.layerSymbol} ref={symbolRef} aria-hidden="true">
                <BioresonanceHexagon />
            </div>

            {/* Layer 3 — Gate П-shape + landscape */}
            <div className={styles.layerGate} ref={gateRef} aria-hidden="true">
                <GateSvg />
            </div>

            {/* Layer 4 — Foreground ruins (fastest) */}
            <div className={styles.layerFg} ref={fgRef} aria-hidden="true">
                <ForegroundSvg />
            </div>

            {/* Post-processing */}
            <div className={styles.scanlines} aria-hidden="true" />
            <div className={styles.vignette} aria-hidden="true" />
            <div className={styles.glitchFlash} aria-hidden="true" />

            {/* Layer 5 — UI (no parallax, z-index: 100) */}
            <div className={styles.layerUi}>
                <div className={styles.signalisTitle} aria-hidden="true">
                    S I G N A L I S
                </div>

                <p className={styles.loreText}>
                    Синхронизация завершена.<br />
                    Капсула Penrose-512<br />
                    достигла дна Европы.<br />
                    Возможно, это ад.
                </p>

                <div className={styles.promiseText} aria-live="polite">
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
