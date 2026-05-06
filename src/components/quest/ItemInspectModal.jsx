import { useRef, useState, useEffect, useCallback } from 'react';
import { useQuest } from '../../context/QuestContext';
import styles from './ItemInspectModal.module.css';

/* ----------------------------------------------------------------
   Item data — updated lore, SVG illustrations, Signalis-style
   ---------------------------------------------------------------- */
const ITEMS = {
    1: {
        name: 'ПРОПУСК ГЕШТАЛЬТА — S-23 SIERPINSKI',
        id: 'ITEM-GS-404',
        desc: `Пластик оплавлен. Имя стерто,
видна только должность:
Офицер безопасности.

Чип биорезонанса всё ещё активен.
Статус носителя: [GELÖSCHT]`,
        hint: 'Ищи там, где данных больше нет',
        backText: 'СЕКТОР 404',
        backSub: 'Ищи там, где данных больше нет',
        svgContent: (
            <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
                {/* Card body */}
                <rect x="15" y="50" width="150" height="95" rx="5" fill="#0d0000" stroke="#ff0000" strokeWidth="1.2"/>
                {/* Magnetic stripe */}
                <rect x="15" y="50" width="150" height="18" fill="#1a0000"/>
                <rect x="15" y="58" width="150" height="8" fill="#220000" opacity="0.8"/>
                {/* Sierpinski triangle watermark */}
                <polygon points="90,65 75,90 105,90" fill="none" stroke="rgba(255,0,0,0.15)" strokeWidth="0.8"/>
                <polygon points="90,72 82,85 98,85" fill="none" stroke="rgba(255,0,0,0.1)" strokeWidth="0.5"/>
                {/* Bioresonance chip */}
                <rect x="125" y="82" width="28" height="22" rx="2" fill="#0d0000" stroke="rgba(255,0,0,0.5)" strokeWidth="0.8"/>
                <line x1="125" y1="93" x2="153" y2="93" stroke="rgba(255,0,0,0.2)" strokeWidth="0.4"/>
                <line x1="139" y1="82" x2="139" y2="104" stroke="rgba(255,0,0,0.2)" strokeWidth="0.4"/>
                <circle cx="139" cy="93" r="4" fill="none" stroke="rgba(255,0,0,0.4)" strokeWidth="0.6"/>
                <circle cx="139" cy="93" r="1.5" fill="rgba(255,0,0,0.6)"/>
                {/* Text fields */}
                <rect x="25" y="82" width="88" height="7" rx="1" fill="#1a0000" stroke="rgba(255,0,0,0.2)" strokeWidth="0.4"/>
                <rect x="25" y="94" width="60" height="4" rx="1" fill="rgba(255,0,0,0.08)"/>
                <rect x="25" y="102" width="75" height="4" rx="1" fill="rgba(255,0,0,0.06)"/>
                <rect x="25" y="110" width="45" height="4" rx="1" fill="rgba(255,0,0,0.05)"/>
                {/* Burn damage */}
                <ellipse cx="60" cy="130" rx="25" ry="6" fill="rgba(255,0,0,0.04)" stroke="rgba(255,0,0,0.1)" strokeWidth="0.5"/>
                <text x="25" y="76" fontFamily="Courier New" fontSize="6" fill="rgba(255,0,0,0.4)" letterSpacing="1">GESTALTEN SICHERHEIT</text>
                <text x="25" y="140" fontFamily="Courier New" fontSize="5" fill="rgba(255,0,0,0.2)" letterSpacing="0.5">S-23 // SIERPINSKI // [GELÖSCHT]</text>
                {/* Melt marks */}
                <path d="M 15 95 Q 18 100 15 105" stroke="rgba(255,0,0,0.3)" strokeWidth="1" fill="none"/>
                <path d="M 165 80 Q 162 85 165 90" stroke="rgba(255,0,0,0.2)" strokeWidth="0.8" fill="none"/>
            </svg>
        ),
    },
    2: {
        name: 'СЛОМАННЫЙ МОДУЛЬ РЕПЛИКИ',
        id: 'ITEM-RP-512',
        desc: `Деталь не соответствует ванильным
чертежам Barotrauma.

В логах устройства сохранилась
цикличная запись:

"Правило Шести."

Батарея: 3% // KRITISCH`,
        hint: 'Сигнал скрыт в основании системы',
        backText: 'СИГНАЛ В ОСНОВАНИИ',
        backSub: '↓ FOOTER // BUILD VERSION ↓',
        svgContent: (
            <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
                {/* Main body */}
                <rect x="30" y="35" width="120" height="110" rx="4" fill="#0a0000" stroke="#ff0000" strokeWidth="1.2"/>
                {/* Screen */}
                <rect x="40" y="45" width="80" height="45" rx="2" fill="#050000" stroke="rgba(255,0,0,0.5)" strokeWidth="0.8"/>
                {/* Hexagon on screen — Rule of Six */}
                <polygon points="80,52 92,59 92,73 80,80 68,73 68,59"
                    fill="none" stroke="rgba(255,0,0,0.7)" strokeWidth="1"/>
                <polygon points="80,57 88,62 88,72 80,77 72,72 72,62"
                    fill="none" stroke="rgba(255,0,0,0.3)" strokeWidth="0.5"/>
                <text x="80" y="68" fontFamily="Courier New" fontSize="7" fill="rgba(255,0,0,0.6)"
                    textAnchor="middle" letterSpacing="0.5">VI</text>
                <text x="80" y="88" fontFamily="Courier New" fontSize="5" fill="rgba(255,0,0,0.3)"
                    textAnchor="middle" letterSpacing="1">REGEL DER SECHS</text>
                {/* Broken antenna */}
                <line x1="130" y1="45" x2="140" y2="18" stroke="rgba(255,0,0,0.5)" strokeWidth="1.5"/>
                <line x1="140" y1="18" x2="155" y2="30" stroke="rgba(255,0,0,0.25)" strokeWidth="1" strokeDasharray="3,2"/>
                {/* Buttons row */}
                <circle cx="45" cy="115" r="5" fill="#0d0000" stroke="rgba(255,0,0,0.4)" strokeWidth="0.8"/>
                <circle cx="60" cy="115" r="5" fill="#0d0000" stroke="rgba(255,0,0,0.4)" strokeWidth="0.8"/>
                <circle cx="75" cy="115" r="5" fill="#1a0000" stroke="rgba(255,0,0,0.7)" strokeWidth="0.8"/>
                {/* Dial */}
                <circle cx="125" cy="110" r="16" fill="#0a0000" stroke="rgba(255,0,0,0.35)" strokeWidth="1"/>
                <line x1="125" y1="110" x2="125" y2="96" stroke="rgba(255,0,0,0.5)" strokeWidth="1.5"/>
                {/* Burn */}
                <ellipse cx="85" cy="138" rx="22" ry="7" fill="rgba(255,0,0,0.05)" stroke="rgba(255,0,0,0.12)" strokeWidth="0.5"/>
                <text x="74" y="141" fontFamily="Courier New" fontSize="5" fill="rgba(255,0,0,0.2)">THERMAL DAMAGE</text>
            </svg>
        ),
    },
    3: {
        name: 'ОБЛОЖКА — "КОРОЛЬ В ЖЁЛТОМ"',
        id: 'ITEM-KY-001',
        desc: `Страницы отсутствуют.

От обложки исходит слабое
электромагнитное излучение.

Автор: [UNBEKANNT]
Издание: [VERBOTEN]`,
        hint: 'Переверни — там написано',
        backText: 'Protokoll: 512\nFrequenz: 240.0',
        backSub: '[ REMEMBER OUR PROMISE ]',
        svgContent: (
            <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
                {/* Book cover */}
                <rect x="30" y="15" width="120" height="155" rx="3" fill="#0a0000" stroke="rgba(255,0,0,0.4)" strokeWidth="1"/>
                {/* Spine */}
                <rect x="30" y="15" width="8" height="155" fill="#0d0000" stroke="rgba(255,0,0,0.2)" strokeWidth="0.5"/>
                {/* Yellow King symbol — stylized crown */}
                <polygon points="90,45 75,75 85,68 90,78 95,68 105,75"
                    fill="none" stroke="rgba(255,200,0,0.25)" strokeWidth="1"/>
                {/* Tattered pages hint */}
                <line x1="45" y1="170" x2="150" y2="170" stroke="rgba(255,0,0,0.1)" strokeWidth="0.5"/>
                {/* EM radiation waves */}
                <circle cx="90" cy="90" r="20" fill="none" stroke="rgba(255,0,0,0.06)" strokeWidth="0.8"/>
                <circle cx="90" cy="90" r="30" fill="none" stroke="rgba(255,0,0,0.04)" strokeWidth="0.6"/>
                <circle cx="90" cy="90" r="40" fill="none" stroke="rgba(255,0,0,0.03)" strokeWidth="0.5"/>
                {/* Title area */}
                <rect x="45" y="95" width="90" height="30" fill="rgba(255,0,0,0.03)" stroke="rgba(255,0,0,0.1)" strokeWidth="0.5"/>
                <text x="90" y="107" fontFamily="Courier New" fontSize="7" fill="rgba(255,200,0,0.3)"
                    textAnchor="middle" letterSpacing="1">DER KÖNIG</text>
                <text x="90" y="118" fontFamily="Courier New" fontSize="7" fill="rgba(255,200,0,0.2)"
                    textAnchor="middle" letterSpacing="1">IN GELB</text>
                {/* Damage */}
                <polygon points="30,15 50,15 30,35" fill="rgba(0,0,0,0.7)"/>
                <polygon points="150,170 150,150 130,170" fill="rgba(0,0,0,0.6)"/>
                <text x="90" y="155" fontFamily="Courier New" fontSize="5" fill="rgba(255,0,0,0.15)"
                    textAnchor="middle" letterSpacing="0.5">[ SEITEN FEHLEN ]</text>
            </svg>
        ),
    },
};

