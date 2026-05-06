import { useState } from 'react';
import { useQuest } from '../../context/QuestContext';
import styles from './QuestInventory.module.css';

const SLOT_ICONS = ['◈', '◈', '◈'];

export default function QuestInventory() {
    const { stage, openInspect, openTerminal, resetQuest } = useQuest();
    const [confirmReset, setConfirmReset] = useState(false);

    if (stage < 1) return null;

    const isReady = stage >= 3;

    // Click on the INV label or the widget background (not a slot) → open terminal when ready
    const handleWidgetClick = () => {
        if (confirmReset) return; // don't open terminal while confirming reset
        if (isReady) openTerminal();
    };

    // Click on a specific slot → always inspect the item (even at stage 3)
    const handleSlotClick = (e, slotIndex) => {
        e.stopPropagation();
        if (confirmReset) return;
        const itemNumber = slotIndex + 1;
        if (itemNumber <= stage) {
            openInspect(itemNumber);
        }
    };

    const handleResetClick = (e) => {
        e.stopPropagation();
        if (!confirmReset) {
            setConfirmReset(true);
            // Auto-cancel after 4s if no confirmation
            setTimeout(() => setConfirmReset(false), 4000);
        } else {
            resetQuest();
        }
    };

    return (
        <div
            className={`${styles.inventory} ${isReady ? styles.inventoryReady : ''}`}
            onClick={handleWidgetClick}
            title={isReady ? 'Нажмите INV для активации терминала / слот — осмотреть предмет' : 'Инвентарь'}
            role={isReady ? 'button' : undefined}
            tabIndex={isReady ? 0 : -1}
            onKeyDown={(e) => e.key === 'Enter' && isReady && !confirmReset && openTerminal()}
            aria-label="Quest inventory"
        >
            <span className={styles.label}>INV</span>
            {SLOT_ICONS.map((icon, i) => {
                const filled = i < stage;
                return (
                    <span
                        key={i}
                        className={`${styles.slot} ${filled ? styles.slotFilled : ''}`}
                        onClick={(e) => handleSlotClick(e, i)}
                        title={filled ? `Предмет ${i + 1} — осмотреть` : '[ пусто ]'}
                        role={filled ? 'button' : undefined}
                        tabIndex={filled ? 0 : -1}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSlotClick(e, i); }}
                        aria-label={filled ? `Item ${i + 1}` : 'Empty slot'}
                    >
                        {filled ? icon : '·'}
                    </span>
                );
            })}

            {/* Reset button — always visible on hover, two-step confirm */}
            <button
                className={`${styles.btnReset} ${confirmReset ? styles.btnResetConfirm : ''}`}
                onClick={handleResetClick}
                title={confirmReset ? 'Нажмите ещё раз для подтверждения сброса' : 'Сбросить прогресс квеста'}
                aria-label="Reset quest"
            >
                {confirmReset ? '✕?' : '✕'}
            </button>
        </div>
    );
}
