// Heuristic mod-tag -> colour-class mapping.
//
// The backend's tag `category` field isn't meaningfully populated yet (every
// tag currently comes back as "INFO"), so there's no real taxonomy to key
// off. Until one exists, infer a rough visual grouping from the tag's own
// name/slug so tags at least read as distinct categories instead of one flat
// colour. Replace TONE_KEYWORDS (or this whole module) once the backend
// assigns real per-tag categories — nothing here is meant to be final.
const TONE_KEYWORDS = [
    ['security', ['weapon', 'combat', 'damage', 'turret', 'gun', 'ammo', 'explosive', 'armor', 'armour', 'pvp', 'security']],
    ['life', ['medical', 'heal', 'health', 'survival', 'medic', 'disease', 'cure']],
    ['deep', ['submarine', 'sub', 'ship', 'vessel', 'engineering', 'engine', 'reactor', 'wiring', 'wire', 'electrical', 'navigation', 'ballast', 'thruster', 'pump']],
    ['danger', ['creature', 'monster', 'husk', 'danger', 'hazard', 'hardcore', 'horror', 'threat', 'boss']],
    ['vanilla', ['balance', 'difficulty', 'gamemode', 'game-mode', 'campaign', 'event', 'mission', 'expansion', 'meta', 'config', 'setting', 'multiplayer', 'singleplayer', 'server-side', 'client-side']],
];

const DEFAULT_TONE = 'hull';

/**
 * @param {{ name?: string, slug?: string } | string} tag
 * @returns {'security'|'life'|'deep'|'danger'|'vanilla'|'hull'}
 */
export function getTagTone(tag) {
    const text = String((typeof tag === 'string' ? tag : tag?.name || tag?.slug) || '').toLowerCase();
    if (!text) return DEFAULT_TONE;
    for (const [tone, keywords] of TONE_KEYWORDS) {
        if (keywords.some((keyword) => text.includes(keyword))) return tone;
    }
    return DEFAULT_TONE;
}
