import { useEffect, useRef } from 'react';
import styles from './QuestItemArtwork.module.css';

const PIXEL_FACES = {
    card: { src: '/quest/adler-pass-sides.png', width: 192, height: 123 },
    radio: { src: '/quest/radio-sides.png', width: 224, height: 224 },
};

// A fixed low-resolution buffer makes pixels visible even on high-DPI displays.
function PixelFace({ type, back = false }) {
    const canvas = useRef(null);
    const { src, width, height } = PIXEL_FACES[type];

    useEffect(() => {
        const texture = new Image();
        texture.onload = () => {
            const context = canvas.current?.getContext('2d');
            if (!context) return;
            const frameWidth = texture.naturalWidth / 2;
            // The generated pass has a black presentation margin around each face.
            const crop = type === 'card' ? [.008, .12, .984, .76] : [0, 0, 1, 1];
            context.clearRect(0, 0, width, height);
            context.imageSmoothingEnabled = false;
            context.drawImage(texture, (back ? frameWidth : 0) + frameWidth * crop[0], texture.naturalHeight * crop[1], frameWidth * crop[2], texture.naturalHeight * crop[3], 0, 0, width, height);
            if (!back) return;
            context.save();
            if (type === 'card') {
                context.translate(width * .22, height * .64);
                context.rotate(-5 * Math.PI / 180);
                context.fillStyle = '#301f16';
                context.font = 'bold 8px "Courier New", monospace';
                context.fillText('ARCHIV', 0, -5);
                context.fillText('HOME / BUILD', 0, 6);
            } else {
                context.translate(width * .17, height * .49);
                context.rotate(-4 * Math.PI / 180);
                context.fillStyle = '#aca389';
                context.fillRect(0, 0, 62, 22);
                context.fillStyle = '#181810';
                context.font = 'bold 6px "Courier New", monospace';
                context.fillText('SIGNALQUELLE', 4, 9);
                context.fillText('SEKTOR 404', 4, 17);
            }
            context.restore();
        };
        texture.src = src;
        return () => { texture.onload = null; };
    }, [src, width, height, type, back]);

    return <canvas ref={canvas} width={width} height={height} className={styles.pixelFace}
        style={{ backgroundImage: `url('${src}')`, backgroundPosition: back ? '100% 0' : '0 0' }} />;
}

export default function QuestItemArtwork({ type, flipped = false, thumbnail = false }) {
    return (
        <div className={`${styles.artwork} ${styles[type]} ${thumbnail ? styles.thumbnail : ''}`} aria-hidden="true">
            <div className={`${styles.object} ${flipped ? styles.flipped : ''}`}>
                <div className={`${styles.face} ${styles.front}`}>
                    {type === 'card' && <PixelFace type="card" />}
                    {type === 'book' && <img src="/quest/king-in-yellow.png" alt="" draggable="false" />}
                    {type === 'radio' && <PixelFace type="radio" />}
                </div>
                <div className={`${styles.face} ${styles.back}`}>
                    {type === 'card' && <PixelFace type="card" back />}
                    {type === 'book' && <div className={styles.bookBack}>
                        <span className={styles.bookWriting}>Protokoll: 512<br />Frequenz: 240.0</span>
                        <span className={styles.bookPromise}>REMEMBER<br />OUR PROMISE</span>
                    </div>}
                    {type === 'radio' && <PixelFace type="radio" back />}
                </div>
                {type === 'book' && <div className={styles.spine}>黄衣ノ王</div>}
            </div>
        </div>
    );
}
