import './PageEmblem.css';

/* Line-art glyphs share the homepage "Choose your depth" vocabulary so a list
   page reads as the same destination as its card on the homepage. Each glyph
   is wrapped in a normalizing <g> so all three sit at a consistent optical
   size inside the tile; the inner <g> carries the hover animation. */
const GLYPHS = {
    mods: (
        <g transform="translate(12 12) scale(0.86) translate(-12 -12)">
            <g className="page-emblem-glyph page-emblem-glyph--mods">
                <circle cx="12" cy="12" r="3.1" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </g>
        </g>
    ),
    submarines: (
        <g transform="translate(12 12) scale(0.82) translate(-12.2 -10.4)">
            <g className="page-emblem-glyph page-emblem-glyph--submarines">
                <ellipse cx="11" cy="13" rx="8.4" ry="3.8" />
                <path d="M9 9.4V6.3h3.6v3" />
                <path d="M10.9 6.3V3.9h1.9" />
                <path d="M19.4 13H22M22 13l1.4-1.6M22 13l1.4 1.6" />
                <path d="M1.1 13h1.4" />
                <circle cx="7.6" cy="13" r=".85" />
                <circle cx="11" cy="13" r=".85" />
                <circle cx="14.4" cy="13" r=".85" />
            </g>
        </g>
    ),
    guides: (
        <g transform="translate(12 12) scale(0.98) translate(-12 -12.5)">
            <g className="page-emblem-glyph page-emblem-glyph--guides">
                <path d="M12 6.6C10 5 7.2 4.5 4 5.2v13c3.2-.7 6-.2 8 1.4 2-1.6 4.8-2.1 8-1.4v-13c-3.2-.7-6-.2-8 1.4Z" />
                <path d="M12 6.6v13" />
                <path d="M6.4 9.3h3M6.4 12h3M15 9.3h3M15 12h3" />
            </g>
        </g>
    ),
};

/**
 * Tactical HUD tile for a page-header/title section.
 *
 * Structure: chamfered tile · amber corner bracket · ambient scan-sweep ·
 * pulsing status dot. The accent comes from the `--emblem-accent` custom
 * property (plus optional `--emblem-bg` / `--emblem-line` / `--emblem-glow`
 * overrides), so a page only has to set one variable on `className` to theme
 * its emblem — see ModsListPage.css / SubmarinesListPage.css / GuidesListPage.css.
 */
export default function PageEmblem({ glyph, className = '', status = true }) {
    return (
        <span className={`page-emblem ${className}`.trim()} aria-hidden="true">
            <span className="page-emblem-bracket" />
            <svg className="page-emblem-icon" viewBox="0 0 24 24" focusable="false">
                {GLYPHS[glyph] || GLYPHS.mods}
            </svg>
            <span className="page-emblem-scan" />
            {status && <span className="page-emblem-dot" />}
        </span>
    );
}
