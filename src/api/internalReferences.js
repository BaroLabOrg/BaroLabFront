import { getMod, searchMods } from './mods';
import { getSubmarine, searchSubmarines } from './submarines';
import { getAllGuides, getGuideById, getModGuideById } from './modGuides';
import { getEncyclopediaDetail, searchEncyclopedia } from './encyclopedia';

const previewCache = new Map();

function firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null);
}

function cacheKey(reference) {
    if (reference.type === 'guide') return `guide:${reference.modId}:${reference.guideId}`;
    return `${reference.type}:${reference.externalId || reference.slug}`;
}

async function fetchPreview(reference) {
    if (reference.type === 'mod') {
        const mod = await getMod(reference.externalId);
        return {
            kind: 'Mod',
            title: mod.title,
            imageUrl: firstDefined(mod.main_image, mod.mainImage),
        };
    }

    if (reference.type === 'submarine') {
        const submarine = await getSubmarine(reference.externalId);
        return {
            kind: 'Submarine',
            title: submarine.title,
            imageUrl: firstDefined(submarine.main_image, submarine.mainImage),
            detail: submarine.submarineClass || submarine.submarine_class,
        };
    }

    if (reference.type === 'guide') {
        if (!reference.modId) {
            const guide = await getGuideById(reference.guideId);
            return {
                kind: 'Guide',
                title: guide.title,
                imageUrl: firstDefined(guide.targetImageUrl, guide.target_image_url),
                detail: `For ${firstDefined(guide.targetTitle, guide.target_title, 'BaroLab content')}`,
                meta: guide.author?.username || guide.author?.login,
            };
        }
        const [guide, mod] = await Promise.all([
            getModGuideById(reference.modId, reference.guideId),
            getMod(reference.modId),
        ]);
        return {
            kind: 'Guide',
            title: guide.title,
            imageUrl: firstDefined(mod.main_image, mod.mainImage),
            detail: `For ${mod.title}`,
            meta: guide.author?.username || guide.author?.login,
        };
    }

    if (reference.type === 'encyclopedia') {
        const article = await getEncyclopediaDetail(reference.slug);
        return {
            kind: 'Encyclopedia',
            title: article.title,
            imageUrl: firstDefined(
                article.primaryImage?.publicUrl,
                article.primary_image?.public_url,
                article.primaryImageUrl,
                article.primary_image_url,
            ),
            detail: article.entityType || article.entity_type,
        };
    }

    throw new Error('Unsupported internal reference');
}

export function loadInternalReferencePreview(reference) {
    const key = cacheKey(reference);
    if (!previewCache.has(key)) {
        const request = fetchPreview(reference).catch((error) => {
            previewCache.delete(key);
            throw error;
        });
        previewCache.set(key, request);
    }
    return previewCache.get(key);
}

export async function searchInternalReferences(type, query) {
    const q = String(query || '').trim();
    if (type === 'mod') {
        const response = await searchMods({ q, page: 0, size: 12 });
        return response.items;
    }
    if (type === 'submarine') {
        const response = await searchSubmarines({ q, page: 0, size: 12 });
        return response.items;
    }
    if (type === 'guide') {
        const response = await getAllGuides({ q, page: 0, size: 12 });
        return response.items;
    }
    if (type === 'encyclopedia') {
        const response = await searchEncyclopedia({ q, page: 0, size: 12 });
        return response.items;
    }
    return [];
}

export function clearInternalReferencePreviewCache() {
    previewCache.clear();
}
