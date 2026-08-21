import { useEffect, useState } from 'react';
import { searchSubmarines } from '../../api/submarines';
import ImageWithFallback from '../ImageWithFallback';
import './collection.css';

const PAGE_SIZE = 6;
const SEARCH_DELAY_MS = 250;

function boatId(boat) {
    const raw = boat?.external_id ?? boat?.externalId;
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function subtitle(boat) {
    const author = boat?.author_username || boat?.authorUsername;
    return [
        boat?.submarineClass || null,
        boat?.tier ? `Tier ${boat.tier}` : null,
        author ? `by ${author}` : null,
    ].filter(Boolean).join(' · ');
}

/**
 * The boat a collection is put together for.
 *
 * <p>One at a time, and not in the mod list: a boat is the question the
 * collection answers — "what do I need to play this one" — rather than an entry
 * somebody curates. What it was built with arrives under Missing, as
 * recommendations the player accepts or ignores.
 */
export default function SubmarinePicker({ selected, onPick, onClear, disabled = false }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (selected) return undefined;

        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setError('');
            try {
                const response = await searchSubmarines({ q: query, page: 0, size: PAGE_SIZE });
                if (!cancelled) setResults(response.items);
            } catch (searchError) {
                if (!cancelled) {
                    setResults([]);
                    setError(searchError?.message || 'Could not search submarines.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, SEARCH_DELAY_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [query, selected]);

    if (selected) {
        return (
            <div className="submarine-pick">
                <span className="submarine-pick-name">{selected.title || `Submarine #${selected.externalId}`}</span>
                <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onClear}
                    disabled={disabled}
                >
                    Not this one
                </button>
            </div>
        );
    }

    return (
        <div className="mod-picker">
            <label className="mod-picker-search">
                <span className="collection-field-label">Find a submarine</span>
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by title…"
                    disabled={disabled}
                    aria-label="Search submarines to build for"
                />
            </label>

            {error && <p className="collection-note is-error">{error}</p>}

            {loading && results.length === 0 ? (
                <p className="collection-note">Searching…</p>
            ) : results.length === 0 ? (
                <p className="collection-note">No submarines match that.</p>
            ) : (
                <ul className="mod-picker-results">
                    {results.map((boat) => {
                        const id = boatId(boat);
                        if (id === null) return null;
                        return (
                            <li key={id} className="mod-picker-result">
                                <span className="mod-picker-thumb">
                                    <ImageWithFallback
                                        src={boat.main_image || boat.mainImage}
                                        alt=""
                                        fallbackLabel="No image"
                                        showFallbackLabel={false}
                                        referrerPolicy="no-referrer"
                                    />
                                </span>
                                <span className="mod-picker-copy">
                                    <strong>{boat.title || `Submarine #${id}`}</strong>
                                    <small>{subtitle(boat)}</small>
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => onPick({
                                        externalId: id,
                                        title: boat.title || `Submarine #${id}`,
                                    })}
                                    disabled={disabled}
                                >
                                    Build for this
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
