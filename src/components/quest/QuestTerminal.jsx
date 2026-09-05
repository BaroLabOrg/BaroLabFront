import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuest } from '../../context/QuestContext';
import styles from './QuestTerminal.module.css';

const CORRECT_PROTOCOL = '512';
const CORRECT_FREQ = '240.0';

export default function QuestTerminal() {
    const { terminalOpen, closeTerminal, resetQuest } = useQuest();
    const navigate = useNavigate();

    const [protocol, setProtocol] = useState('');
    const [freq, setFreq] = useState('');
    const [status, setStatus] = useState(null); // null | 'error' | 'success'
    const [submitting, setSubmitting] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    // Reset fields when opened
    useEffect(() => {
        if (terminalOpen) {
            setProtocol('');
            setFreq('');
            setStatus(null);
            setSubmitting(false);
            setShowHint(false);
            setConfirmReset(false);
        }
    }, [terminalOpen]);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape' && !submitting) {
                if (confirmReset) {
                    setConfirmReset(false);
                } else {
                    closeTerminal();
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [closeTerminal, submitting, confirmReset]);

    if (!terminalOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const protocolOk = protocol.trim() === CORRECT_PROTOCOL;
        const freqOk = freq.trim() === CORRECT_FREQ;

        if (protocolOk && freqOk) {
            setStatus('success');
            setSubmitting(true);
            setTimeout(() => {
                navigate('/promise');
            }, 2200);
        } else {
            setStatus('error');
            setTimeout(() => setStatus(null), 2500);
        }
    };

    const handleReset = () => {
        if (!confirmReset) {
            setConfirmReset(true);
            return;
        }
        resetQuest();
        closeTerminal();
    };

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    return (
        <div
            className={styles.overlay}
            onClick={!submitting ? closeTerminal : undefined}
            role="dialog"
            aria-modal="true"
            aria-label="Final terminal"
        >
            <div className={styles.terminal} onClick={(e) => e.stopPropagation()}>
                {/* Title bar */}
                <div className={styles.titleBar}>
                    <span className={styles.titleText}>
                        SYNCHRONICITY TERMINAL // ACTIVATION PROTOCOL
                    </span>
                    {!submitting && (
                        <button className={styles.btnClose} onClick={closeTerminal} aria-label="Close terminal">
                            [ESC]
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {/* Boot lines */}
                    <div className={styles.bootLines}>
                        <span className={styles.bootLine}>{'>'} BAROLAB DEEP SYSTEMS v5.1.2</span>
                        <span className={styles.bootLine}>{'>'} INITIATING SYNCHRONICITY PROTOCOL...</span>
                        <span className={styles.bootLine}>{'>'} DREI GEGENSTÄNDE GEFUNDEN. BEREIT.</span>
                        <span className={styles.bootLine}>{'>'} AWAITING AUTHORIZATION CODES<span className={styles.cursor} /></span>
                    </div>

                    <hr className={styles.divider} />

                    <p className={styles.prompt}>
                        Enter the codes found on the items:{' '}
                        <span className={styles.promptHighlight}>Protocol</span> and{' '}
                        <span className={styles.promptHighlight}>Frequency</span>.
                    </p>

                    {/* Input form */}
                    <form className={styles.fields} onSubmit={handleSubmit}>
                        <div className={styles.fieldRow}>
                            <label className={styles.fieldLabel} htmlFor="q-protocol">
                                PROTOKOLL NR.:
                            </label>
                            <input
                                id="q-protocol"
                                className={styles.fieldInput}
                                type="text"
                                value={protocol}
                                onChange={(e) => setProtocol(e.target.value)}
                                placeholder="___"
                                maxLength={10}
                                autoComplete="off"
                                disabled={submitting}
                                aria-label="Protocol code"
                            />
                        </div>
                        <div className={styles.fieldRow}>
                            <label className={styles.fieldLabel} htmlFor="q-freq">
                                FREQUENZ (MHz):
                            </label>
                            <input
                                id="q-freq"
                                className={styles.fieldInput}
                                type="text"
                                value={freq}
                                onChange={(e) => setFreq(e.target.value)}
                                placeholder="___._"
                                maxLength={10}
                                autoComplete="off"
                                disabled={submitting}
                                aria-label="Frequency code"
                            />
                        </div>

                        {status === 'error' && (
                            <div className={styles.statusError} role="alert">
                                [SYNCHRONICITY FAILED] — INVALID CODES. TRY AGAIN.
                            </div>
                        )}

                        {status === 'success' && (
                            <div className={styles.statusSuccess} role="status">
                                [ACHTUNG: PROTOCOL COMPLETE]<br />
                                SYNCHRONICITY ESTABLISHED — SIGNAL TRANSFER...
                            </div>
                        )}

                        {!submitting && (
                            <button
                                type="submit"
                                className={styles.btnSubmit}
                                disabled={!protocol.trim() || !freq.trim()}
                            >
                                [SYNCHRONIZE]
                            </button>
                        )}
                    </form>

                    {/* Hint toggle */}
                    {!submitting && (
                        <div className={styles.hintSection}>
                            <button
                                className={styles.btnHint}
                                onClick={() => setShowHint((v) => !v)}
                                aria-expanded={showHint}
                            >
                                {showHint ? '[ HIDE HINT ]' : '[ FORGOT THE CODES? ]'}
                            </button>
                            {showHint && (
                                <div className={styles.hintBox} role="note">
                                    <span className={styles.hintLine}>
                                        {'>'} The codes are written on the reverse of the items.
                                    </span>
                                    <span className={styles.hintLine}>
                                        {'>'} Select an inventory slot to inspect an item.
                                    </span>
                                    <span className={styles.hintLine}>
                                        {'>'} Use FLIP ITEM to read the reverse.
                                    </span>
                                    <span className={`${styles.hintLine} ${styles.hintSpoiler}`}>
                                        {'>'} PROTOKOLL: <span className={styles.spoilerText}>512</span>
                                        {'  '}FREQUENZ: <span className={styles.spoilerText}>240.0</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Status bar with reset button */}
                <div className={styles.statusBar}>
                    <span>DEEP SYSTEMS // SYNC MODULE</span>
                    <span>{now}</span>
                    {!submitting && (
                        <button
                            className={`${styles.btnReset} ${confirmReset ? styles.btnResetConfirm : ''}`}
                            onClick={handleReset}
                            title="Reset quest progress"
                        >
                            {confirmReset ? '[CONFIRM RESET]' : '[RESET]'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
