import { useEffect, useState } from 'react';
import { searchMods } from '../../api/mods';
import ImageWithFallback from '../ImageWithFallback';
import './collection.css';

const PAGE_SIZE = 8;
const SEARCH_DELAY_MS = 250;

const compactNumber = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

function modId(mod) {
    const raw = mod?.external_id ?? mod?.externalId;
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function subtitle(mod) {
    const author = mod?.author_username || mod?.authorUsername;
    const popularity = Number(mod?.popularity);
    return [
        author ? `by ${author}` : null,
        Number.isFinite(popularity) && popularity > 0
            ? `${compactNumber.format(popularity)} subscribers`
            : null,
    ].filter(Boolean).join(' · ');
}

/**
 * Search over the site's own mods. Mods can only come from here: the API
 * refuses a Workshop id it has no mod for, so a free-text id field would only
 * produce errors.
 */
export default function ModPicker({ selectedIds = [], onAdd, disabled = false }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const selected = new Set(selectedIds);

    useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setError('');
            try {
                const response = await searchMods({ q: query, page: 0, size: PAGE_SIZE });
                if (!cancelled) setResults(response.items);
            } catch (searchError) {
                if (!cancelled) {
                    setResults([]);
                    setError(searchError?.message || 'Could not search mods.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, SEARCH_DELAY_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [query]);

    return (
        <div className="mod-picker">
            <label className="mod-picker-search">
                <span className="collection-field-label">Find mods</span>
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by title…"
                    disabled={disabled}
                    aria-label="Search mods to add"
                />
            </label>

            {error && <p className="collection-note is-error">{error}</p>}

            {loading && results.length === 0 ? (
                <p className="collection-note">Searching…</p>
            ) : results.length === 0 ? (
                <p className="collection-note">No mods match that.</p>
            ) : (
                <ul className="mod-picker-results">
                    {results.map((mod) => {
                        const id = modId(mod);
                        if (id === null) return null;
                        const alreadyIn = selected.has(id);
                        return (
                            <li key={id} className="mod-picker-result">
                                <span className="mod-picker-thumb">
                                    <ImageWithFallback
                                        src={mod.main_image || mod.mainImage}
                                        alt=""
                                        fallbackLabel="No image"
                                        showFallbackLabel={false}
                                        referrerPolicy="no-referrer"
                                    />
                                </span>
                                <span className="mod-picker-copy">
                                    <strong>{mod.title || `Mod #${id}`}</strong>
                                    <small>{subtitle(mod)}</small>
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => onAdd({ workshopId: id, name: mod.title || `Mod #${id}` })}
                                    disabled={disabled || alreadyIn}
                                >
                                    {alreadyIn ? 'Added' : 'Add'}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
