import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchMods, getMods } from '../api/mods';
import { searchSubmarines, getSubmarines } from '../api/submarines';
import { getAllGuides } from '../api/modGuides';
import HeroCarousel from '../components/HeroCarousel';
import HomeModCard from '../components/HomeModCard';
import SubmarineCard from '../components/SubmarineCard';
import Footer from '../components/Footer';
import './HomePage.css';

const SYSTEM_LOGS = [
    { version: 'V1.2.0', tag: 'NEW', title: 'Interactive Submarine Previews', body: 'Added WebGL support. You can now inspect vessel hull blueprints and wiring layers directly in your browser before downloading.' },
    { version: 'V1.1.8', tag: 'FIX', title: 'Tag Filter Stability', body: 'Resolved an issue where multi-tag filtering would return incorrect results on paginated mod lists.' },
    { version: 'V1.1.5', tag: 'UPD', title: 'Encyclopedia System', body: 'New encyclopedia entries added for Barotrauma creatures, items, and game mechanics. Community contributions welcome.' },
    { version: 'V1.1.0', tag: 'NEW', title: 'Load Order Manager', body: 'Introduced the Load Order tool — drag and drop mods to resolve conflicts and export your configuration.' },
];

const CATEGORY_CARDS = [
    {
        key: 'mods',
        title: 'Modifications',
        bracket: '[ Workshop ]',
        desc: 'Enhance your campaign. Discover custom weapons, total system overhauls, and new alien horrors created by the community.',
        tags: ['Overhaul', 'Weapons', 'Medical', 'Creatures'],
        stub: '+42 New Files This Week',
        to: '/mods',
    },
    {
        key: 'submarines',
        title: 'Submarines',
        bracket: '[ Shipyard ]',
        desc: 'Acquire custom-built vessels for any crew size and mission. From nimble scout shuttles to massive deep-sea cruisers.',
        tags: ['Attack', 'Transport', 'Scout', 'Tier 3'],
        stub: '+18 Vessels Commissioned',
        to: '/submarines',
    },
    {
        key: 'guides',
        title: 'Guides & Manuals',
        bracket: '[ Archives ]',
        desc: 'Master the abyss. Study engineering blueprints, advanced submarine wiring, and crucial medical survival procedures.',
        tags: ['Wiring', 'Reactor', 'Medical', 'Modding'],
        stub: '+5 New Articles Added',
        to: '/guides',
    },
];

// Barotrauma-themed depth gauge data
const DEPTH_READINGS = [
    { label: 'DEPTH', value: '3,200m', unit: 'BELOW SURFACE', color: 'var(--accent-blue)' },
    { label: 'PRESSURE', value: '320 ATM', unit: 'HULL INTEGRITY: 94%', color: 'var(--accent-green)' },
    { label: 'OXYGEN', value: '87%', unit: 'RECYCLER ACTIVE', color: 'var(--accent-green)' },
    { label: 'REACTOR', value: 'ONLINE', unit: 'OUTPUT: 4,200 kW', color: 'var(--accent)' },
    { label: 'CREW', value: '6/8', unit: 'STATIONS MANNED', color: 'var(--accent)' },
    { label: 'THREAT', value: 'MODERATE', unit: 'CREATURES NEARBY', color: 'var(--warning)' },
];

