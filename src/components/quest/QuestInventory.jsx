import { useQuest } from '../../context/QuestContext';
import styles from './QuestInventory.module.css';

const SLOT_ICONS = ['◈', '◈', '◈'];

export default function QuestInventory() {
    const { stage, openInspect, openTerminal } = useQuest();

    if (stage < 1) return null;

    const isReady = stage >= 3;

    const handleInventoryClick = () => {
        if (isReady) {
            openTerminal();
        }
    };

    const handleSlotClick = (e, slotIndex) => {
        // slotIndex is 0-based; item numbers are 1-based
        const itemNumber = slotIndex + 1;
        if (itemNumber <= stage) {
            e.stopPropagation();
            if (isReady) {
                // clicking any slot when ready opens terminal
                openTerminal();
            } else {
                openInspect(itemNumber);
            }
        }
    };

    return (
        <div
            className={`${styles.inventory} ${isReady ? styles.inventoryReady : ''}`}
            onClick={handleInventoryClick}
            title={isReady ? 'ПРОТОКОЛ ГОТОВ — активировать терминал' : 'Инвентарь'}
            role="button"
            tabIndex={isReady ? 0 : -1}
            onKeyDown={(e) => e.key === 'Enter' && isReady && openTerminal()}
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
                        tabIndex={filled && !isReady ? 0 : -1}
                        onKeyDown={(e) => e.key === 'Enter' && handleSlotClick(e, i)}
                        aria-label={filled ? `Item ${i + 1}` : 'Empty slot'}
                    >
                        {filled ? icon : '·'}
                    </span>
                );
            })}
        </div>
    );
}
