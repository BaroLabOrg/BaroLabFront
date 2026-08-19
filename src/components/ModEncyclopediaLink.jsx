import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEncyclopediaList } from '../api/encyclopedia';
import './ModEncyclopediaLink.css';

/**
 * A way into the encyclopedia filtered down to what this mod adds.
 *
 * <p>Nothing is drawn until we know there is something to show. Most mods have
 * not been inventoried yet, and a link that lands on an empty page is worse
 * than no link: it reads as "this mod adds nothing" rather than "nobody has
 * looked at this mod yet".
 */
export default function ModEncyclopediaLink({ externalId }) {
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (!externalId) return undefined;
        let cancelled = false;

        (async () => {
            try {
                const data = await getEncyclopediaList({ mod: externalId, size: 1 });
                if (!cancelled) setTotal(Number(data?.total) || 0);
            } catch {
                // The button is an extra, not the page. Staying quiet beats an
                // error box on a mod page over a link nobody asked for.
                if (!cancelled) setTotal(0);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [externalId]);

    if (total <= 0) return null;

    return (
        <Link className="mod-encyclopedia-link" to={`/encyclopedia?mod=${externalId}`}>
            <span className="mod-encyclopedia-link-copy">
                <strong>What this mod adds</strong>
                <small>{total} {total === 1 ? 'entry' : 'entries'} in the encyclopedia</small>
            </span>
            <span className="mod-encyclopedia-link-arrow" aria-hidden="true">→</span>
        </Link>
    );
}
