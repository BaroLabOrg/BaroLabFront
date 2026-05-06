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
            crackle.buffer = buf; crackle.loop = true;
            const cf = ctx.createBiquadFilter();
            cf.type = 'bandpass'; cf.frequency.value = 2800; cf.Q.value = 0.4;
            const cg = ctx.createGain(); cg.gain.value = 0.15;
            crackle.connect(cf); cf.connect(cg); cg.connect(ctx.destination);
            crackle.start(); nodes.push(crackle);

            // Sub rumble
            const rumble = ctx.createOscillator();
            const rg = ctx.createGain();
            rumble.type = 'sine'; rumble.frequency.value = 38; rg.gain.value = 0;
            rumble.connect(rg); rg.connect(ctx.destination); rumble.start();
            rg.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 5);
            nodes.push(rumble);

            // Piano notes
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
   Hexagonal Tesseract Symbol — white strokes, thin lines
   ---------------------------------------------------------------- */
function TesseractSymbol() {
    const cx = 170; const cy = 170;
    const R = 140;
    const r2 = R * 0.577;

    const outerVerts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i;
        return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });
    const innerVerts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        return { x: cx + r2 * Math.cos(a), y: cy + r2 * Math.sin(a) };
    });

    const hexPts = (r, rot = 0) =>
        Array.from({ length: 6 }, (_, i) => {
            const a = (Math.PI / 3) * i + rot;
            return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
        }).join(' ');

    const faces = [
        [outerVerts[0], outerVerts[1], innerVerts[1], innerVerts[0]],
        [outerVerts[2], outerVerts[3], innerVerts[3], innerVerts[2]],
        [outerVerts[4], outerVerts[5], innerVerts[5], innerVerts[4]],
    ];
    const ptStr = (pts) => pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

    return (
        <svg className={styles.symbolSvg} viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg">
            {/* Outer hex */}
            <polygon points={hexPts(R)} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2"/>
            {/* Cube faces */}
            {faces.map((face, i) => (
                <polygon key={i} points={ptStr(face)}
                    fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.65)" strokeWidth="1"/>
            ))}
            {/* Spokes center → inner */}
            {innerVerts.map((v, i) => (
                <line key={i} x1={cx} y1={cy} x2={v.x} y2={v.y}
                    stroke="rgba(255,255,255,0.45)" strokeWidth="0.8"/>
            ))}
            {/* Inner hex */}
            <polygon points={hexPts(r2, Math.PI / 6)}
                fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1"/>
            {/* Center hex */}
            <polygon points={hexPts(R * 0.18)}
                fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.75)" strokeWidth="1"/>
            {/* 6 small squares at outer vertices */}
            {outerVerts.map((v, i) => (
                <rect key={i} x={v.x - 5} y={v.y - 5} width="10" height="10"
                    fill="#000" stroke="#fff" strokeWidth="1"/>
            ))}
            {/* Alternate spokes outer → inner */}
            {[0, 2, 4].map(i => (
                <line key={i}
                    x1={outerVerts[i].x} y1={outerVerts[i].y}
                    x2={innerVerts[i].x} y2={innerVerts[i].y}
                    stroke="rgba(255,255,255,0.35)" strokeWidth="0.6"/>
            ))}
        </svg>
    );
}

/* ----------------------------------------------------------------
   Gate SVG — П-shape left of center + full-width ruined landscape
   ---------------------------------------------------------------- */
