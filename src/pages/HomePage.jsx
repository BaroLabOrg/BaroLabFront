import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchMods, getMods } from '../api/mods';
import { searchSubmarines, getSubmarines } from '../api/submarines';
import { getAllGuides } from '../api/modGuides';
import HeroCarousel from '../components/HeroCarousel';
import HomeModCard from '../components/HomeModCard';
import HomeSubCard from '../components/HomeSubCard';
import Footer from '../components/Footer';
import './HomePage.css';

const SYSTEM_LOGS = [
    { version: 'V1.2.0', tag: 'NEW', title: 'Interactive Submarine Previews', body: 'Added WebGL support. You can now inspect vessel hull blueprints and wiring layers directly in your browser before downloading.' },
    { version: 'V1.2.0', tag: 'NEW', title: 'Interactive Submarine Previews', body: 'Added WebGL support. You can now inspect vessel hull blueprints and wiring layers directly in your browser before downloading.' },
    { version: 'V1.2.0', tag: 'NEW', title: 'Interactive Submarine Previews', body: 'Added WebGL support. You can now inspect vessel hull blueprints and wiring layers directly in your browser before downloading.' },
    { version: 'V1.2.0', tag: 'NEW', title: 'Interactive Submarine Previews', body: 'Added WebGL support. You can now inspect vessel hull blueprints and wiring layers directly in your browser before downloading.' },
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

export default function HomePage() {
    const [stats, setStats] = useState({ mods: null, submarines: null, guides: null });
    const [trendingMods, setTrendingMods] = useState([]);
    const [topSubs, setTopSubs] = useState([]);
    const [loadingMods, setLoadingMods] = useState(true);
    const [loadingSubs, setLoadingSubs] = useState(true);

    useEffect(() => {
        // Stats
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

        // Trending mods
        searchMods({ sortBy: 'popularity', direction: 'desc', size: 4 })
            .then((res) => setTrendingMods(res.items || []))
            .catch(() => setTrendingMods([]))
            .finally(() => setLoadingMods(false));

        // Top submarines
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
                    <span className="home-stats-label">[ Quick Stats Bar ]</span>
                    <span className="home-stats-item">
                        <span className="home-stats-num">{fmt(stats.mods)}</span> Total Mods
                    </span>
                    <span className="home-stats-sep">•</span>
                    <span className="home-stats-item">
                        <span className="home-stats-num">{fmt(stats.submarines)}</span> Submarines
                    </span>
                    <span className="home-stats-sep">•</span>
                    <span className="home-stats-item">
                        <span className="home-stats-num">{fmt(stats.guides)}</span> Guides
                    </span>
                    <span className="home-stats-sep">•</span>
                    <span className="home-stats-item">
                        <span className="home-stats-num">WIP</span> Authors
                    </span>
                </div>
            </div>

            {/* Category Cards */}
            <div className="home-categories container">
                {CATEGORY_CARDS.map((cat) => (
                    <Link key={cat.key} to={cat.to} className="home-cat-card glass-card">
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
                            <HomeSubCard key={sub.external_id || sub.externalId} submarine={sub} />
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
                        <span className="home-logs-prompt">&gt; root@barolab:~# tail -f sys.log</span>
                        <span className="home-logs-minimize">—</span>
                    </div>
                    <div className="home-logs-body">
                        {SYSTEM_LOGS.map((log, i) => (
                            <div key={i} className="home-log-entry">
                                <span className="home-log-version">{log.version}</span>
                                <span className="home-log-tag">{log.tag}</span>
                                <div className="home-log-text">
                                    <span className="home-log-title">{log.title}</span>
                                    <span className="home-log-body">{log.body}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer totalMods={stats.mods} />
        </div>
    );
}
