import { useEffect, useRef } from 'react';
import './SeabedSidebars.css';

// ── PRNG ──────────────────────────────────────────────────────────────────────
function makePrng(seed) {
    let s = (seed ^ 0xdeadbeef) >>> 0;
    return () => {
        s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
        return (s >>> 0) / 0xffffffff;
    };
}

// ── Цвета руд ─────────────────────────────────────────────────────────────────
const ORE_CONFIGS = {
    magnetite: { body: '#2a3040', hi: '#3d4a60', glow: null },
    gold:      { body: '#4a3408', hi: '#7a5818', glow: '#c8920a' },
    uranium:   { body: '#0d2a10', hi: '#1a5020', glow: '#22c55e' },
    lead:      { body: '#1c2028', hi: '#2a3040', glow: null },
    silicon:   { body: '#18202e', hi: '#304060', glow: '#4a6080' },
    aluminum:  { body: '#222830', hi: '#384050', glow: null },
};
const ORE_TYPES = Object.keys(ORE_CONFIGS);

const KELP_COLORS = ['#1a4030', '#1e4a38', '#163828', '#224838', '#1c4434', '#1a3a2c', '#204035'];

// ── Рисование кристалла руды ──────────────────────────────────────────────────
function drawOre(ctx, x, y, type, rot, scale) {
    const c = ORE_CONFIGS[type];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.75;

    const pts = [[0,-9],[7,-2],[5,7],[-5,7],[-7,-2]];
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = c.body;
    ctx.fill();
    ctx.strokeStyle = c.hi;
    ctx.lineWidth = 0.9;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(7, -2); ctx.lineTo(1, -1);
    ctx.closePath();
    ctx.fillStyle = c.hi;
    ctx.globalAlpha = 0.4;
    ctx.fill();

    if (c.glow) {
        ctx.globalAlpha = 0.2;
        const grad = ctx.createRadialGradient(0, -1, 0, 0, -1, 5);
        grad.addColorStop(0, c.glow);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, -1, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// ── Рисование камня ───────────────────────────────────────────────────────────
function drawRock(ctx, x, y, variant, rot, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#0e1218';
    ctx.strokeStyle = '#1c2432';
    ctx.lineWidth = 0.8;

    ctx.beginPath();
    if (variant === 0) {
        const p = [[-11,-4],[-4,-12],[7,-10],[13,-3],[10,7],[-1,9],[-11,3]];
        ctx.moveTo(p[0][0], p[0][1]);
        p.slice(1).forEach(([px,py]) => ctx.lineTo(px, py));
        ctx.closePath();
    } else if (variant === 1) {
        ctx.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2);
    } else if (variant === 2) {
        const p = [[-6,5],[-3,-9],[3,-10],[9,-2],[7,5]];
        ctx.moveTo(p[0][0], p[0][1]);
        p.slice(1).forEach(([px,py]) => ctx.lineTo(px, py));
        ctx.closePath();
    } else if (variant === 3) {
        ctx.ellipse(0, 0, 13, 4, 0, 0, Math.PI * 2);
    } else {
        ctx.ellipse(-5, 2, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke(); ctx.beginPath();
        ctx.ellipse(4, 0, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke(); ctx.beginPath();
        ctx.ellipse(0, -3, 3, 2, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

// ── Рисование водоросли ───────────────────────────────────────────────────────
// x, y0 — корень (низ стебля), h — высота вверх
function drawKelp(ctx, x, y0, h, color, sw, dir, phase) {
    const sway = Math.sin(phase) * 3;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.7;

    const top = y0 - h;
    const d = dir;

    ctx.lineWidth = sw;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.bezierCurveTo(
        x + d * (12 + sway), y0 - h * 0.28,
        x - d * (9 - sway * 0.5), y0 - h * 0.62,
        x + d * (7 + sway * 0.3), top
    );
    ctx.stroke();

    const b1y = y0 - h * 0.45;
    const b1x = x + d * 5;
    ctx.lineWidth = sw * 0.6;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(b1x, b1y);
    ctx.quadraticCurveTo(b1x + d * 18, b1y - 16, b1x + d * 14, b1y - 32);
    ctx.stroke();

    const b2y = y0 - h * 0.72;
    const b2x = x - d * 3;
    ctx.lineWidth = sw * 0.5;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(b2x, b2y);
    ctx.quadraticCurveTo(b2x - d * 16, b2y - 12, b2x - d * 12, b2y - 26);
    ctx.stroke();

    ctx.restore();
}

// ── Генерация данных панели ───────────────────────────────────────────────────
// Водоросли растут снизу вверх и сосредоточены в нижней части панели,
// чтобы стыковаться с home-seabed SVG.
// Руды/камни тоже смещены в нижнюю половину.
function buildPanelData(side, seed) {
    const rand = makePrng(seed);
    const isLeft = side === 'left';
    const dir = isLeft ? 1 : -1;
    const kelps = [];
    const items = [];

    // 10 водорослей — равномерно по ширине панели, корни у самого низа
    const kN = 10;
    for (let i = 0; i < kN; i++) {
        const zone = 1 / kN;
        // xFrac — горизонтальное распределение по ширине панели
        const xFrac = (i + 0.5) * zone + (rand() - 0.5) * zone * 0.4;
        kelps.push({
            xFrac:  Math.min(Math.max(xFrac, 0.05), 0.95),
            // yFrac = 1.0 — самый низ панели (корень водоросли)
            yFrac:  0.93 + rand() * 0.06,
            // высота — от 30% до 65% высоты панели
            hFrac:  0.30 + rand() * 0.35,
            color:  KELP_COLORS[Math.floor(rand() * KELP_COLORS.length)],
            sw:     1.5 + rand() * 1.8,
            dir,
            speed:  0.4 + rand() * 0.6,
            offset: rand() * Math.PI * 2,
        });
    }

    // 20 руд/камней — в нижней половине панели
    for (let i = 0; i < 20; i++) {
        const xFrac = 0.06 + rand() * 0.88;
        const yFrac = 0.52 + rand() * 0.44;
        const rot   = rand() * Math.PI * 2;
        const sc    = 0.55 + rand() * 0.75;
        if (rand() > 0.38) {
            items.push({ kind: 'ore', xFrac, yFrac, type: ORE_TYPES[Math.floor(rand() * ORE_TYPES.length)], rot, sc });
        } else {
            items.push({ kind: 'rock', xFrac, yFrac, v: Math.floor(rand() * 5), rot: rot * 0.3, sc: 0.55 + rand() * 0.65 });
        }
    }

    return { kelps, items };
}

const LEFT_DATA  = buildPanelData('left',  42);
const RIGHT_DATA = buildPanelData('right', 137);

// ── Canvas-компонент одной панели ─────────────────────────────────────────────
function SidePanel({ side, data }) {
    const canvasRef = useRef(null);
    const rafRef    = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            canvas.width  = w * dpr;
            canvas.height = h * dpr;
            ctx.scale(dpr, dpr);
        };

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        const draw = (ts) => {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            if (!w || !h) { rafRef.current = requestAnimationFrame(draw); return; }

            ctx.clearRect(0, 0, w, h);

            // ── Руды и камни ──────────────────────────────────────────────
            data.items.forEach(item => {
                const x = item.xFrac * w;
                const y = item.yFrac * h;
                if (item.kind === 'ore') {
                    drawOre(ctx, x, y, item.type, item.rot, item.sc);
                } else {
                    drawRock(ctx, x, y, item.v, item.rot, item.sc);
                }
            });

            // ── Водоросли (анимированные) ─────────────────────────────────
            const t = ts * 0.001;
            data.kelps.forEach(k => {
                const x  = k.xFrac * w;
                const y0 = k.yFrac * h;   // корень у низа
                const kh = k.hFrac * h;   // растут вверх
                const phase = t * k.speed + k.offset;
                drawKelp(ctx, x, y0, kh, k.color, k.sw, k.dir, phase);
            });

            // ── Затухание к центру страницы (горизонтальное) ──────────────
            const isLeft = side === 'left';
            // Левая панель: прозрачно слева, затухает справа (к центру)
            // Правая панель: прозрачно справа, затухает слева (к центру)
            const fadeEdge = ctx.createLinearGradient(isLeft ? 0 : w, 0, isLeft ? w : 0, 0);
            fadeEdge.addColorStop(0,    'rgba(8,10,15,0)');
            fadeEdge.addColorStop(0.45, 'rgba(8,10,15,0)');
            fadeEdge.addColorStop(1,    'rgba(8,10,15,0.92)');
            ctx.fillStyle = fadeEdge;
            ctx.fillRect(0, 0, w, h);

            // ── Затухание сверху — верхние 60% панели почти прозрачны ─────
            const fadeTop = ctx.createLinearGradient(0, 0, 0, h);
            fadeTop.addColorStop(0,    'rgba(8,10,15,0.97)');
            fadeTop.addColorStop(0.40, 'rgba(8,10,15,0.85)');
            fadeTop.addColorStop(0.62, 'rgba(8,10,15,0.4)');
            fadeTop.addColorStop(0.80, 'rgba(8,10,15,0.1)');
            fadeTop.addColorStop(1,    'rgba(8,10,15,0)');
            ctx.fillStyle = fadeTop;
            ctx.fillRect(0, 0, w, h);

            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, [data, side]);

    return (
        <div className={`sidebar-decor sidebar-decor--${side}`} aria-hidden="true">
            <canvas ref={canvasRef} className="sidebar-decor-canvas" />
        </div>
    );
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export default function SeabedSidebars() {
    return (
        <>
            <SidePanel side="left"  data={LEFT_DATA}  />
            <SidePanel side="right" data={RIGHT_DATA} />
        </>
    );
}
