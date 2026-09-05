import { useEffect, useRef, useState } from 'react';
import { useQuest } from '../../context/QuestContext';
import QuestItemArtwork from './QuestItemArtwork';
import { QUEST_ITEMS } from './questItems';
import styles from './ItemInspectModal.module.css';

function Inspection({ item, itemNumber, stage, closeInspect, openInspect }) {
    const [flipped, setFlipped] = useState(false);
    const panel = useRef(null);
    const closeButton = useRef(null);

    useEffect(() => {
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButton.current?.focus();
        const handleKey = event => {
            if (event.key === 'Escape') { event.preventDefault(); closeInspect(); }
            if (event.key !== 'Tab') return;
            const buttons = panel.current?.querySelectorAll('button:not(:disabled)');
            if (!buttons?.length) return;
            const first = buttons[0];
            const last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKey);
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [closeInspect]);

    return (
        <div className={styles.overlay} onClick={closeInspect}>
            <section ref={panel} className={styles.modal} role="dialog" aria-modal="true" aria-label="Item inspection" onClick={event => event.stopPropagation()}>
                <header className={styles.header}>
                    <span className={styles.unit}>LSTR</span>
                    <span className={styles.headerTitle}>ОСМОТР ПРЕДМЕТА</span>
                    <button ref={closeButton} className={styles.close} onClick={closeInspect} aria-label="Close">ЗАКРЫТЬ <kbd>ESC</kbd></button>
                </header>
                <div className={styles.body}>
                    <div className={styles.viewer} data-testid="item-viewer">
                        <div className={styles.viewerMeta}><span>{item.designation}</span><span>{flipped ? 'ОБОРОТ' : 'ЛИЦЕВАЯ СТОРОНА'}</span></div>
                        <div className={styles.objectStage}><QuestItemArtwork type={item.type} flipped={flipped} /></div>
                        <div className={styles.viewerActions}>
                            <span className={styles.sideIndicator} aria-hidden="true"><i className={!flipped ? styles.selectedSide : ''} /><i className={flipped ? styles.selectedSide : ''} /></span>
                            <button className={styles.flip} aria-label="Перевернуть предмет" aria-pressed={flipped} onClick={() => setFlipped(value => !value)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 9a8 8 0 0 1 14-3l2 3M20 3v6h-6M20 15a8 8 0 0 1-14 3l-2-3M4 21v-6h6" /></svg>
                                {flipped ? 'НА ЛИЦЕВУЮ СТОРОНУ' : 'ПЕРЕВЕРНУТЬ'}
                            </button>
                        </div>
                    </div>
                    <div className={styles.info}>
                        <h2 className={styles.itemName}>{item.name}</h2>
                        <div className={styles.reading} aria-live="polite">
                            <p className={styles.description}>{flipped ? item.backDescription : item.description}</p>
                            {flipped && <div className={styles.note}><p className={styles.clue}>{item.clue}</p><p className={styles.hint}>{item.hint}</p></div>}
                        </div>
                        <div className={styles.collection} aria-label="Найденные предметы">
                            {Object.entries(QUEST_ITEMS).map(([number, entry]) => {
                                const collected = Number(number) <= stage;
                                return <button key={number} className={`${styles.itemSlot} ${Number(number) === itemNumber ? styles.activeSlot : ''}`} disabled={!collected} aria-label={collected ? `Осмотреть: ${entry.name}` : 'Предмет не найден'} aria-pressed={Number(number) === itemNumber} onClick={() => openInspect(Number(number))}>
                                    <span className={styles.slotArtwork}>{collected ? <QuestItemArtwork type={entry.type} thumbnail /> : <span className={styles.emptySlot}>—</span>}</span>
                                    <span>{collected ? entry.shortName : 'НЕ НАЙДЕН'}</span>
                                </button>;
                            })}
                        </div>
                    </div>
                </div>
                <footer className={styles.statusBar}><span>{item.condition}</span><span>ПРЕДМЕТ {String(itemNumber).padStart(2, '0')} / 03</span></footer>
            </section>
        </div>
    );
}

export default function ItemInspectModal() {
    const quest = useQuest();
    const item = QUEST_ITEMS[quest.inspectingItem];
    if (!item) return null;
    return <Inspection key={quest.inspectingItem} item={item} itemNumber={quest.inspectingItem} {...quest} />;
}
