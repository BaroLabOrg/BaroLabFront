import { useQuest } from '../../context/QuestContext';
import styles from './QuestOnboarding.module.css';

/**
 * Shown when the user clicks the glitched "Back" button on /mods (stage === 0).
 * Controlled externally: pass `open` and `onConfirm` / `onCancel`.
 */
export default function QuestOnboarding({ open, onConfirm, onCancel }) {
    if (!open) return null;

    return (
        <div className={styles.overlay} onClick={onCancel} role="dialog" aria-modal="true" aria-label="Anomaly detected">
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <span className={styles.icon}>⚠</span>
                    <span className={styles.title}>СИСТЕМНОЕ ПРЕДУПРЕЖДЕНИЕ</span>
                </div>
                <div className={styles.body}>
                    <p className={styles.message}>
                        <span className={styles.highlight}>ВНИМАНИЕ: ОБНАРУЖЕНА АНОМАЛИЯ.</span>
                        <br /><br />
                        Навигационный модуль зафиксировал нестандартный сигнал
                        в секторе пагинации. Источник неизвестен.
                        <br /><br />
                        Запустить <span className={styles.highlight}>дешифровку</span>?
                    </p>
                    <div className={styles.actions}>
                        <button className={styles.btn} onClick={onCancel} aria-label="Cancel">
                            [ОТМЕНА]
                        </button>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onConfirm} aria-label="Confirm">
                            [ДА]
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
