import { API_BASE, ApiRequestError, request } from './api';

/** Worst first: the order the UI groups problems in. */
export const COLLECTION_SEVERITIES = ['BLOCKING', 'DEGRADED', 'NOTICE'];

export const COLLECTION_SEVERITY_LABELS = {
    BLOCKING: 'Breaks the game',
    DEGRADED: 'Something will not work',
    NOTICE: 'Worth knowing',
};

export const COLLECTION_PROBLEM_LABELS = {
    CANNOT_COEXIST: 'Cannot be loaded together',
    PICK_ONE: 'Keep only one of these',
    REDUNDANT: 'Already covered by another mod',
    OVERLAPPING_OVERRIDES: 'Both change the same content',
    ORDER_CYCLE: 'No order satisfies every rule',
    OUTDATED: 'Built for an older game',
    NEEDS_LUA_RUNTIME: 'Needs the Lua runtime',
};

/** What to do about it, where the summary alone leaves the reader stuck. */
export const COLLECTION_PROBLEM_HINTS = {
    NEEDS_LUA_RUNTIME: 'LuaCs installs through Barotrauma\'s Steam launch options, not by adding a mod here.',
    ORDER_CYCLE: 'The rules contradict each other. Drop one of these mods, or set their order by hand.',
    OUTDATED: 'It may still work — the author just has not rebuilt it for the current game.',
    PICK_ONE: 'They do the same job. Keeping both wastes one of them at best.',
};

export const EMPTY_ANALYSIS = {
    order: [],
    missing: [],
    problems: [],
    unknownWorkshopIds: [],
    contentPackagesXml: '',
};

function firstDefined(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null) return value;
    }
    return undefined;
}

function toText(value) {
    return typeof value === 'string' ? value : '';
}

function toList(value) {
    return Array.isArray(value) ? value : [];
}

function toCount(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0;
}

function toWorkshopId(value) {
    // Number(null) is 0, and 0 is not a Workshop id -- reject the empties first.
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
}

/** Keeps the author's order, drops junk and repeats. */
export function normalizeWorkshopIds(values) {
    const seen = new Set();
    const ids = [];
    for (const value of toList(values)) {
        const id = toWorkshopId(value);
        if (id === null || seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
    }
    return ids;
}

function normalizeOrderedPackage(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    return {
        packageId: firstDefined(raw.package_id, raw.packageId) ?? null,
        externalId: toWorkshopId(firstDefined(raw.external_id, raw.externalId)),
        name: toText(raw.name),
        position: Number(raw.position) || index + 1,
        reason: toText(raw.reason),
    };
}

export function normalizeMissingPackage(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return {
        packageId: firstDefined(raw.package_id, raw.packageId) ?? null,
        externalId: toWorkshopId(firstDefined(raw.external_id, raw.externalId)),
        name: toText(raw.name),
        neededBy: toText(firstDefined(raw.needed_by, raw.neededBy)),
        hard: Boolean(raw.hard),
        // "any one of these will do" -- never all of them
        alternatives: toList(raw.alternatives).map(toText).filter(Boolean),
        // Сколько чужих идентификаторов названо. Отделяет "взяли один предмет"
        // от "построено вокруг мода" -- решение об установке разное.
        usedContent: toCount(firstDefined(raw.used_content, raw.usedContent)),
    };
}

function normalizeProblem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return {
        type: toText(raw.type),
        severity: toText(raw.severity) || 'NOTICE',
        summary: toText(raw.summary),
        packages: toList(raw.packages).map(toText).filter(Boolean),
    };
}

export function normalizeAnalysis(response) {
    if (!response || typeof response !== 'object') return EMPTY_ANALYSIS;
    return {
        order: toList(response.order).map(normalizeOrderedPackage).filter(Boolean),
        missing: toList(response.missing).map(normalizeMissingPackage).filter(Boolean),
        problems: toList(response.problems).map(normalizeProblem).filter(Boolean),
        unknownWorkshopIds: normalizeWorkshopIds(
            firstDefined(response.unknown_workshop_ids, response.unknownWorkshopIds),
        ),
        contentPackagesXml: toText(
            firstDefined(response.content_packages_xml, response.contentPackagesXml),
        ),
    };
}

