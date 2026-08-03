// Splits/groups the raw `importedProperties` list from the encyclopedia detail
// API into a "clean" view (for the main page) and a full "raw" view (for an
// on-demand toggle), so noisy schema defaults (e.g. 90+ possible <Item>
// attributes, most left at their default value) don't drown out the handful
// of properties a modder/game dev actually authored.

const ALWAYS_HIDDEN_KEYS = new Set(['_explicitly_set', 'raw_attrs', 'type_specific_children']);

function normalizeKey(key) {
    return String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function safeParseJson(value) {
    if (typeof value !== 'string') return undefined;
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
}

// True when a parsed JSON value carries no actual content: empty
// arrays/objects/strings, recursively (e.g. {"conditionals": [], "items": []}).
function isEmptyJsonNode(node) {
    if (node === null || node === undefined) return true;
    if (Array.isArray(node)) return node.every(isEmptyJsonNode);
    if (typeof node === 'object') return Object.values(node).every(isEmptyJsonNode);
    if (typeof node === 'string') return node.trim() === '';
    return false;
}

// Recursively strips noise *inside* a JSON value: nulls, empty
// strings/arrays/objects, and `false` booleans (the same derived
// presence-flag pattern as top-level is_*/has_* fields, e.g. a status effect's
// "has_explosion": false, "spawns_items": [], "delay": null carry no more
// information than their absence would). Cascades: an object/array element
// that becomes empty after its own fields are pruned is dropped in turn.
function pruneJsonNoise(node) {
    if (Array.isArray(node)) {
        return node
            .map(pruneJsonNoise)
            .filter((item) => item !== false && !isEmptyJsonNode(item));
    }
    if (node !== null && typeof node === 'object') {
        const pruned = {};
        for (const [key, value] of Object.entries(node)) {
            if (value === false) continue;
            const prunedValue = pruneJsonNoise(value);
            if (isEmptyJsonNode(prunedValue)) continue;
            pruned[key] = prunedValue;
        }
        // A "foo" field is dropped whenever a non-empty "foo_summary" sibling
        // survived pruning: the resolver's *_summary fields already restate the
        // same facts as their detailed counterpart in one concise line (e.g.
        // conditionals_summary: ["voltage=gt 0.01", ...] vs the 4 separate
        // conditionals entries — one per split XML attribute — each repeating
        // an identical raw_attrs copy of all 4).
        for (const key of Object.keys(pruned)) {
            if (Object.prototype.hasOwnProperty.call(pruned, `${key}_summary`)) {
                delete pruned[key];
            }
        }
        return pruned;
    }
    return node;
}

function isBoringScalarDefault(valueType, value) {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (valueType === 'BOOLEAN') return normalized === 'false';
    if (valueType === 'NUMBER') return normalized === '' || Number(normalized) === 0;
    if (valueType === 'TEXT') return normalized === '';
    return false;
}

// Reads the `_explicitly_set` marker property (present for content types with
// a large, mostly-defaulted attribute schema, e.g. ITEM/CHARACTER) that lists
// which attributes the source XML actually set. Returns null when the entity
// has no such marker, meaning its property list is already small/clean and
// scalars shouldn't be filtered at all.
function readExplicitlySetKeys(properties) {
    const marker = properties.find((property) => property.propertyKey === '_explicitly_set');
    if (!marker) return null;
    const parsed = safeParseJson(marker.propertyValue);
    if (!Array.isArray(parsed)) return null;
    return new Set(parsed.map(normalizeKey));
}

// Splits properties into { visible, hidden }:
// - always-hidden meta keys (_explicitly_set, raw_attrs, type_specific_children)
// - JSON properties that are empty of real content
// - scalar properties left at a "boring" default value AND never explicitly
//   authored (only applied for entity types that carry the explicit-set marker)
export function splitImportedProperties(properties) {
    const list = Array.isArray(properties) ? properties : [];
    const explicitlySet = readExplicitlySetKeys(list);

    const visible = [];
    const hidden = [];

    for (const property of list) {
        const key = property.propertyKey;

        if (ALWAYS_HIDDEN_KEYS.has(key)) {
            hidden.push(property);
            continue;
        }

        if (property.valueType === 'JSON') {
            const parsed = safeParseJson(property.propertyValue);
            if (parsed === undefined) {
                visible.push(property);
                continue;
            }
            const pruned = pruneJsonNoise(parsed);
            if (isEmptyJsonNode(pruned)) {
                hidden.push(property);
                continue;
            }
            visible.push({ ...property, displayData: pruned });
            continue;
        }

        const wasExplicitlyAuthored = explicitlySet ? explicitlySet.has(normalizeKey(key)) : true;
        if (!wasExplicitlyAuthored && isBoringScalarDefault(property.valueType, property.propertyValue)) {
            hidden.push(property);
            continue;
        }

        visible.push(property);
    }

    return { visible, hidden };
}

// Groups properties by the token before their first underscore
// (icon_texture/icon_sourcerect -> "icon", fabricate_time -> "fabricate").
// Groups that end up with a single member are folded into "Other" instead of
// creating a pile of one-item sections.
export function groupProperties(properties) {
    const buckets = new Map();

    for (const property of properties) {
        const prefix = String(property.propertyKey || '').split('_')[0] || 'other';
        if (!buckets.has(prefix)) buckets.set(prefix, []);
        buckets.get(prefix).push(property);
    }

    const groups = [];
    const otherItems = [];

    for (const [prefix, items] of buckets) {
        if (items.length > 1) {
            groups.push({ name: prefix, items });
        } else {
            otherItems.push(...items);
        }
    }

    groups.sort((a, b) => a.name.localeCompare(b.name));

    if (otherItems.length > 0) {
        groups.push({ name: 'other', items: otherItems });
    }

    return groups;
}
