import { useEffect, useState } from 'react';
import { humanizeIdentifier } from '../utils/text';
import { resolveCausedAffliction } from '../utils/relations';
import { loadInternalReferencePreview } from '../api/internalReferences';
import EncyclopediaEntityLink from './EncyclopediaEntityLink';
import './PropertyValue.css';

const AFFLICTION_LIST_KEYS = new Set(['afflictions', 'causesafflictions']);

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Paths ("%ModDir%/Items/...") and file-like identifiers ("icon.png") break
// unpredictably as prose text; render them monospace with hard breaks instead.
function looksLikePathOrFile(text) {
    if (text.includes('/') || text.includes('\\')) return true;
    return /\.[a-zA-Z0-9]{1,5}$/.test(text.trim());
}

function ScalarValue({ value }) {
    const text = String(value);
    if (looksLikePathOrFile(text)) {
        return (
            <span className="property-value-path" title={text}>
                {text}
            </span>
        );
    }
    return <span className="property-value-text">{text}</span>;
}

function importedAfflictionIdentifier(item) {
    return item?.type_or_identifier ?? item?.typeOrIdentifier ?? item?.identifier ?? null;
}

function exactAfflictionSlug(identifier) {
    const slug = String(identifier || '').trim().toLowerCase();
    return /^[a-z0-9][a-z0-9_-]*$/.test(slug) ? slug : null;
}

function isAfflictionList(fieldKey, value) {
    const normalizedKey = String(fieldKey || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return AFFLICTION_LIST_KEYS.has(normalizedKey)
        && Array.isArray(value)
        && value.length > 0
        && value.every((item) => isPlainObject(item) && importedAfflictionIdentifier(item));
}

function ReferenceStatusIcon({ checking = false }) {
    if (checking) {
        return (
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <circle cx="8.5" cy="8.5" r="4.7" />
                <path d="m12 12 4 4M8.5 6.3v4.4M6.3 8.5h4.4" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M7.4 12.6 5.8 14.2a2.7 2.7 0 0 1-3.8-3.8l2.8-2.8a2.7 2.7 0 0 1 3.8 0" />
            <path d="m12.6 7.4 1.6-1.6a2.7 2.7 0 1 1 3.8 3.8l-2.8 2.8a2.7 2.7 0 0 1-3.8 0" />
            <path d="m7.2 12.8 5.6-5.6M5.7 4.3l10 11.4" />
        </svg>
    );
}

function AfflictionReference({ entry, relations }) {
    const identifier = importedAfflictionIdentifier(entry);
    const relatedAffliction = resolveCausedAffliction(identifier, relations);
    const fallbackSlug = relatedAffliction ? null : exactAfflictionSlug(identifier);
    const [fallbackAffliction, setFallbackAffliction] = useState(null);
    const [resolutionState, setResolutionState] = useState(
        relatedAffliction ? 'resolved' : (fallbackSlug ? 'checking' : 'unresolved'),
    );

    useEffect(() => {
        if (relatedAffliction || !fallbackSlug) return undefined;

        let cancelled = false;
        setResolutionState('checking');
        loadInternalReferencePreview({ type: 'encyclopedia', slug: fallbackSlug })
            .then((preview) => {
                if (cancelled) return;
                if (preview?.detail === 'AFFLICTION') {
                    setFallbackAffliction({
                        slug: fallbackSlug,
                        title: preview.title || humanizeIdentifier(fallbackSlug),
                        entityType: preview.detail,
                        primaryImageUrl: preview.imageUrl,
                        summary: preview.summary,
                    });
                    setResolutionState('resolved');
                } else {
                    setResolutionState('unresolved');
                }
            })
            .catch(() => {
                if (!cancelled) setResolutionState('unresolved');
            });

        return () => {
            cancelled = true;
        };
    }, [fallbackSlug, relatedAffliction]);

    const relation = relatedAffliction || fallbackAffliction;
    const amount = entry.amount;
    const checking = resolutionState === 'checking';

    return (
        <li className={`property-affliction-item${relation ? '' : ` is-${resolutionState}`}`}>
            {relation ? (
                <span className="property-affliction-link">
                    <EncyclopediaEntityLink relation={relation} />
                </span>
            ) : (
                <span
                    className="property-affliction-unresolved"
                    title={checking
                        ? 'Checking for an exact affliction entry.'
                        : 'No unique affliction entry matches this identifier.'}
                >
                    <span className="property-affliction-unresolved-icon">
                        <ReferenceStatusIcon checking={checking} />
                    </span>
                    <span className="property-affliction-unresolved-copy">
                        <span className="property-affliction-unresolved-value">{identifier}</span>
                        <span className="property-affliction-unresolved-label">
                            {checking ? 'Checking reference' : 'Unresolved reference'}
                        </span>
                    </span>
                </span>
            )}
            {amount !== undefined && amount !== null && amount !== '' && (
                <span className="property-affliction-amount" aria-label={`Amount ${amount}`}>
                    ×{amount}
                </span>
            )}
        </li>
    );
}

function AfflictionReferenceList({ entries, relations }) {
    return (
        <ul className="property-affliction-list">
            {entries.map((entry, index) => (
                <AfflictionReference
                    entry={entry}
                    relations={relations}
                    // The source data may repeat the same affliction with different amounts.
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${importedAfflictionIdentifier(entry)}-${index}`}
                />
            ))}
        </ul>
    );
}

// Renders one field's value at any nesting depth: primitive arrays collapse
// to a comma list, arrays of objects become a stack of nested field-lists
// (one per item), plain objects become a single nested field-list, and
// anything else is a scalar. Nested field-lists reuse PropertyFieldList
// recursively — there is no separate top-level/nested code path.
export function PropertyValue({ value, depth = 0, fieldKey, relations = [] }) {
    if (isAfflictionList(fieldKey, value)) {
        return <AfflictionReferenceList entries={value} relations={relations} />;
    }

    if (Array.isArray(value)) {
        const isPrimitiveList = value.every((item) => !isPlainObject(item) && !Array.isArray(item));
        if (isPrimitiveList) {
            return <ScalarValue value={value.map(String).join(', ')} />;
        }
        return (
            <div className="property-nested-stack">
                {value.map((item, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div className="property-nested-block" key={index}>
                        <PropertyFieldList
                            entries={Object.entries(item)}
                            depth={depth + 1}
                            relations={relations}
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (isPlainObject(value)) {
        return (
            <div className="property-nested-block">
                <PropertyFieldList
                    entries={Object.entries(value)}
                    depth={depth + 1}
                    relations={relations}
                />
            </div>
        );
    }

    return <ScalarValue value={value} />;
}

// entries: [key, value][]. Every row is laid out through the same CSS grid
// (fixed label column + baseline alignment), whether it's a top-level
// imported property or a field nested inside a JSON blob.
export function PropertyFieldList({ entries, depth = 0, relations = [] }) {
    return (
        <dl className="property-field-grid">
            {entries.map(([key, value]) => (
                <div className="property-field-row" key={key}>
                    <dt className="property-field-label">{humanizeIdentifier(key)}</dt>
                    <dd className="property-field-value">
                        <PropertyValue
                            value={value}
                            depth={depth}
                            fieldKey={key}
                            relations={relations}
                        />
                    </dd>
                </div>
            ))}
        </dl>
    );
}
