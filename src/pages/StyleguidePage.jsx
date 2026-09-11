import useDocumentMeta from '../hooks/useDocumentMeta';
import './StyleguidePage.css';

/* Live reference for the Tactical Rust design system. Every swatch, specimen
   and component below renders with the real global CSS from src/index.css —
   this page is the source of truth's mirror, not a mock-up. */

const COLOR_GROUPS = [
    {
        label: 'Surface & structure',
        swatches: [
            ['--bg-top', '#12100D', 'Page gradient — top stop'],
            ['--bg-bottom', '#0D0E10', 'Page gradient — bottom stop'],
            ['--surface', '#181410', 'Card / panel / banner fill'],
            ['--surface-raised', '#211B15', 'Elevated surface, modal headers'],
            ['--inset', '#0B0906', 'Recessed well — inputs, terminals'],
            ['--border-vector', '#3A2E22', 'Default 1px border'],
            ['--border-vector-soft', '#2A2119', 'Quiet divider'],
        ],
    },
    {
        label: 'Text',
        swatches: [
            ['--text-primary', '#ECE5D8', 'Headings, key values'],
            ['--text-secondary', '#9C8F7E', 'Body copy'],
            ['--text-tertiary', '#6B6053', 'Meta, captions, labels'],
        ],
    },
    {
        label: 'Accent · Orange (action)',
        swatches: [
            ['--orange', '#FF5A1F', 'Primary buttons, active state, links'],
            ['--orange-dim', '#B23F14', 'Pressed / scrollbar hover'],
            ['--orange-tint', '#3A1C0C', 'Background behind orange chips'],
        ],
    },
    {
        label: 'Accent · Green (system / status / focus)',
        swatches: [
            ['--green', '#33FF77', 'Status, focus rings, terminal'],
            ['--green-dim', '#1F9E4A', 'Reserved pressed state'],
            ['--green-tint', '#0E2417', 'Background behind green chips'],
        ],
    },
    {
        label: 'Accent · Amber (telemetry, non-interactive)',
        swatches: [
            ['--amber', '#FFB000', 'Ratings, admin badge, brackets'],
            ['--amber-tint', '#3A2A08', 'Background behind admin badge'],
        ],
    },
    {
        label: 'Taxonomy · Blue / Danger / Steel',
        swatches: [
            ['--deep-blue', '#5CC7F5', 'Submarines · chip-deep · log fix'],
            ['--deep-blue-tint', '#0E2532', 'Background behind deep-blue tags'],
            ['--danger', '#E23D3D', 'Destructive actions · chip-danger'],
            ['--danger-tint', '#3A1414', 'Background behind danger chip'],
            ['--steel', '#8A94A0', 'chip-hull · log system'],
        ],
    },
];

