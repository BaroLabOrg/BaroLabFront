import { humanizeIdentifier } from '../utils/text';
import './JsonValue.css';

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Renders an already-cleaned JSON value (see utils/importedProperties.js) as
// nested key/value rows instead of a raw {"...": "..."} blob: primitive
// arrays collapse to a comma list, arrays of objects become an indented list
// of rows, and objects become label/value pairs with humanized keys.
export default function JsonValue({ value }) {
    if (Array.isArray(value)) {
        const isPrimitiveList = value.every((item) => !isPlainObject(item) && !Array.isArray(item));
        if (isPrimitiveList) {
            return <span>{value.map((item) => String(item)).join(', ')}</span>;
        }
        return (
            <ul className="json-value-list">
                {value.map((item, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <li key={index}>
                        <JsonValue value={item} />
                    </li>
                ))}
            </ul>
        );
    }

    if (isPlainObject(value)) {
        return (
            <dl className="json-value-object">
                {Object.entries(value).map(([key, entryValue]) => (
                    <div className="json-value-row" key={key}>
                        <dt>{humanizeIdentifier(key)}</dt>
                        <dd><JsonValue value={entryValue} /></dd>
                    </div>
                ))}
            </dl>
        );
    }

    return <span>{String(value)}</span>;
}
