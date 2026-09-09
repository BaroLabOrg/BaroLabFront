import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useDocumentMeta from '../hooks/useDocumentMeta';
import { searchMods, getMods } from '../api/mods';
import { searchSubmarines, getSubmarines } from '../api/submarines';
import { getAllGuides } from '../api/modGuides';
import HeroCarousel from '../components/HeroCarousel';
import HomeModCard from '../components/HomeModCard';
import SubmarineCard from '../components/SubmarineCard';
import Footer from '../components/Footer';
import './HomePage.css';

function ArrowIcon() {
    return (
        <svg className="home-arrow-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg className="home-search-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16.5 16.5 4 4" />
        </svg>
    );
}

/* Emblems — large, thematic, sit behind the copy as a watermark.
   mods: a reactor / fabricator gear · submarines: a hull silhouette ·
   guides: an open field manual. */
const CATEGORY_ICONS = {
    mods: (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="3.1" />
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    submarines: (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <ellipse cx="11" cy="13" rx="8.4" ry="3.8" />
            <path d="M9 9.4V6.3h3.6v3" />
            <path d="M10.9 6.3V3.9h1.9" />
            <path d="M19.4 13H22M22 13l1.4-1.6M22 13l1.4 1.6" />
            <path d="M1.1 13h1.4" />
            <circle cx="7.6" cy="13" r=".85" />
            <circle cx="11" cy="13" r=".85" />
            <circle cx="14.4" cy="13" r=".85" />
        </svg>
    ),
    guides: (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 6.6C10 5 7.2 4.5 4 5.2v13c3.2-.7 6-.2 8 1.4 2-1.6 4.8-2.1 8-1.4v-13c-3.2-.7-6-.2-8 1.4Z" />
            <path d="M12 6.6v13" />
            <path d="M6.4 9.3h3M6.4 12h3M15 9.3h3M15 12h3" />
        </svg>
    ),
};

const SYSTEM_LOGS = [
    { version: 'V1.2.0', tag: 'NEW', title: 'Interactive Submarine Previews', body: 'Added WebGL support. You can now inspect vessel hull blueprints and wiring layers directly in your browser before downloading.' },
    { version: 'V1.1.8', tag: 'FIX', title: 'Tag Filter Stability', body: 'Resolved an issue where multi-tag filtering would return incorrect results on paginated mod lists.' },
    { version: 'V1.1.5', tag: 'UPDATE', title: 'Encyclopedia System', body: 'New encyclopedia entries added for Barotrauma creatures, items and game mechanics. Community contributions welcome.' },
    { version: 'V1.1.0', tag: 'SYSTEM', title: 'Load Order Manager', body: 'Introduced the Load Order tool — drag and drop mods to resolve conflicts and export your configuration.' },
];

const CATEGORY_CARDS = [
    {
        key: 'mods',
        title: 'Modifications',
        bracket: '[ Workshop ]',
        desc: 'Enhance your campaign. Discover custom weapons, total system overhauls, and new alien horrors created by the community.',
        tags: ['Overhaul', 'Weapons', 'Medical', 'Creatures'],
        stub: '+42 new files this week',
        to: '/mods',
    },
    {
        key: 'submarines',
        title: 'Submarines',
        bracket: '[ Shipyard ]',
        desc: 'Acquire custom-built vessels for any crew size and mission. From nimble scout shuttles to massive deep-sea cruisers.',
        tags: ['Attack', 'Transport', 'Scout', 'Tier 3'],
        stub: '+18 vessels commissioned',
        to: '/submarines',
    },
    {
        key: 'guides',
        title: 'Guides & Manuals',
        bracket: '[ Archives ]',
        desc: 'Master the abyss. Study engineering blueprints, advanced submarine wiring, and crucial medical survival procedures.',
        tags: ['Wiring', 'Reactor', 'Medical', 'Modding'],
        stub: '+5 new articles added',
        to: '/guides',
    },
];

const SEARCH_CATEGORIES = [
    { value: 'mods', label: 'Mods' },
    { value: 'submarines', label: 'Submarines' },
    { value: 'encyclopedia', label: 'Encyclopedia' },
];

export default function HomePage() {
    useDocumentMeta({
        title: 'BaroLab — Barotrauma Mods, Submarines, Guides and Game Data',
        description: 'Explore Barotrauma mods, submarines, guides, tags, load order information and encyclopedia entries on BaroLab.',
    });

    const [stats, setStats] = useState({ mods: null, submarines: null, guides: null });
    const [trendingMods, setTrendingMods] = useState([]);
    const [topSubs, setTopSubs] = useState([]);
    const [loadingMods, setLoadingMods] = useState(true);
    const [loadingSubs, setLoadingSubs] = useState(true);
    const [searchCategory, setSearchCategory] = useState('mods');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

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

    const handleCatalogSearch = (event) => {
        event.preventDefault();
        const query = searchQuery.trim();
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        navigate(`/${searchCategory}${params.size ? `?${params.toString()}` : ''}`);
    };

    return (
        <div className="home-page">
            {/* SEO: visually hidden heading for crawlers */}
            <h1 className="visually-hidden">
                BaroLab — Barotrauma Mods, Submarines and Guides. Discover Barotrauma mods, custom submarines, community guides, tags, load order information and encyclopedia entries. Built for Barotrauma players, modders, submarine creators and server owners.
            </h1>

            {/* Hero */}
            <div className="home-hero container">
                <HeroCarousel />
            </div>

            {/* Quick stats bar */}
            <section className="home-stats container" aria-label="Catalog statistics">
                <span className="home-stats-label">[ Quick stats bar ]</span>
                <div className="home-stats-row">
                    <span className="home-stats-live">
                        <span className="status-dot" aria-hidden="true" />
                        Catalog online
                    </span>
                    <span className="home-stats-sep" aria-hidden="true">·</span>
                    <span><b>{fmt(stats.mods)}</b> Total mods</span>
                    <span className="home-stats-sep" aria-hidden="true">·</span>
                    <span><b>{fmt(stats.submarines)}</b> Submarines</span>
                    <span className="home-stats-sep" aria-hidden="true">·</span>
                    <span><b>{fmt(stats.guides)}</b> Guides</span>
                </div>
            </section>

            {/* Catalog search */}
            <section className="home-search container" aria-labelledby="home-search-title">
                <form className="home-search-form" onSubmit={handleCatalogSearch}>
                    <div className="home-search-heading">
                        <span className="home-search-eyebrow">[ Catalog search ]</span>
                        <h2 id="home-search-title">Find what your crew needs</h2>
                    </div>
                    <div className="home-search-controls">
                        <label className="home-search-category">
                            <span className="home-search-category-label">Search in</span>
                            <span className="home-search-category-value" aria-hidden="true">
                                {SEARCH_CATEGORIES.find((category) => category.value === searchCategory)?.label}
                            </span>
                            <select
                                value={searchCategory}
                                onChange={(event) => setSearchCategory(event.target.value)}
                                aria-label="Search category"
                            >
                                {SEARCH_CATEGORIES.map((category) => (
                                    <option key={category.value} value={category.value}>{category.label}</option>
                                ))}
                            </select>
                        </label>
                        <label className="home-search-query">
                            <span className="visually-hidden">Search query</span>
                            <SearchIcon />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder={`Search ${searchCategory}…`}
                                autoComplete="off"
                            />
                        </label>
                        <button className="btn btn-primary home-search-submit" type="submit">
                            Search
                            <ArrowIcon />
                        </button>
                    </div>
                </form>
            </section>

            {/* Choose your depth */}
            <section className="home-choose container" aria-labelledby="home-choose-title">
                <div className="home-choose-intro">
                    <h2 id="home-choose-title">Choose your depth</h2>
                    <p>Enter through the workshop, the shipyard, or the field manuals. Each route leads deeper into the Barotrauma community.</p>
                </div>
                <div className="home-choose-grid">
                    {CATEGORY_CARDS.map((cat) => (
                        <Link key={cat.key} to={cat.to} className={`home-cat-card home-cat-card--${cat.key}`}>
                            <span className={`home-cat-bg home-cat-bg--${cat.key}`} aria-hidden="true" />
                            <span className="home-cat-emblem" aria-hidden="true">{CATEGORY_ICONS[cat.key]}</span>
                            <span className="home-cat-body">
                                <span className="home-cat-topline">
                                    <span className="home-cat-bracket">{cat.bracket}</span>
                                    <ArrowIcon />
                                </span>
                                <span className="home-cat-title">{cat.title}</span>
                                <span className="home-cat-desc">{cat.desc}</span>
                                <span className="home-cat-tags">
                                    {cat.tags.map((tag) => (
                                        <span key={tag} className="home-cat-tag">{tag.toUpperCase()}</span>
                                    ))}
                                </span>
                                <span className="home-cat-stub">{cat.stub}</span>
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Trending this week */}
            <section className="home-section container">
                <div className="home-section-head">
                    <div>
                        <h2 className="home-section-title">Trending this week</h2>
                        <p className="home-section-summary">The workshop pulse, ordered by current community activity.</p>
                    </div>
                    <Link to="/mods" className="home-section-viewall">View all mods <ArrowIcon /></Link>
                </div>
                {loadingMods ? (
                    <div className="loading-state"><div className="loading-spinner" /></div>
                ) : (
                    <div className="home-card-grid home-card-grid--trending">
                        {trendingMods.map((mod) => (
                            <HomeModCard key={mod.external_id || mod.externalId} mod={mod} />
                        ))}
                    </div>
                )}
            </section>

            {/* Fresh from the shipyard */}
            <section className="home-section container">
                <div className="home-section-head">
                    <div>
                        <h2 className="home-section-title">Fresh from the shipyard</h2>
                        <p className="home-section-summary">The latest vessels added to the community fleet.</p>
                    </div>
                    <Link to="/submarines" className="home-section-viewall">Enter shipyard <ArrowIcon /></Link>
                </div>
                {loadingSubs ? (
                    <div className="loading-state"><div className="loading-spinner" /></div>
                ) : (
                    <div className="home-card-grid home-card-grid--shipyard">
                        {topSubs.map((sub) => (
                            <SubmarineCard key={sub.external_id || sub.externalId} submarine={sub} />
                        ))}
                    </div>
                )}
            </section>

            {/* System logs */}
            <section className="home-section container">
                <div className="home-section-head">
                    <h2 className="home-section-title">System logs</h2>
                </div>
                <div className="home-terminal chamfer-lg">
                    <div className="home-terminal-bar">
                        <span className="home-terminal-prompt">&gt; root@barolab:~# tail -f sys.log</span>
                        <span className="home-terminal-dots" aria-hidden="true">
                            <span /><span /><span />
                        </span>
                    </div>
                    <div className="home-terminal-body">
                        <span className="home-terminal-scrollbar" aria-hidden="true" />
                        {SYSTEM_LOGS.map((log) => (
                            <div key={log.version} className="home-log">
                                <span className={`log-tag log-tag--${log.tag.toLowerCase()}`}>{log.tag}</span>
                                <span className="home-log-title">
                                    <span className="home-log-version">{log.version}</span> · {log.title}
                                </span>
                                <span className="home-log-body">{log.body}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer totalMods={stats.mods} />
        </div>
    );
}
