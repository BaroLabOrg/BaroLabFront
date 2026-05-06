import { useRef, useState, useEffect, useCallback } from 'react';
import { useQuest } from '../../context/QuestContext';
import styles from './ItemInspectModal.module.css';

/* ----------------------------------------------------------------
   Item data — SVG illustrations + descriptions + back-side hints
   ---------------------------------------------------------------- */
const ITEMS = {
    1: {
        name: 'ПОВРЕЖДЕННАЯ КЛЮЧ-КАРТА',
        id: 'ITEM-KY-404',
        desc: `Магнитная полоса частично размагничена.
Идентификационный чип — нечитаем.
Последняя авторизация: [ДАННЫЕ УДАЛЕНЫ]

Карта выдана сотруднику уровня доступа Ω.
Статус: АННУЛИРОВАНА`,
        hint: 'Сектор 404',
        backText: 'СЕКТОР 404',
        backSub: '[ ДОСТУП ОГРАНИЧЕН ]',
        // SVG path data for a keycard
        svgContent: (
            <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="55" width="140" height="90" rx="6" fill="#111" stroke="#ff0000" strokeWidth="1.5"/>
                <rect x="20" y="55" width="140" height="22" rx="6" fill="#1a0000"/>
                <rect x="20" y="66" width="140" height="11" fill="#220000"/>
                <rect x="30" y="88" width="60" height="8" rx="2" fill="#1e1e1e" stroke="rgba(255,0,0,0.3)" strokeWidth="0.5"/>
                <rect x="30" y="100" width="40" height="4" rx="1" fill="rgba(255,0,0,0.15)"/>
                <rect x="30" y="108" width="55" height="4" rx="1" fill="rgba(255,0,0,0.1)"/>
                <rect x="30" y="116" width="30" height="4" rx="1" fill="rgba(255,0,0,0.08)"/>
                <rect x="130" y="88" width="20" height="20" rx="2" fill="#0d0d0d" stroke="rgba(255,0,0,0.4)" strokeWidth="0.8"/>
                <line x1="130" y1="98" x2="150" y2="98" stroke="rgba(255,0,0,0.2)" strokeWidth="0.5"/>
                <line x1="140" y1="88" x2="140" y2="108" stroke="rgba(255,0,0,0.2)" strokeWidth="0.5"/>
                {/* Damage scratches */}
                <line x1="45" y1="60" x2="80" y2="72" stroke="rgba(255,0,0,0.4)" strokeWidth="0.8" strokeDasharray="3,2"/>
                <line x1="90" y1="58" x2="110" y2="75" stroke="rgba(255,0,0,0.3)" strokeWidth="0.6" strokeDasharray="2,3"/>
                <text x="30" y="82" fontFamily="Courier New" fontSize="7" fill="rgba(255,0,0,0.5)" letterSpacing="1">BAROLAB SYSTEMS</text>
                <text x="30" y="135" fontFamily="Courier New" fontSize="6" fill="rgba(255,0,0,0.25)" letterSpacing="0.5">ID: [CORRUPTED]</text>
            </svg>
        ),
    },
    2: {
        name: 'СЛОМАННЫЙ РАДИОМОДУЛЬ',
        id: 'ITEM-RD-512',
        desc: `Портативный приёмопередатчик серии RD-7.
Антенна сломана. Корпус оплавлен.
Последний принятый сигнал: [ЗАШИФРОВАНО]

Частота настройки сохранена в памяти.
Батарея: 3%`,
        hint: 'Сигнал в основании / Версия сборки',
        backText: 'FREQ: 240.0 MHz',
        backSub: 'BUILD: v5.1.2',
        svgContent: (
            <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
                <rect x="35" y="40" width="110" height="100" rx="4" fill="#0d0d0d" stroke="#ff0000" strokeWidth="1.5"/>
                {/* Screen */}
                <rect x="45" y="50" width="70" height="40" rx="2" fill="#050505" stroke="rgba(255,0,0,0.4)" strokeWidth="0.8"/>
                <text x="50" y="68" fontFamily="Courier New" fontSize="8" fill="rgba(255,0,0,0.6)" letterSpacing="1">240.0 MHz</text>
                <text x="50" y="80" fontFamily="Courier New" fontSize="6" fill="rgba(255,0,0,0.3)" letterSpacing="0.5">SIGNAL: ---</text>
                {/* Broken antenna */}
                <line x1="120" y1="50" x2="130" y2="20" stroke="rgba(255,0,0,0.5)" strokeWidth="1.5"/>
                <line x1="130" y1="20" x2="145" y2="35" stroke="rgba(255,0,0,0.3)" strokeWidth="1" strokeDasharray="3,2"/>
                {/* Buttons */}
                <circle cx="50" cy="110" r="5" fill="#111" stroke="rgba(255,0,0,0.4)" strokeWidth="0.8"/>
                <circle cx="65" cy="110" r="5" fill="#111" stroke="rgba(255,0,0,0.4)" strokeWidth="0.8"/>
                <circle cx="80" cy="110" r="5" fill="#1a0000" stroke="rgba(255,0,0,0.6)" strokeWidth="0.8"/>
                {/* Dial */}
                <circle cx="120" cy="105" r="14" fill="#0d0d0d" stroke="rgba(255,0,0,0.35)" strokeWidth="1"/>
                <line x1="120" y1="105" x2="120" y2="93" stroke="rgba(255,0,0,0.5)" strokeWidth="1.5"/>
                {/* Burn mark */}
                <ellipse cx="90" cy="130" rx="20" ry="8" fill="rgba(255,0,0,0.06)" stroke="rgba(255,0,0,0.15)" strokeWidth="0.5"/>
                <text x="75" y="133" fontFamily="Courier New" fontSize="5" fill="rgba(255,0,0,0.2)">THERMAL DAMAGE</text>
            </svg>
        ),
    },
    3: {
        name: 'СТАРАЯ ФОТОГРАФИЯ',
        id: 'ITEM-PH-001',
        desc: `Выцветший снимок на фотобумаге.
Изображение почти неразличимо.
На обороте — карандашная надпись.

Дата: [НЕИЗВЕСТНО]
Субъект: [НЕИЗВЕСТНО]`,
        hint: 'Переверни — там написано',
        backText: 'ПРОТОКОЛ: 512\nЧАСТОТА: 240.0',
        backSub: '[ ПОМНИ ]',
        svgContent: (
            <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
                {/* Photo border */}
                <rect x="25" y="20" width="130" height="140" fill="#0e0c0c" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                <rect x="30" y="25" width="120" height="110" fill="#080808"/>
                {/* Faded image — abstract silhouette */}
                <ellipse cx="90" cy="65" rx="20" ry="22" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
                <rect x="65" y="85" width="50" height="40" rx="2" fill="rgba(255,255,255,0.04)"/>
                {/* Noise/grain */}
                <rect x="30" y="25" width="120" height="110"
                    fill="url(#grain)" opacity="0.3"/>
                <defs>
                    <filter id="grain">
                        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
                        <feColorMatrix type="saturate" values="0"/>
                    </filter>
                </defs>
                {/* Vignette */}
                <rect x="30" y="25" width="120" height="110"
                    fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth="15"/>
                {/* Caption area */}
                <rect x="25" y="135" width="130" height="25" fill="#0a0808"/>
                <text x="90" y="151" fontFamily="Courier New" fontSize="7" fill="rgba(255,255,255,0.15)"
                    textAnchor="middle" letterSpacing="1">[ CLASSIFIED ]</text>
                {/* Corner damage */}
                <polygon points="25,20 45,20 25,40" fill="rgba(0,0,0,0.6)"/>
                <polygon points="155,160 155,140 135,160" fill="rgba(0,0,0,0.5)"/>
            </svg>
        ),
    },
};

