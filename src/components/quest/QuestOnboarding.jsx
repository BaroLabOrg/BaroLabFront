import { useEffect, useRef } from 'react';
import styles from './QuestOnboarding.module.css';

// The glitched Back control offers entry into the local quest.
export default function QuestOnboarding({ open, onConfirm, onCancel }) {
    const cancelButton = useRef(null);
    const confirmButton = useRef(null);

    useEffect(() => {
        if (!open) return;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        cancelButton.current?.focus();
        const handleKey = event => {
            if (event.key === 'Escape') { event.preventDefault(); onCancel(); }
            if (event.key !== 'Tab') return;
            if (event.shiftKey && document.activeElement === cancelButton.current) {
                event.preventDefault(); confirmButton.current?.focus();
            } else if (!event.shiftKey && document.activeElement === confirmButton.current) {
                event.preventDefault(); cancelButton.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = previousOverflow;
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <section className={styles.dialog} onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Anomaly detected" aria-describedby="quest-signal-description">
                <header className={styles.header}>
                    <span className={styles.unit}>LSTR</span>
                    <span className={styles.warning}>ACHTUNG</span>
                </header>
                <div className={styles.body}>
                    <h2 className={styles.title}>SIGNAL DETECTED</h2>
                    <div id="quest-signal-description" className={styles.message}>
                        <p>An unidentified transmission has interrupted navigation.</p>
                        <p>There is something here that should not be.</p>
                    </div>
                    <p className={styles.prompt}>Trace the signal?</p>
                    <div className={styles.actions}>
                        <button ref={cancelButton} className={styles.btn} onClick={onCancel}>DISMISS</button>
                        <button ref={confirmButton} className={`${styles.btn} ${styles.btnPrimary}`} onClick={onConfirm}>TRACE SIGNAL</button>
                    </div>
                </div>
                <footer className={styles.status}>SIGNAL SOURCE / UNKNOWN</footer>
            </section>
        </div>
    );
}