export default function HomePage() {
    const [stats, setStats] = useState({ mods: null, submarines: null, guides: null });
    const [trendingMods, setTrendingMods] = useState([]);
    const [topSubs, setTopSubs] = useState([]);
    const [loadingMods, setLoadingMods] = useState(true);
    const [loadingSubs, setLoadingSubs] = useState(true);

    useEffect(() => {
        Promise.all([
            getMods({ page: 0, size: 1 }).catch(() => null),
            getSubmarines({ page: 0, size: 1 }).catch(() => null),
            getAllGuides({ page: 0, size: 1 }).catch(() => null),
        ]).then(([modsRes, subsRes, guidesRes]) => {
            setStats({
                mods: modsRes?.total ?? null,
                submarines: subsRes?.total ?? null,
                guides: guidesRes?.total ?? null,
            });
        });

        searchMods({ sortBy: 'popularity', direction: 'desc', size: 4 })
            .then((res) => setTrendingMods(res.items || []))
            .catch(() => setTrendingMods([]))
            .finally(() => setLoadingMods(false));

        searchSubmarines({ sortBy: 'createdAt', direction: 'desc', size: 4 })
            .then((res) => setTopSubs(res.items || []))
            .catch(() => setTopSubs([]))
            .finally(() => setLoadingSubs(false));
    }, []);

    const fmt = (n) => (n != null ? Number(n).toLocaleString('en-US') : '—');

    return (
        <div className="home-page">
            {/* Hero */}
            <div className="home-hero-wrap">
                <HeroCarousel />
            </div>

            {/* Quick Stats Bar */}
            <div className="home-stats-bar">
                <div className="home-stats-inner container">
                    <span className="home-stats-label">SYS_STATS</span>
                    <span className="home-stats-item">
                        <span className="home-stats-num">{fmt(stats.mods)}</span> Mods
                    </span>
                    <span className="home-stats-item">
                        <span className="home-stats-num">{fmt(stats.submarines)}</span> Submarines
                    </span>
                    <span className="home-stats-item">
                        <span className="home-stats-num">{fmt(stats.guides)}</span> Guides
                    </span>
                    <span className="home-stats-item">
                        <span className="home-stats-num">WIP</span> Authors
                    </span>
                </div>
            </div>


            {/* Category Cards */}
            <div className="home-categories container">
                {CATEGORY_CARDS.map((cat) => (
                    <Link key={cat.key} to={cat.to} className={`home-cat-card home-cat-card--${cat.key} glass-card`}>
                        <div className={`home-cat-bg home-cat-bg--${cat.key}`} />
                        <div className="home-cat-body">
                            <h2 className="home-cat-title">{cat.title}</h2>
                            <span className="home-cat-bracket">{cat.bracket}</span>
                            <p className="home-cat-desc">{cat.desc}</p>
                            <div className="home-cat-tags">
                                {cat.tags.map((t) => (
                                    <span key={t} className="home-cat-tag">{t.toUpperCase()}</span>
                                ))}
                            </div>
                            <span className="home-cat-stub">{cat.stub}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Trending This Week */}
            <section className="home-section container">
                <div className="home-section-header">
                    <h2 className="home-section-title">Trending This Week</h2>
                    <Link to="/mods" className="home-section-viewall">View All →</Link>
                </div>
                {loadingMods ? (
                    <div className="loading-state"><div className="loading-spinner" /></div>
                ) : (
                    <div className="home-cards-grid">
                        {trendingMods.map((mod) => (
                            <HomeModCard key={mod.external_id || mod.externalId} mod={mod} />
                        ))}
                    </div>
                )}
            </section>

            {/* Top Rated Vessels */}
            <section className="home-section container">
                <div className="home-section-header">
                    <h2 className="home-section-title">Top Rated Vessels</h2>
                    <Link to="/submarines" className="home-section-viewall">View All →</Link>
                </div>
                {loadingSubs ? (
                    <div className="loading-state"><div className="loading-spinner" /></div>
                ) : (
                    <div className="home-cards-grid">
                        {topSubs.map((sub) => (
                            <SubmarineCard key={sub.external_id || sub.externalId} submarine={sub} />
                        ))}
                    </div>
                )}
            </section>

            {/* System Logs */}
            <section className="home-section container">
                <div className="home-section-header">
                    <h2 className="home-section-title">System Logs</h2>
                    <span className="home-section-viewall home-section-viewall--stub">View All →</span>
                </div>
                <div className="home-logs-terminal">
                    <div className="home-logs-topbar">
                        <div className="home-logs-topbar-left">
                            <span className="home-logs-prompt">&gt; root@barolab:~# tail -f sys.log</span>
                        </div>
                        <span className="home-logs-minimize">—  □  ✕</span>
                    </div>
                    <div className="home-logs-body">
                        {SYSTEM_LOGS.map((log, i) => (
                            <div key={i} className="home-log-entry">
                                <span className="home-log-version">{log.version}</span>
                                <span className={`home-log-tag home-log-tag--${log.tag.toLowerCase()}`}>{log.tag}</span>
                                <div className="home-log-text">
                                    <span className="home-log-title">{log.title}</span>
                                    <span className="home-log-body">{log.body}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Deep sea ambient background ── */}
            <div className="home-seabed" aria-hidden="true">
                <svg className="home-seabed-svg" viewBox="0 0 1400 340" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="seabedFade" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#080a0f" stopOpacity="0"/>
                            <stop offset="55%" stopColor="#080a0f" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#060810" stopOpacity="1"/>
                        </linearGradient>
                        <linearGradient id="subGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1a3a5a" stopOpacity="0.4"/>
                            <stop offset="100%" stopColor="#0d1520" stopOpacity="0.9"/>
                        </linearGradient>
                        <filter id="blur2">
                            <feGaussianBlur stdDeviation="1.5"/>
                        </filter>
                    </defs>

                    {/* Deep water glow — bioluminescence */}
                    <ellipse cx="700" cy="280" rx="400" ry="60" fill="rgba(20,60,100,0.08)"/>
                    <ellipse cx="200" cy="300" rx="180" ry="40" fill="rgba(10,40,70,0.06)"/>
                    <ellipse cx="1200" cy="295" rx="160" ry="35" fill="rgba(10,40,70,0.06)"/>

                    {/* Sea floor — layered */}
                    <path d="M0 290 Q80 270 180 282 Q300 298 450 275 Q580 255 700 278 Q830 300 980 272 Q1120 248 1260 268 Q1340 278 1400 265 L1400 340 L0 340 Z" fill="#060810"/>
                    <path d="M0 300 Q120 285 250 295 Q400 308 550 288 Q680 270 800 290 Q940 312 1080 285 Q1200 262 1320 278 Q1370 285 1400 275 L1400 340 L0 340 Z" fill="#07090e" opacity="0.8"/>

                    {/* Rocks on floor */}
                    <ellipse cx="320" cy="298" rx="28" ry="10" fill="#0a0e18" opacity="0.7"/>
                    <ellipse cx="340" cy="295" rx="18" ry="8" fill="#0c1220" opacity="0.6"/>
                    <ellipse cx="1050" cy="285" rx="32" ry="11" fill="#0a0e18" opacity="0.7"/>
                    <ellipse cx="1070" cy="282" rx="20" ry="8" fill="#0c1220" opacity="0.6"/>
                    <ellipse cx="700" cy="292" rx="22" ry="8" fill="#0a0e18" opacity="0.5"/>

                    {/* ── Submarine silhouette ── */}
                    <g opacity="0.22" transform="translate(460, 130)">
                        {/* Hull body */}
                        <ellipse cx="240" cy="50" rx="230" ry="32" fill="url(#subGlow)"/>
                        {/* Nose cone */}
                        <ellipse cx="12" cy="50" rx="18" ry="28" fill="#0d1828"/>
                        {/* Tail */}
                        <ellipse cx="468" cy="50" rx="12" ry="20" fill="#0d1828"/>
                        {/* Conning tower */}
                        <rect x="185" y="18" width="70" height="34" rx="6" fill="#0f1e30"/>
                        {/* Periscope */}
                        <rect x="215" y="2" width="6" height="18" rx="3" fill="#0f1e30"/>
                        <rect x="221" y="2" width="14" height="4" rx="2" fill="#0f1e30"/>
                        {/* Propeller blades */}
                        <ellipse cx="468" cy="36" rx="5" ry="16" fill="#0d1828" transform="rotate(-20 468 36)"/>
                        <ellipse cx="468" cy="64" rx="5" ry="16" fill="#0d1828" transform="rotate(20 468 64)"/>
                        {/* Dive planes front */}
                        <path d="M60 50 L20 30 L50 38 Z" fill="#0d1828"/>
                        <path d="M60 50 L20 70 L50 62 Z" fill="#0d1828"/>
                        {/* Dive planes rear */}
                        <path d="M420 50 L450 28 L435 42 Z" fill="#0d1828"/>
                        <path d="M420 50 L450 72 L435 58 Z" fill="#0d1828"/>
                        {/* Portholes */}
                        <circle cx="100" cy="50" r="7" fill="#060c18" stroke="#1a3050" strokeWidth="1"/>
                        <circle cx="140" cy="50" r="7" fill="#060c18" stroke="#1a3050" strokeWidth="1"/>
                        <circle cx="180" cy="50" r="7" fill="#060c18" stroke="#1a3050" strokeWidth="1"/>
                        <circle cx="280" cy="50" r="7" fill="#060c18" stroke="#1a3050" strokeWidth="1"/>
                        <circle cx="320" cy="50" r="7" fill="#060c18" stroke="#1a3050" strokeWidth="1"/>
                        <circle cx="360" cy="50" r="7" fill="#060c18" stroke="#1a3050" strokeWidth="1"/>
                        {/* Faint porthole glow */}
                        <circle cx="100" cy="50" r="4" fill="#0d2040" opacity="0.5"/>
                        <circle cx="180" cy="50" r="4" fill="#0d2040" opacity="0.5"/>
                        <circle cx="320" cy="50" r="4" fill="#0d2040" opacity="0.5"/>
                    </g>

                    {/* ── Fish ── */}
                    <g opacity="0.25">
                        {/* Fish 1 */}
                        <path d="M280 180 Q294 174 308 180 Q294 186 280 180 Z" fill="#0d1a2e"/>
                        <path d="M308 180 L322 174 L319 180 L322 186 Z" fill="#0d1a2e"/>
                        {/* Fish 2 */}
                        <path d="M1050 160 Q1062 155 1074 160 Q1062 165 1050 160 Z" fill="#0d1a2e"/>
                        <path d="M1074 160 L1086 155 L1083 160 L1086 165 Z" fill="#0d1a2e"/>
                        {/* Fish 3 — small */}
                        <path d="M600 220 Q608 217 616 220 Q608 223 600 220 Z" fill="#0d1a2e"/>
                        <path d="M616 220 L622 218 L621 220 L622 222 Z" fill="#0d1a2e"/>
                        {/* Fish 4 */}
                        <path d="M900 100 Q914 94 928 100 Q914 106 900 100 Z" fill="#0d1a2e"/>
                        <path d="M928 100 L942 95 L939 100 L942 105 Z" fill="#0d1a2e"/>
                    </g>

                    {/* ── Bubbles rising from sub ── */}
                    <g opacity="0.18" className="seabed-bubbles">
                        <circle cx="560" cy="118" r="4" fill="none" stroke="#1e4060" strokeWidth="1.2"/>
                        <circle cx="572" cy="100" r="3" fill="none" stroke="#1e4060" strokeWidth="1"/>
                        <circle cx="555" cy="85" r="2.5" fill="none" stroke="#1e4060" strokeWidth="1"/>
                        <circle cx="580" cy="72" r="2" fill="none" stroke="#1e4060" strokeWidth="1"/>
                        <circle cx="568" cy="58" r="3" fill="none" stroke="#1e4060" strokeWidth="1"/>
                        <circle cx="590" cy="44" r="2" fill="none" stroke="#1e4060" strokeWidth="1"/>
                        <circle cx="700" cy="115" r="3.5" fill="none" stroke="#1e4060" strokeWidth="1"/>
                        <circle cx="712" cy="98" r="2.5" fill="none" stroke="#1e4060" strokeWidth="1"/>
                        <circle cx="705" cy="80" r="2" fill="none" stroke="#1e4060" strokeWidth="1"/>
                    </g>

                    {/* Gradient overlay */}
                    <rect x="0" y="0" width="1400" height="340" fill="url(#seabedFade)"/>
                </svg>
            </div>

            {/* Footer */}
            <Footer totalMods={stats.mods} />
        </div>
    );
}
