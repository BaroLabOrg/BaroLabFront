import { request, normalizePagedResponse } from './api.js';

const BASE = 'api/v1/ingest/vanilla';

const CONTENT_TYPES = [
    { key: 'items',                 label: 'Items',                  path: 'items' },
    { key: 'characters',            label: 'Characters',             path: 'characters' },
    { key: 'afflictions',           label: 'Afflictions',            path: 'afflictions' },
    { key: 'talents',               label: 'Talents',                path: 'talents' },
    { key: 'talent-trees',          label: 'Talent Trees',           path: 'talent-trees' },
    { key: 'jobs',                  label: 'Jobs',                   path: 'jobs' },
    { key: 'job-repair-priorities', label: 'Job Repair Priorities',  path: 'job-repair-priorities' },
    { key: 'factions',              label: 'Factions',               path: 'factions' },
    { key: 'missions',              label: 'Missions',               path: 'missions' },
    { key: 'random-events',         label: 'Random Events',          path: 'random-events' },
    { key: 'upgrade-modules',       label: 'Upgrade Modules',        path: 'upgrade-modules' },
    { key: 'upgrade-categories',    label: 'Upgrade Categories',     path: 'upgrade-categories' },
    { key: 'container-tags',        label: 'Container Tags',         path: 'container-tags' },
    { key: 'corpses',               label: 'Corpses',                path: 'corpses' },
    { key: 'npc-sets',              label: 'NPC Sets',               path: 'npc-sets' },
    { key: 'disembark-perks',       label: 'Disembark Perks',        path: 'disembark-perks' },
    { key: 'item-tags',             label: 'Item Tags',              path: 'item-tags' },
];

export { CONTENT_TYPES };

/**
 * @param {string} typePath  - e.g. 'items', 'talent-trees'
 * @param {{ page?, size?, sortBy?, direction?, q? }} params
 */
export async function listVanillaContent(typePath, {
    page = 0,
    size = 20,
    sortBy = 'identifier',
    direction = 'asc',
    q,
} = {}) {
    const response = await request(`${BASE}/${typePath}`, {
        query: { page, size, sortBy, direction, q: q || undefined },
    });
    // Spring Page response shape: { content, totalElements, totalPages, number, size, ... }
    return normalizeSpringPage(response);
}

/**
 * @param {string} typePath
 * @param {string} identifier
 */
export async function getVanillaContentByIdentifier(typePath, identifier) {
    return request(`${BASE}/${typePath}/${encodeURIComponent(identifier)}`);
}

/**
 * Spring Page → normalised shape matching normalizePagedResponse conventions.
 */
function normalizeSpringPage(response) {
    if (!response || typeof response !== 'object') {
        return { items: [], total: 0, page: 0, size: 0, total_pages: 0, has_next: false, has_previous: false };
    }

    // Spring Boot returns Page as: { content, totalElements, totalPages, number, size, first, last }
    const items = Array.isArray(response.content) ? response.content : (Array.isArray(response.items) ? response.items : []);
    const total = response.totalElements ?? response.total ?? 0;
    const totalPages = response.totalPages ?? response.total_pages ?? 0;
    const pageNum = response.number ?? response.page ?? 0;
    const pageSize = response.size ?? 0;
    const hasNext = response.last === false || response.has_next === true || (pageNum + 1 < totalPages);
    const hasPrevious = response.first === false || response.has_previous === true || pageNum > 0;

    return {
        items,
        total,
        page: pageNum,
        size: pageSize,
        total_pages: totalPages,
        has_next: hasNext,
        has_previous: hasPrevious,
    };
}