function normalizeCollectionItem(raw, index) {
    if (!raw || typeof raw !== 'object') return null;
    return {
        workshopId: toWorkshopId(firstDefined(raw.workshop_id, raw.workshopId)),
        name: toText(raw.name),
        position: Number(raw.position) || index + 1,
        addedReason: toText(firstDefined(raw.added_reason, raw.addedReason)) || 'USER',
        // false means the graph has no data for this mod -- not "checked and fine"
        known: Boolean(raw.known),
    };
}

export function normalizeCollection(response) {
    if (!response || typeof response !== 'object') return null;
    const items = toList(response.items)
        .map(normalizeCollectionItem)
        .filter(Boolean)
        .sort((a, b) => a.position - b.position);

    return {
        id: toText(response.id),
        slug: toText(response.slug),
        title: toText(response.title),
        description: toText(response.description),
        gameVersion: toText(firstDefined(response.game_version, response.gameVersion)),
        status: toText(response.status) || 'ACTIVE',
        ownerId: toText(firstDefined(response.owner_id, response.ownerId)),
        createdAt: toText(firstDefined(response.created_at, response.createdAt)),
        updatedAt: toText(firstDefined(response.updated_at, response.updatedAt)),
        items,
    };
}

function toCollectionBody({ title, description, gameVersion, workshopIds }) {
    return {
        title: toText(title).trim(),
        description: toText(description).trim() || null,
        game_version: toText(gameVersion).trim() || null,
        // моды и лодки вперемешку: в игру они едут одним contentpackages.xml
        workshop_ids: normalizeWorkshopIds(workshopIds),
    };
}

/** Analysis of a list nobody has saved yet. Mods and submarines alike. Public. */
export async function analyseCollection(workshopIds) {
    const response = await request('/api/mod-collections/analyse', {
        method: 'POST',
        body: { workshop_ids: normalizeWorkshopIds(workshopIds) },
    });
    return normalizeAnalysis(response);
}

export async function createCollection(collection) {
    const response = await request('/api/mod-collections', {
        method: 'POST',
        body: toCollectionBody(collection),
    });
    return normalizeCollection(response);
}

export async function updateCollection(collectionId, collection) {
    const response = await request(`/api/mod-collections/${collectionId}`, {
        method: 'PUT',
        body: toCollectionBody(collection),
    });
    return normalizeCollection(response);
}

export async function deleteCollection(collectionId) {
    await request(`/api/mod-collections/${collectionId}`, { method: 'DELETE' });
}

export async function getMyCollections() {
    const response = await request('/api/mod-collections/mine');
    return toList(response).map(normalizeCollection).filter(Boolean);
}

/** Recomputes the order and stores it. Author only. */
export async function resolveCollection(collectionId) {
    const response = await request(`/api/mod-collections/${collectionId}/resolve`, {
        method: 'POST',
    });
    return normalizeAnalysis(response);
}

export async function getCollection(slug) {
    return normalizeCollection(await request(`/api/mod-collections/${slug}`));
}

export async function getCollectionAnalysis(slug) {
    return normalizeAnalysis(await request(`/api/mod-collections/${slug}/analysis`));
}

export function collectionExportFilename(slug) {
    return `${slug || 'collection'}-contentpackages.xml`;
}

/**
 * The export is XML, not JSON, so it goes around request() the same way
 * convertLoadOrder does.
 */
export async function exportCollectionXml(slug) {
    if (!API_BASE) {
        throw new Error('VITE_API_BASE_URL is not configured');
    }
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const token = localStorage.getItem('barolab_token');

    const response = await fetch(`${base}/api/mod-collections/${slug}/export`, {
        method: 'GET',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            Accept: 'application/xml, application/json',
        },
    });

    const text = await response.text();
    if (!response.ok) {
        let message = `Error ${response.status}`;
        try {
            message = JSON.parse(text)?.message || message;
        } catch {
            // the body was not JSON, so the status is all we have
        }
        throw new ApiRequestError({ message, status: response.status });
    }
    return text;
}