/* ----------------------------------------------------------------
   Back-side SVG content
   ---------------------------------------------------------------- */
function BackSideContent({ item }) {
    return (
        <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="160" height="160" fill="#050000" stroke="rgba(255,0,0,0.3)" strokeWidth="0.8"/>
            {[40, 55, 70, 85, 100, 115, 130].map((y) => (
                <line key={y} x1="20" y1={y} x2="160" y2={y} stroke="rgba(255,0,0,0.07)" strokeWidth="0.5"/>
            ))}
            <text x="90" y="32" fontFamily="Courier New" fontSize="7"
                fill="rgba(255,0,0,0.3)" textAnchor="middle" letterSpacing="2">— RÜCKSEITE —</text>
            {item.backText.split('\n').map((line, i) => (
                <text key={i} x="90" y={62 + i * 22} fontFamily="Courier New" fontSize="12"
                    fill="#ff0000" textAnchor="middle" letterSpacing="1">{line}</text>
            ))}
            <text x="90" y="148" fontFamily="Courier New" fontSize="7"
                fill="rgba(255,255,255,0.2)" textAnchor="middle" letterSpacing="1">{item.backSub}</text>
        </svg>
    );
}

/* ----------------------------------------------------------------
   Typewriter hook
   ---------------------------------------------------------------- */
