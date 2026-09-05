import styles from './QuestItemArtwork.module.css';

export default function QuestItemArtwork({ type, flipped = false, thumbnail = false }) {
    return (
        <div className={`${styles.artwork} ${styles[type]} ${thumbnail ? styles.thumbnail : ''}`} aria-hidden="true">
            <div className={`${styles.object} ${flipped ? styles.flipped : ''}`}>
                <div className={`${styles.face} ${styles.front}`}>
                    {type === 'card' && <img src="/quest/adler-pass-front.png" alt="" draggable="false" />}
                    {type === 'book' && <img src="/quest/king-in-yellow.png" alt="" draggable="false" />}
                    {type === 'radio' && <span className={styles.radioFront} />}
                </div>
                <div className={`${styles.face} ${styles.back}`}>
                    {type === 'card' && <>
                        <img src="/quest/adler-pass-back.png" alt="" draggable="false" />
                        <span className={styles.cardWriting}>SEKTOR 404</span>
                    </>}
                    {type === 'book' && <div className={styles.bookBack}>
                        <span className={styles.bookWriting}>Protokoll: 512<br />Frequenz: 240.0</span>
                        <span className={styles.bookPromise}>REMEMBER<br />OUR PROMISE</span>
                    </div>}
                    {type === 'radio' && <>
                        <span className={styles.radioBack} />
                        <span className={styles.radioWriting}>SIGNALQUELLE<br />FOOTER / BUILD</span>
                    </>}
                </div>
                {type === 'book' && <div className={styles.spine}>黄衣ノ王</div>}
            </div>
        </div>
    );
}