/* ----------------------------------------------------------------
   Back-side SVG content (shown when rotated past center)
   ---------------------------------------------------------------- */
function BackSideContent({ item }) {
    return (
        <svg viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="160" height="160" fill="#050505" stroke="rgba(255,0,0,0.3)" strokeWidth="0.8"/>
            {/* Lined paper effect */}
            {[40, 55, 70, 85, 100, 115, 130].map((y) => (
                <line key={y} x1="20" y1={y} x2="160" y2={y} stroke="rgba(255,0,0,0.08)" strokeWidth="0.5"/>
            ))}
            <text x="90" y="35" fontFamily="Courier New" fontSize="8"
                fill="rgba(255,0,0,0.3)" textAnchor="middle" letterSpacing="2">— ОБОРОТ —</text>
            {item.backText.split('\n').map((line, i) => (
                <text key={i} x="90" y={65 + i * 20} fontFamily="Courier New" fontSize="13"
                    fill="#ff0000" textAnchor="middle" letterSpacing="1">{line}</text>
            ))}
            <text x="90" y="145" fontFamily="Courier New" fontSize="8"
                fill="rgba(255,255,255,0.2)" textAnchor="middle" letterSpacing="1">{item.backSub}</text>
        </svg>
    );
}

/* ----------------------------------------------------------------
   Main component
   ---------------------------------------------------------------- */