function useTypewriter(text, speed = 18, active = true) {
    const [displayed, setDisplayed] = useState('');
    useEffect(() => {
        if (!active) { setDisplayed(text); return; }
        setDisplayed('');
        let i = 0;
        const id = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) clearInterval(id);
        }, speed);
        return () => clearInterval(id);
    }, [text, active]);
    return displayed;
}

/* ----------------------------------------------------------------
   Main component
   ---------------------------------------------------------------- */
export default function ItemInspectModal() {
    const { inspectingItem, closeInspect, resetQuest } = useQuest();
    const viewerRef = useRef(null);
    const [rotateX, setRotateX] = useState(0);
    const [isGlitch, setIsGlitch] = useState(false);

    const showBack = Math.abs(rotateX) > 0.5;
    const scaleX = 1 - Math.abs(rotateX) * 0.35;
    const skewDeg = rotateX * 25;

    const item = ITEMS[inspectingItem];
    const typedDesc = useTypewriter(item?.desc || '', 16, !!inspectingItem);

    const handleMouseMove = useCallback((e) => {
        if (!viewerRef.current) return;
        const rect = viewerRef.current.getBoundingClientRect();
        setRotateX((e.clientX - rect.left) / rect.width * 2 - 1);
    }, []);

    const handleMouseLeave = useCallback(() => setRotateX(0), []);

    useEffect(() => {
        if (!inspectingItem) return;
        const id = setInterval(() => {
            setIsGlitch(true);
            setTimeout(() => setIsGlitch(false), 150);
        }, 4000 + Math.random() * 3000);
        return () => clearInterval(id);
    }, [inspectingItem]);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') closeInspect(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [closeInspect]);

    if (!inspectingItem || !item) return null;

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    return (
        <div className={styles.overlay} onClick={closeInspect} role="dialog" aria-modal="true" aria-label="Item inspection">
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.headerTitle}>
                        GEGENSTAND PRÜFEN // ITEM-{String(inspectingItem).padStart(2, '0')}
                    </span>
                    <div className={styles.headerControls}>
                        <button className={styles.btnReset} onClick={resetQuest} title="Protokoll zurücksetzen" aria-label="Reset quest">
                            [PROTOKOLL ZURÜCKSETZEN]
                        </button>
                        <button className={styles.btnClose} onClick={closeInspect} aria-label="Close">
                            [SCHLIESSEN]
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {/* Viewer */}
                    <div
                        className={styles.viewer}
                        ref={viewerRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        aria-hidden="true"
                    >
                        {/* Front */}
                        <div
                            className={`${styles.itemImage} ${isGlitch ? styles.glitch : ''}`}
                            style={{
                                transform: `scaleX(${showBack ? -scaleX : scaleX}) skewY(${skewDeg * 0.1}deg)`,
                                opacity: showBack ? 0 : 1,
                                transition: 'opacity 0.08s',
                            }}
                        >
                            {item.svgContent}
                        </div>
                        {/* Back */}
                        <div
                            className={styles.itemImage}
                            style={{
                                position: 'absolute',
                                transform: `scaleX(${showBack ? scaleX : -scaleX})`,
                                opacity: showBack ? 1 : 0,
                                transition: 'opacity 0.08s',
                            }}
                        >
                            <BackSideContent item={item} />
                        </div>
                        <span className={styles.viewerHint}>
                            {showBack ? '[ RÜCKSEITE ]' : '← DREHEN →'}
                        </span>
                    </div>

                    {/* Info */}
                    <div className={styles.info}>
                        <h2 className={styles.itemName}>{item.name}</h2>
                        <span className={styles.itemId}>{item.id} // STUFE-{inspectingItem}</span>
                        <p className={styles.itemDesc}>
                            {typedDesc}
                            <span className={styles.cursor}>█</span>
                        </p>
                        <div className={styles.itemHint}>
                            <span className={styles.hintLabel}>// SYSTEMNOTIZ</span>
                            {item.hint}
                        </div>
                    </div>
                </div>

                {/* Status bar */}
                <div className={styles.statusBar}>
                    <span>BAROLAB SYSTEMS // INVENTARMODUL v2.4</span>
                    <span>{now}</span>
                </div>
            </div>
        </div>
    );
}
