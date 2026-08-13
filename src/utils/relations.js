import { humanizeIdentifier } from './text';

// A relation is stored once, so each type needs a label for the end you are
// reading it from: an assault rifle is "crafted from" physicorium, and on the
// physicorium page that same edge means "used to craft".
const RELATION_LABELS = {
    CRAFTED_FROM: { OUTGOING: 'Crafted from', INCOMING: 'Used to craft' },
    DECONSTRUCTS_INTO: { OUTGOING: 'Deconstructs into', INCOMING: 'Obtained by deconstructing' },
    UNLOCKS_RECIPE: { OUTGOING: 'Unlocks the recipe for', INCOMING: 'Recipe unlocked by' },
    VARIANT_OF: { OUTGOING: 'Variant of', INCOMING: 'Variants' },
    USES: { OUTGOING: 'Uses', INCOMING: 'Used by' },
    CONTAINS: { OUTGOING: 'Contains', INCOMING: 'Found in' },
    CRAFTS_INTO: { OUTGOING: 'Crafts into', INCOMING: 'Crafted from' },
    UPGRADES_TO: { OUTGOING: 'Upgrades to', INCOMING: 'Upgraded from' },
    TREATS: { OUTGOING: 'Treats', INCOMING: 'Treated by' },
    CAUSES: { OUTGOING: 'Causes', INCOMING: 'Caused by' },
    COUNTERS: { OUTGOING: 'Counters', INCOMING: 'Countered by' },
    PART_OF: { OUTGOING: 'Part of', INCOMING: 'Includes' },
    DEPENDS_ON: { OUTGOING: 'Depends on', INCOMING: 'Required by' },
    RELATED: { OUTGOING: 'Related', INCOMING: 'Related' },
    SEE_ALSO: { OUTGOING: 'See also', INCOMING: 'See also' },
};

// The crafting section already lists these with amounts and times, so showing
// them again as bare links is noise. The reverse side has no such home.
const COVERED_BY_CRAFTING_SECTION = new Set(['CRAFTED_FROM', 'DECONSTRUCTS_INTO']);

export function relationLabel(relationType, direction) {
    const known = RELATION_LABELS[relationType];
    if (known) {
        return known[direction] || known.OUTGOING;
    }
    // enum names are SCREAMING_CASE; humanizeIdentifier only fixes the first
    // letter of each word, so lowercase before handing it over
    const humanized = humanizeIdentifier(String(relationType || '').toLowerCase()) || 'Related';
    return direction === 'INCOMING' ? `${humanized} (incoming)` : humanized;
}

/**
 * Groups relations into one block per (type, direction) pair, sorted by size so
 * the richest connection leads. Entries without a slug are dropped: they cannot
 * be linked anywhere.
 */
export function groupRelations(relations, { hasCraftingSection = false } = {}) {
    if (!Array.isArray(relations)) return [];

    const groups = new Map();
    for (const relation of relations) {
        if (!relation?.slug || !relation.relationType) continue;
        if (hasCraftingSection
            && relation.direction === 'OUTGOING'
            && COVERED_BY_CRAFTING_SECTION.has(relation.relationType)) {
            continue;
        }

        const key = `${relation.relationType}:${relation.direction}`;
        if (!groups.has(key)) {
            groups.set(key, {
                key,
                relationType: relation.relationType,
                direction: relation.direction,
                label: relationLabel(relation.relationType, relation.direction),
                entries: [],
            });
        }

        const group = groups.get(key);
        if (!group.entries.some((entry) => entry.slug === relation.slug)) {
            group.entries.push(relation);
        }
    }

    return [...groups.values()]
        .map((group) => ({
            ...group,
            entries: [...group.entries].sort((left, right) =>
                String(left.title || '').localeCompare(String(right.title || ''))),
        }))
        .sort((left, right) => right.entries.length - left.entries.length
            || left.label.localeCompare(right.label));
}