function GateSvg() {
    // viewBox covers full screen proportions
    const W = 1600; const H = 900;

    // Gate positioned at ~30% from left
    const gateCenterX = W * 0.30;
    const pillarW = 70;
    const pillarH = 520;
    const gateOpeningW = 220;
    const leftPillarX = gateCenterX - gateOpeningW / 2 - pillarW;
    const rightPillarX = gateCenterX + gateOpeningW / 2;
    const crossbarY = H - pillarH - 10;
    const crossbarH = 32;
    const crossbarX = leftPillarX;
    const crossbarW = rightPillarX + pillarW - leftPillarX;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet">

            {/* Left pillar */}
            <rect x={leftPillarX} y={crossbarY} width={pillarW} height={pillarH} fill="#000"/>
            {/* Right pillar */}
            <rect x={rightPillarX} y={crossbarY} width={pillarW} height={pillarH} fill="#000"/>
            {/* Top crossbar */}
            <rect x={crossbarX} y={crossbarY} width={crossbarW} height={crossbarH} fill="#000"/>

            {/* Subtle inner glow lines on pillars */}
            <line x1={leftPillarX + 8} y1={crossbarY + crossbarH} x2={leftPillarX + 8} y2={H}
                stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
            <line x1={rightPillarX + pillarW - 8} y1={crossbarY + crossbarH}
                x2={rightPillarX + pillarW - 8} y2={H}
                stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>

            {/* Full-width ruined landscape silhouette */}
            <polygon points={`
                0,${H}
                0,${H - 70}
                55,${H - 110}
                90,${H - 80}
                140,${H - 150}
                190,${H - 95}
                240,${H - 170}
                300,${H - 120}
                360,${H - 190}
                420,${H - 140}
                ${leftPillarX},${H - 55}
                ${leftPillarX},${H}
            `} fill="#000"/>

            {/* Between pillars — ground */}
            <rect x={leftPillarX + pillarW} y={H - 55} width={gateOpeningW} height="55" fill="#000"/>

            <polygon points={`
                ${rightPillarX + pillarW},${H - 55}
                ${W - 420},${H - 140}
                ${W - 360},${H - 190}
                ${W - 300},${H - 120}
                ${W - 240},${H - 170}
                ${W - 190},${H - 95}
                ${W - 140},${H - 150}
                ${W - 90},${H - 80}
                ${W - 55},${H - 110}
                ${W},${H - 70}
                ${W},${H}
                ${rightPillarX + pillarW},${H}
            `} fill="#000"/>

            {/* Ground strip full width */}
            <rect x="0" y={H - 50} width={W} height="50" fill="#000"/>
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

    const bgRef = useRef(null);
    const symbolRef = useRef(null);
    const gateRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const xAxis = window.innerWidth / 2 - e.clientX;
        const yAxis = window.innerHeight / 2 - e.clientY;
        if (bgRef.current)
            bgRef.current.style.transform = `translate(${xAxis / 100}px, ${yAxis / 100}px)`;
        if (symbolRef.current)
            symbolRef.current.style.transform = `translate(${xAxis / 45}px, ${yAxis / 45}px)`;
        if (gateRef.current)
            gateRef.current.style.transform = `translate(${xAxis / 18}px, ${yAxis / 18}px)`;
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

            {/* Layer 2 — Tesseract symbol (centered, small) */}
            <div className={styles.layerSymbol} ref={symbolRef} aria-hidden="true">
                <TesseractSymbol />
            </div>

            {/* Layer 3 — Gate + landscape (left of center) */}
            <div className={styles.layerGate} ref={gateRef} aria-hidden="true">
                <GateSvg />
            </div>

            {/* Post-processing */}
            <div className={styles.scanlines} aria-hidden="true" />
            <div className={styles.vignette} aria-hidden="true" />
            <div className={styles.glitchFlash} aria-hidden="true" />

            {/* Layer 4 — UI (no parallax) */}
            <div className={styles.layerUi}>
                {/* SIGNALIS — right side */}
                <div className={styles.signalisTitle} aria-hidden="true">
                    S I G N A L I S
                </div>

                {/* Lore text — below SIGNALIS */}
                <p className={styles.loreText}>
                    Синхронизация завершена.<br />
                    Капсула Penrose-512<br />
                    достигла дна Европы.<br />
                    Возможно, это ад.
                </p>

                {/* REMEMBER OUR PROMISE — above button */}
                <div className={styles.promiseText} aria-live="polite">
                    {displayed}
                    {!done && <span className={styles.titleCursor}>█</span>}
                </div>

                {/* Wake button — bottom center */}
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
