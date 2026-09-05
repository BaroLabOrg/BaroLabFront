import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuest } from '../context/QuestContext';
import usePromiseAudio from '../components/quest/usePromiseAudio';
import styles from './PromisePage.module.css';

const BOOT_LINES = [
    ['AEON / LSTR-512', 'INITIALISIERUNG'],
    ['GESTALT MEMORY', 'FRAGMENTIERT'],
    ['SIGNAL / 240.0', 'EMPFANGEN'],
    ['SYNCHRONIZITÄT', 'FEHLGESCHLAGEN'],
];

export default function PromisePage() {
    const navigate = useNavigate();
    const { resetQuest, closeTerminal } = useQuest();
    const [phase, setPhase] = useState('boot');
    const [lines, setLines] = useState(1);
    const [leaving, setLeaving] = useState(false);
    const exitTimer = useRef(null);
    const title = useRef(null);
    const audio = usePromiseAudio();

    useEffect(() => {
        closeTerminal();
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) { setPhase('promise'); return; }
        const timers = [
            setTimeout(() => setLines(2), 700),
            setTimeout(() => setLines(3), 1400),
            setTimeout(() => setLines(4), 2100),
            setTimeout(() => setPhase('signal'), 3000),
            setTimeout(() => setPhase('promise'), 4300),
        ];
        return () => timers.forEach(clearTimeout);
    }, [closeTerminal]);

    useEffect(() => {
        if (phase === 'promise') title.current?.focus({ preventScroll: true });
    }, [phase]);

    useEffect(() => () => clearTimeout(exitTimer.current), []);

    const wake = () => {
        if (leaving) return;
        setLeaving(true);
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        exitTimer.current = setTimeout(() => { resetQuest(); navigate('/'); }, reduceMotion ? 0 : 900);
    };

    return (
        <main className={`${styles.page} ${leaving ? styles.leaving : ''}`}>
            <div className={`${styles.scene} ${phase === 'promise' ? styles.sceneVisible : ''}`} aria-hidden="true">
                <img src="/quest/red-gate.png" alt="" fetchPriority="high" />
                <div className={styles.sceneShade} />
            </div>
            <div className={styles.scanlines} aria-hidden="true" />
            <header className={styles.topBar}>
                <span>LSTR–512</span>
                <span className={styles.signalState}>{phase === 'boot' ? 'SYNCHRONIZING' : 'SIGNAL LOST'}</span>
                <button onClick={audio.toggle} aria-pressed={audio.enabled} disabled={!audio.available} aria-label="Ambient sound">
                    {audio.available ? `SOUND: ${audio.enabled ? 'ON' : 'OFF'}` : 'SOUND UNAVAILABLE'}
                </button>
            </header>

            {phase === 'boot' && <section className={styles.boot} aria-label="Terminal boot sequence">
                <div className={styles.bootMark}>LSTR</div>
                <div className={styles.bootLog} role="log" aria-live="polite">
                    {BOOT_LINES.slice(0, lines).map(([name, status], index) => <p key={name}><span>{name}</span><span className={index === 3 ? styles.fault : ''}>{status}</span></p>)}
                </div>
                <span className={styles.cursor} aria-hidden="true" />
            </section>}

            {phase === 'signal' && <div className={styles.interruption} role="status"><span>ACHTUNG</span><p>Remember our promise.</p></div>}

            {phase === 'promise' && <section className={styles.finalSection} aria-label="The promise">
                <div className={styles.message}>
                    <h1 ref={title} tabIndex={-1} className={styles.promiseText}><span>REMEMBER</span><span>OUR</span><span>PROMISE.</span></h1>
                    <p className={styles.german}>VERGISS UNSER VERSPRECHEN NICHT.</p>
                    <div className={styles.memory}>
                        <p>I remember why I am here.</p>
                        <p>Beyond these gates, you are still waiting.<br />No matter how many times I forget.</p>
                        <p className={styles.lastLine}>I will come back for you.</p>
                    </div>
                    <button className={styles.wakeBtn} onClick={wake} disabled={leaving} aria-label="Wake up and return to main page"><span className={styles.arrow} aria-hidden="true">▸</span>{leaving ? 'WAKING UP' : 'WAKE UP'}<span className={styles.wakeTranslation}>ERWACHE</span></button>
                    <p className={styles.artCredit}>
                        Artwork: The Red Gate Redraw<br />
                        <a href="https://www.reddit.com/r/signalis/comments/1je1oyr/the_red_gate_redraw/" target="_blank" rel="noopener noreferrer">Artist and original post on Reddit <span aria-hidden="true">↗</span></a>
                    </p>
                </div>
            </section>}
            <footer className={styles.bottomBar}><span>PENROSE / 512</span><span>END OF TRANSMISSION</span><span>240.0 MHz</span></footer>
        </main>
    );
}