export default function ItemInspectModal() {
    const { inspectingItem, closeInspect, resetQuest } = useQuest();
    const viewerRef = useRef(null);
    const [rotateX, setRotateX] = useState(0); // -1 to 1 normalized
    const [isGlitch, setIsGlitch] = useState(false);

    // rotateX in range [-1, 1]; past ±0.5 = back side visible
    const showBack = Math.abs(rotateX) > 0.5;
    // Map to CSS skewX for pseudo-3D feel
    const skewDeg = rotateX * 25;
    const scaleX = 1 - Math.abs(rotateX) * 0.35;

    const item = ITEMS[inspectingItem];

    const handleMouseMove = useCallback((e) => {
        if (!viewerRef.current) return;
        const rect = viewerRef.current.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width; // 0..1
        setRotateX(relX * 2 - 1); // -1..1
    }, []);

    const handleMouseLeave = useCallback(() => {
        setRotateX(0);
    }, []);

    // Occasional glitch on the item
    useEffect(() => {
        if (!inspectingItem) return;
        const interval = setInterval(() => {
            setIsGlitch(true);
            setTimeout(() => setIsGlitch(false), 150);
        }, 4000 + Math.random() * 3000);
        return () => clearInterval(interval);
    }, [inspectingItem]);

    // Close on Escape
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
                        ОСМОТР ПРЕДМЕТА // ITEM-{inspectingItem.toString().padStart(2, '0')}
                    </span>
                    <div className={styles.headerControls}>
                        <button
                            className={styles.btnReset}
                            onClick={resetQuest}
                            title="Сброс протокола"
                            aria-label="Reset quest"
                        >
                            [СБРОС ПРОТОКОЛА]
                        </button>
                        <button
                            className={styles.btnClose}
                            onClick={closeInspect}
                            aria-label="Close"
                        >
                            [ЗАКРЫТЬ]
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
                        {/* Front face */}
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

                        {/* Back face */}
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
                            {showBack ? '[ ОБОРОТ ]' : '← ВРАЩАТЬ →'}
                        </span>
                    </div>

                    {/* Info */}
                    <div className={styles.info}>
                        <h2 className={styles.itemName}>{item.name}</h2>
                        <span className={styles.itemId}>{item.id} // STAGE-{inspectingItem}</span>
                        <p className={styles.itemDesc}>{item.desc}</p>
                        <div className={styles.itemHint}>
                            <span className={styles.hintLabel}>// СИСТЕМНАЯ ЗАМЕТКА</span>
                            {item.hint}
                        </div>
                    </div>
                </div>

                {/* Status bar */}
                <div className={styles.statusBar}>
                    <span>BAROLAB SYSTEMS // INVENTORY MODULE v2.4</span>
                    <span>{now}</span>
                </div>
            </div>
        </div>
    );
}