const TYPE_SPECIMENS = [
    { meta: 'Display / Hero — Orbitron 800 · clamp→48px · track 1.5px', style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '1.5px', lineHeight: 1.06, textTransform: 'uppercase', textShadow: '0 0 30px rgba(255,90,31,.25)' }, text: 'Neurotrauma' },
    { meta: 'Display / Wordmark — Orbitron 800 · 19px · orange', style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '19px', letterSpacing: '1.5px', color: 'var(--orange)', textShadow: '0 0 14px rgba(255,90,31,.5)' }, text: 'BAROLAB' },
    { meta: 'Head / Section title — Rajdhani 700 · 24px · track 1px · UPPER', style: { fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '24px', letterSpacing: '1px', textTransform: 'uppercase' }, text: 'Trending this week' },
    { meta: 'Head / Card title — Rajdhani 700 · 15px · orange · UPPER', style: { fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--orange)' }, text: 'Neurotrauma Overhaul' },
    { meta: 'Head / Button — Rajdhani 700 · 13.5px · track 1.5px · UPPER', style: { fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '13.5px', letterSpacing: '1.5px', textTransform: 'uppercase' }, text: 'Open submarine' },
    { meta: 'Body / Paragraph — Inter 400 · 15px · line-height 1.7', style: { fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.7, color: 'var(--text-secondary)' }, text: 'A total replacement of the vanilla medical system, built for crews who do not trust a med-bay auto-doc.' },
    { meta: 'Mono / Telemetry — JetBrains Mono 400 · 11px · track 2px · green', style: { fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--green)', textTransform: 'uppercase' }, text: 'LIVE FEED · MOD SPOTLIGHT' },
    { meta: 'Mono / Meta — JetBrains Mono 400 · 10.5px · tertiary', style: { fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-tertiary)' }, text: '▪ LordWorld · updated 2d ago' },
];

const SPACING_SCALE = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 56];

const SHAPES = [
    ['chamfer-lg', '26px · double cut (TR + BL) — hero, banners, terminals'],
    ['chamfer-card', '16px · single cut (TR) — cards, search group'],
    ['chamfer-btn', '10px · single cut (TL) — buttons'],
    ['chamfer-badge', '6px · single cut (TL) — role / status badges'],
];

const EFFECTS = [
    ['glow / orange-sm', 'Avatar & icon border glow', { boxShadow: 'var(--glow-orange-sm)' }, '0 0 8px rgba(255,90,31,.4)'],
    ['glow / orange-hover', 'Primary button hover', { filter: 'var(--glow-orange-hover)', background: 'var(--orange)' }, 'drop-shadow(0 0 10px …/.7) brightness(1.08)'],
    ['glow / green-status', 'Status pulse dot', { boxShadow: 'var(--glow-green-status)', background: 'var(--green-tint)' }, '0 0 8px var(--green)'],
    ['glow / green-hover', 'Outline button hover', { filter: 'var(--glow-green-hover)', border: '1px solid var(--green)' }, 'drop-shadow(0 0 8px …/.35)'],
    ['shadow / rivet', 'Bolt-head dimple', { boxShadow: 'var(--shadow-rivet)', background: 'radial-gradient(circle at 35% 35%, #8a7a68, #241d16)', borderRadius: '50%', width: '18px', height: '18px' }, 'inset 0 1px 1px rgba(0,0,0,.7)'],
    ['blur / glass', 'Sticky header backdrop', { backdropFilter: 'var(--blur-glass)', background: 'rgba(20,17,14,.6)', border: '1px solid var(--border-vector)' }, 'backdrop-filter: blur(6px)'],
];

const STATE_ROWS = [
    ['Primary button', 'orange fill', 'glow + brightness 1.08 + lift 1px', 'brightness .9 + press 1px', '2px green (inset) + glow'],
    ['Outline button', 'transparent + vector border', 'border/text → green + glow', 'press transform', '2px green (inset) + glow'],
    ['Nav link', 'text-secondary', 'text-primary', '—', '2px green outline, 4px offset'],
    ['Grid card', 'vector border', 'lift −3px, border → orange, bracket arms', '—', '—'],
    ['Status dot', 'opacity 1', '—', 'pulses to .35 on a 2s loop, always', '—'],
    ['Input', '--inset well, vector border', '—', '—', 'green border + 3px green ring'],
];

const JUMPS = [
    ['color', 'Color'], ['type', 'Type'], ['spacing', 'Spacing'], ['shape', 'Shape'],
    ['effects', 'Effects'], ['buttons', 'Buttons'], ['inputs', 'Inputs'], ['chips', 'Chips'],
    ['cards', 'Cards'], ['nav', 'Nav'], ['icons', 'Icons'], ['states', 'States'],
];

function SectionHead({ num, title }) {
    return (
        <div className="sg-sec-head">
            <span className="sg-sec-num">{num}</span>
            <h2>{title}</h2>
        </div>
    );
}

export default function StyleguidePage() {
    useDocumentMeta({
        title: 'Design System — BaroLab',
        description: 'Live reference for the BaroLab "Tactical Rust" design system: tokens, typography, components and states.',
        canonicalPath: '/styleguide',
        noIndex: true,
    });

    return (
        <div className="sg-page">
            <header className="sg-topbar">
                <div className="sg-topbar-inner container">
                    <span className="sg-brand">◈ BAROLAB / DESIGN SYSTEM</span>
                    <nav className="sg-jumps" aria-label="Design system sections">
                        {JUMPS.map(([id, label]) => (
                            <a key={id} href={`#sg-${id}`}>{label}</a>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="sg-main container">
                <div className="sg-intro">
                    <p className="sg-eyebrow"><span className="status-dot" aria-hidden="true" /> LIVE REFERENCE · TACTICAL RUST</p>
                    <h1>Design system</h1>
                    <p className="sg-lede">
                        Every token and component below renders with the real global CSS from
                        <code> src/index.css</code>. Build new pages against these tokens and classes;
                        legacy stylesheets inherit the palette through aliases until migrated.
                    </p>
                </div>

                {/* COLOR */}
                <section id="sg-color" className="sg-section">
                    <SectionHead num="01" title="Color palette" />
                    {COLOR_GROUPS.map((group) => (
                        <div key={group.label} className="sg-group">
                            <h3 className="sg-group-label">{group.label}</h3>
                            <div className="sg-swatch-grid">
                                {group.swatches.map(([token, hex, use]) => (
                                    <div key={token} className="sg-swatch">
                                        <div className="sg-swatch-chip" style={{ background: `var(${token})` }} />
                                        <div className="sg-swatch-info">
                                            <span className="sg-swatch-token">{token}</span>
                                            <span className="sg-swatch-hex">{hex}</span>
                                            <span className="sg-swatch-use">{use}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>

                {/* TYPE */}
                <section id="sg-type" className="sg-section">
                    <SectionHead num="02" title="Typography" />
                    {TYPE_SPECIMENS.map((spec) => (
                        <div key={spec.meta} className="sg-type-row">
                            <span className="sg-type-meta">{spec.meta}</span>
                            <span className="sg-type-sample" style={spec.style}>{spec.text}</span>
                        </div>
                    ))}
                </section>

                {/* SPACING */}
                <section id="sg-spacing" className="sg-section">
                    <SectionHead num="03" title="Spacing scale" />
                    <p className="sg-note">
                        Core scale, exposed as <code>--space-*</code> tokens. Legacy components keep
                        their baked-in values (13 / 22 / 52…) until migrated.
                    </p>
                    <div className="sg-spacing">
                        {SPACING_SCALE.map((v) => (
                            <div key={v} className="sg-space-row">
                                <span className="sg-space-label"><b>{v}px</b> --space-{v}</span>
                                <span className="sg-space-bar" style={{ width: `${v * 4}px` }} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* SHAPE */}
                <section id="sg-shape" className="sg-section">
                    <SectionHead num="04" title="Shape — chamfers, not radius" />
                    <p className="sg-note">
                        Corners are <code>clip-path</code> cuts. <code>border-radius</code> is reserved
                        for 50% circles (avatars, dots, rivets).
                    </p>
                    <div className="sg-shape-grid">
                        {SHAPES.map(([cls, desc]) => (
                            <div key={cls} className="sg-shape-demo">
                                <div className={`sg-shape-box ${cls}`} />
                                <span className="sg-shape-label"><b>.{cls}</b>{desc}</span>
                            </div>
                        ))}
                        <div className="sg-shape-demo">
                            <div className="sg-shape-circle" />
                            <span className="sg-shape-label"><b>border-radius: 50%</b>avatars · dots · rivets</span>
                        </div>
                    </div>
                </section>

                {/* EFFECTS */}
                <section id="sg-effects" className="sg-section">
                    <SectionHead num="05" title="Shadows & effects" />
                    <div className="sg-fx-grid">
                        {EFFECTS.map(([name, use, style, code]) => (
                            <div key={name} className="sg-fx-demo">
                                <div className="sg-fx-swatch" style={style} />
                                <span className="sg-fx-name">{name}</span>
                                <span className="sg-fx-use">{use}</span>
                                <code className="sg-fx-code">{code}</code>
                            </div>
                        ))}
                    </div>
                </section>

                {/* BUTTONS */}
                <section id="sg-buttons" className="sg-section">
                    <SectionHead num="06" title="Buttons" />
                    <div className="sg-group">
                        <h3 className="sg-group-label">Primary</h3>
                        <div className="sg-btn-row">
                            <button className="btn btn-primary" type="button">Open submarine</button>
                            <button className="btn btn-primary" type="button" disabled>Disabled</button>
                            <button className="btn btn-primary btn-sm" type="button">Small</button>
                        </div>
                    </div>
                    <div className="sg-group">
                        <h3 className="sg-group-label">Outline · ghost · semantic</h3>
                        <div className="sg-btn-row">
                            <button className="btn btn-outline" type="button">Read guide</button>
                            <button className="btn btn-ghost" type="button">Ghost</button>
                            <button className="btn btn-danger" type="button">Delete</button>
                            <button className="btn btn-success" type="button">Approve</button>
                        </div>
                    </div>
                    <p className="sg-note">Tab to a button to see the focus-visible ring (2px inset green + outer glow).</p>
                </section>

                {/* INPUTS */}
                <section id="sg-inputs" className="sg-section">
                    <SectionHead num="07" title="Inputs & forms" />
                    <div className="sg-input-grid">
                        <label className="sg-field">
                            <span>Text input</span>
                            <input type="text" placeholder="Search submarines…" />
                        </label>
                        <label className="sg-field">
                            <span>Select</span>
                            <select defaultValue="mods">
                                <option value="mods">Mods</option>
                                <option value="submarines">Submarines</option>
                                <option value="encyclopedia">Encyclopedia</option>
                            </select>
                        </label>
                        <label className="sg-field sg-field--wide">
                            <span>Textarea</span>
                            <textarea rows="3" placeholder="Write a guide…" />
                        </label>
                    </div>
                </section>

                {/* CHIPS */}
                <section id="sg-chips" className="sg-section">
                    <SectionHead num="08" title="Chips & log tags" />
                    <div className="sg-group">
                        <h3 className="sg-group-label">Content taxonomy — .chip</h3>
                        <div className="sg-chip-row">
                            <span className="chip chip-security">Security</span>
                            <span className="chip chip-life">Life support</span>
                            <span className="chip chip-deep">Deep eng.</span>
                            <span className="chip chip-vanilla">Vanilla</span>
                            <span className="chip chip-hull">Hull specs</span>
                            <span className="chip chip-danger">Danger</span>
                        </div>
                    </div>
                    <div className="sg-group">
                        <h3 className="sg-group-label">System feed — .log-tag</h3>
                        <div className="sg-chip-row">
                            <span className="log-tag log-tag--new">New</span>
                            <span className="log-tag log-tag--fix">Fix</span>
                            <span className="log-tag log-tag--update">Update</span>
                            <span className="log-tag log-tag--system">System</span>
                        </div>
                    </div>
                </section>

                {/* CARDS */}
                <section id="sg-cards" className="sg-section">
                    <SectionHead num="09" title="Cards & panels" />
                    <div className="sg-card-demo-row">
                        <article className="sg-demo-card chamfer-card">
                            <span className="sg-demo-card-bracket" aria-hidden="true" />
                            <div className="sg-demo-card-thumb" />
                            <div className="sg-demo-card-body">
                                <h4>Neurotrauma Overhaul</h4>
                                <span className="sg-demo-card-author">▪ LordWorld</span>
                                <p>A total replacement of the vanilla medical system.</p>
                                <div className="sg-chip-row">
                                    <span className="chip chip-security">Overhaul</span>
                                    <span className="chip chip-life">Medical</span>
                                </div>
                                <div className="sg-demo-card-meta">
                                    <span>★ 4.9</span><span>▪ 124K</span><span>2d ago</span>
                                </div>
                            </div>
                        </article>
                        <div className="sg-demo-banner chamfer-lg">
                            <h4>Modifications</h4>
                            <p>Enhance your campaign — overhauls, weapons, new horrors.</p>
                            <div className="sg-chip-row">
                                <span className="chip chip-security">Overhaul</span>
                                <span className="chip chip-security">Weapons</span>
                                <span className="chip chip-life">Medical</span>
                            </div>
                            <span className="sg-demo-banner-counter">▪ 42 new files this week</span>
                        </div>
                    </div>
                </section>

                {/* NAV */}
                <section id="sg-nav" className="sg-section">
                    <SectionHead num="10" title="Navigation" />
                    <div className="sg-nav-demo">
                        <span className="sg-nav-logo">◈ BAROLAB</span>
                        <span className="sg-nav-links">
                            <span className="sg-nav-link is-active">Mods</span>
                            <span className="sg-nav-link">Submarines</span>
                            <span className="sg-nav-link">Guides</span>
                            <span className="sg-nav-link sg-nav-link--admin">⚙ Admin</span>
                        </span>
                        <span className="sg-nav-right">
                            <span className="user-role-badge">Super admin</span>
                        </span>
                    </div>
                </section>

                {/* ICONS */}
                <section id="sg-icons" className="sg-section">
                    <SectionHead num="11" title="Icons & decorative marks" />
                    <div className="sg-icon-grid">
                        <div className="sg-icon-demo">
                            <div className="sg-icon-box">
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle cx="12" cy="12" r="9.5" stroke="var(--orange)" strokeWidth="1.5" />
                                    <circle cx="12" cy="12" r="3" fill="var(--orange)" />
                                </svg>
                            </div>
                            <span className="sg-shape-label">Logo mark</span>
                        </div>
                        <div className="sg-icon-demo">
                            <div className="sg-icon-box sg-icon-box--bracket">
                                <span className="bracket bracket--tl" />
                                <span className="bracket bracket--br" />
                            </div>
                            <span className="sg-shape-label">Corner bracket · amber</span>
                        </div>
                        <div className="sg-icon-demo">
                            <div className="sg-icon-box"><span className="rivet" /></div>
                            <span className="sg-shape-label">Rivet</span>
                        </div>
                        <div className="sg-icon-demo">
                            <div className="sg-icon-box"><span className="status-dot" /></div>
                            <span className="sg-shape-label">Status dot · pulsing</span>
                        </div>
                        <div className="sg-icon-demo sg-icon-demo--wide">
                            <div className="hazard-strip" />
                            <span className="sg-shape-label">Hazard strip · footer / section cap</span>
                        </div>
                    </div>
                </section>

                {/* STATES */}
                <section id="sg-states" className="sg-section">
                    <SectionHead num="12" title="Component states" />
                    <div className="sg-table-wrap">
                        <table className="sg-table">
                            <thead>
                                <tr>
                                    <th>Component</th><th>Default</th><th>Hover</th><th>Active</th><th>Focus-visible</th>
                                </tr>
                            </thead>
                            <tbody>
                                {STATE_ROWS.map((row) => (
                                    <tr key={row[0]}>
                                        <td className="sg-table-hl">{row[0]}</td>
                                        <td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <footer className="sg-footer">
                    Tactical Rust · rendered from <code>src/index.css</code> · <a href="/">← back to BaroLab</a>
                </footer>
            </main>
        </div>
    );
}
