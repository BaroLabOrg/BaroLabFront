import { humanizeIdentifier } from '../utils/text';
import './PropertyValue.css';

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

// Renders one field's value at any nesting depth: primitive arrays collapse
// to a comma list, arrays of objects become a stack of nested field-lists
// (one per item), plain objects become a single nested field-list, and
// anything else is a scalar. Nested field-lists reuse PropertyFieldList
// recursively — there is no separate top-level/nested code path.
export function PropertyValue({ value, depth = 0 }) {
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
                        <PropertyFieldList entries={Object.entries(item)} depth={depth + 1} />
                    </div>
                ))}
            </div>
        );
    }

    if (isPlainObject(value)) {
        return (
            <div className="property-nested-block">
                <PropertyFieldList entries={Object.entries(value)} depth={depth + 1} />
            </div>
        );
    }

    return <ScalarValue value={value} />;
}

// entries: [key, value][]. Every row is laid out through the same CSS grid
// (fixed label column + baseline alignment), whether it's a top-level
// imported property or a field nested inside a JSON blob.
export function PropertyFieldList({ entries, depth = 0 }) {
    return (
        <dl className="property-field-grid">
            {entries.map(([key, value]) => (
                <div className="property-field-row" key={key}>
                    <dt className="property-field-label">{humanizeIdentifier(key)}</dt>
                    <dd className="property-field-value">
                        <PropertyValue value={value} depth={depth} />
                    </dd>
                </div>
            ))}
        </dl>
    );
}
