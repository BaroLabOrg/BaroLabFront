import { API_BASE, normalizePagedResponse, request } from './api';

export const ENCYCLOPEDIA_ENTITY_TYPES = [
    'ITEM',
    'AFFLICTION',
    'CHARACTER',
    'FACTION',
    'LOCATION',
    'SUBMARINE',
    'CREATURE',
    'BIOME',
    'TALENT',
    'JOB',
    'OTHER',
];

export const ENCYCLOPEDIA_RELATION_TYPES = [
    'RELATED',
    'USES',
    'CONTAINS',
    'CRAFTS_INTO',
    'UPGRADES_TO',
    'TREATS',
    'CAUSES',
    'COUNTERS',
    'PART_OF',
    'DEPENDS_ON',
    'SEE_ALSO',
];

export const ENCYCLOPEDIA_SORT_OPTIONS = [
    'publishedAt',
    'published_at',
    'updatedAt',
    'updated_at',
    'createdAt',
    'created_at',
    'title',
];

function firstDefined(...values) {
    for (const value of values) {
        if (value !== undefined && value !== null) return value;
    }
    return undefined;
}

function resolveMediaUrl(url) {
    const value = firstDefined(url);
    if (!value || typeof value !== 'string') return value;

    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
        return trimmed;
    }
    if (!trimmed.startsWith('/')) {
        return trimmed;
    }
    if (!API_BASE) {
        return trimmed;
    }

    try {
        const apiOrigin = new URL(API_BASE).origin;
        return `${apiOrigin}${trimmed}`;
    } catch {
        return trimmed;
    }
}

function normalizeArray(values, mapper) {
    if (!Array.isArray(values)) return [];
    return values.map(mapper).filter(Boolean);
}

function normalizeCategoryCounter(counter) {
    if (!counter || typeof counter !== 'object') return null;

    const primaryCategory = firstDefined(counter.primaryCategory, counter.primary_category);
    const secondaryCategory = firstDefined(counter.secondaryCategory, counter.secondary_category);
    const total = Number(firstDefined(counter.total, 0)) || 0;

    return {
        ...counter,
        primaryCategory,
        primary_category: primaryCategory,
        secondaryCategory,
        secondary_category: secondaryCategory,
        total,
    };
}

function normalizeNavigationSecondaryCategory(category) {
    if (!category || typeof category !== 'object') return null;

    const secondaryCategory = firstDefined(category.secondaryCategory, category.secondary_category);
    const total = Number(firstDefined(category.total, 0)) || 0;

    return {
        ...category,
        secondaryCategory,
        secondary_category: secondaryCategory,
        total,
    };
}

function normalizeNavigationPrimaryCategory(category) {
    if (!category || typeof category !== 'object') return null;

    const primaryCategory = firstDefined(category.primaryCategory, category.primary_category);
    const total = Number(firstDefined(category.total, 0)) || 0;
    const secondaryCategories = normalizeArray(
        firstDefined(category.secondaryCategories, category.secondary_categories),
        normalizeNavigationSecondaryCategory,
    );

    return {
        ...category,
        primaryCategory,
        primary_category: primaryCategory,
        total,
        secondaryCategories,
        secondary_categories: secondaryCategories,
    };
}

function normalizeNavigationType(type) {
    if (!type || typeof type !== 'object') return null;

    const entityType = firstDefined(type.entityType, type.entity_type);
    const total = Number(firstDefined(type.total, 0)) || 0;
    const primaryCategories = normalizeArray(
        firstDefined(type.primaryCategories, type.primary_categories),
        normalizeNavigationPrimaryCategory,
    );

    return {
        ...type,
        entityType,
        entity_type: entityType,
        total,
        primaryCategories,
        primary_categories: primaryCategories,
    };
}

function normalizeNavigation(response) {
    if (!response || typeof response !== 'object') {
        return {
            types: [],
        };
    }

    const types = normalizeArray(response.types, normalizeNavigationType);
    return {
        ...response,
        types,
    };
}

function normalizeImage(image) {
    if (!image || typeof image !== 'object') return null;

    const imageType = firstDefined(image.imageType, image.image_type);
    const publicUrl = resolveMediaUrl(firstDefined(image.publicUrl, image.public_url));
    const width = firstDefined(image.width);
    const height = firstDefined(image.height);
    const isPrimary = firstDefined(image.isPrimary, image.is_primary);

    return {
        ...image,
        imageType,
        image_type: imageType,
        publicUrl,
        public_url: publicUrl,
        width,
        height,
        isPrimary: Boolean(isPrimary),
        is_primary: Boolean(isPrimary),
    };
}

function normalizeInfoboxField(field) {
    if (!field || typeof field !== 'object') return null;

    const fieldKey = firstDefined(field.fieldKey, field.field_key);
    const fieldLabel = firstDefined(field.fieldLabel, field.field_label);
    const fieldValue = firstDefined(field.fieldValue, field.field_value);
    const sortOrder = Number(firstDefined(field.sortOrder, field.sort_order, 0)) || 0;
    const origin = firstDefined(field.origin);

    return {
        ...field,
        fieldKey,
        field_key: fieldKey,
        fieldLabel,
        field_label: fieldLabel,
        fieldValue,
        field_value: fieldValue,
        sortOrder,
        sort_order: sortOrder,
        origin,
    };
}

function normalizeRelatedEntity(entity) {
    if (!entity || typeof entity !== 'object') return null;

    const id = firstDefined(entity.id);
    const slug = firstDefined(entity.slug);
    const title = firstDefined(entity.title);
    const relationType = firstDefined(entity.relationType, entity.relation_type);
    const origin = firstDefined(entity.origin);
    const sortOrder = Number(firstDefined(entity.sortOrder, entity.sort_order, 0)) || 0;

    return {
        ...entity,
        id,
        slug,
        title,
        relationType,
        relation_type: relationType,
        origin,
        sortOrder,
        sort_order: sortOrder,
    };
}

function normalizeBacklink(backlink) {
    if (!backlink || typeof backlink !== 'object') return null;

    const articleId = firstDefined(backlink.articleId, backlink.article_id);
    const sourceEntityId = firstDefined(backlink.sourceEntityId, backlink.source_entity_id);
    const sourceSlug = firstDefined(backlink.sourceSlug, backlink.source_slug);
    const sourceTitle = firstDefined(backlink.sourceTitle, backlink.source_title);
    const publishedAt = firstDefined(backlink.publishedAt, backlink.published_at);

    return {
        ...backlink,
        articleId,
        article_id: articleId,
        sourceEntityId,
        source_entity_id: sourceEntityId,
        sourceSlug,
        source_slug: sourceSlug,
        sourceTitle,
        source_title: sourceTitle,
        publishedAt,
        published_at: publishedAt,
    };
}

function normalizeModRelation(relation) {
    if (!relation || typeof relation !== 'object') return null;

    const modExternalId = firstDefined(relation.modExternalId, relation.mod_external_id);
    const relationType = firstDefined(relation.relationType, relation.relation_type);
    const confidenceRaw = firstDefined(relation.confidence);
    const confidence = confidenceRaw === undefined || confidenceRaw === null
        ? null
        : Number(confidenceRaw);
    const evidence = firstDefined(relation.evidence);

    return {
        ...relation,
        modExternalId,
        mod_external_id: modExternalId,
        relationType,
        relation_type: relationType,
        confidence: confidence === null || Number.isNaN(confidence) ? null : confidence,
        evidence,
    };
}

function normalizeProperty(property) {
    if (!property || typeof property !== 'object') return null;

    const propertyKey = firstDefined(property.propertyKey, property.property_key);
    const propertyValue = firstDefined(property.propertyValue, property.property_value);
    const valueType = firstDefined(property.valueType, property.value_type);
    const origin = firstDefined(property.origin);

    return {
        ...property,
        propertyKey,
        property_key: propertyKey,
        propertyValue,
        property_value: propertyValue,
        valueType,
        value_type: valueType,
        origin,
    };
}

function normalizeArticleState(article) {
    if (!article || typeof article !== 'object') {
        return {
            articleId: null,
            article_id: null,
            draftMarkdown: '',
            draft_markdown: '',
            publishedMarkdown: '',
            published_markdown: '',
            renderedHtml: '',
            rendered_html: '',
            summary: '',
            articleStatus: 'DRAFT',
            article_status: 'DRAFT',
            publishedAt: null,
            published_at: null,
            updatedAt: null,
            updated_at: null,
        };
    }

    const articleId = firstDefined(article.articleId, article.article_id);
    const draftMarkdown = firstDefined(article.draftMarkdown, article.draft_markdown, '');
    const publishedMarkdown = firstDefined(article.publishedMarkdown, article.published_markdown, '');
    const renderedHtml = firstDefined(article.renderedHtml, article.rendered_html, '');
    const summary = firstDefined(article.summary, '');
    const articleStatus = firstDefined(article.articleStatus, article.article_status, 'DRAFT');
    const publishedAt = firstDefined(article.publishedAt, article.published_at);
    const updatedAt = firstDefined(article.updatedAt, article.updated_at);

    return {
        ...article,
        articleId,
        article_id: articleId,
        draftMarkdown,
        draft_markdown: draftMarkdown,
        publishedMarkdown,
        published_markdown: publishedMarkdown,
        renderedHtml,
        rendered_html: renderedHtml,
        summary,
        articleStatus,
        article_status: articleStatus,
        publishedAt,
        published_at: publishedAt,
        updatedAt,
        updated_at: updatedAt,
    };
}

function normalizeListItem(item) {
    if (!item || typeof item !== 'object') return null;

    const id = firstDefined(item.id);
    const slug = firstDefined(item.slug);
    const title = firstDefined(item.title);
    const entityType = firstDefined(item.entityType, item.entity_type);
    const primaryCategory = firstDefined(item.primaryCategory, item.primary_category);
    const secondaryCategory = firstDefined(item.secondaryCategory, item.secondary_category);
    const shortDescription = firstDefined(item.shortDescription, item.short_description);
    const summary = firstDefined(item.summary);
    const primaryImageUrl = resolveMediaUrl(firstDefined(item.primaryImageUrl, item.primary_image_url));
    const publishedAt = firstDefined(item.publishedAt, item.published_at);
    const updatedAt = firstDefined(item.updatedAt, item.updated_at);

    return {
        ...item,
        id,
        slug,
        title,
        entityType,
        entity_type: entityType,
        primaryCategory,
        primary_category: primaryCategory,
        secondaryCategory,
        secondary_category: secondaryCategory,
        shortDescription,
        short_description: shortDescription,
        summary,
        primaryImageUrl,
        primary_image_url: primaryImageUrl,
        publishedAt,
        published_at: publishedAt,
        updatedAt,
        updated_at: updatedAt,
    };
}

function normalizeAvailableEntity(entity) {
    if (!entity || typeof entity !== 'object') return null;

    const id = firstDefined(entity.id);
    const title = firstDefined(entity.title);
    const slug = firstDefined(entity.slug);
    const entityType = firstDefined(entity.entityType, entity.entity_type);
    const primaryCategory = firstDefined(entity.primaryCategory, entity.primary_category);
    const secondaryCategory = firstDefined(entity.secondaryCategory, entity.secondary_category);
    const shortDescription = firstDefined(entity.shortDescription, entity.short_description);
    const sourceIdentifier = firstDefined(entity.sourceIdentifier, entity.source_identifier);
    const primaryImageUrl = resolveMediaUrl(firstDefined(entity.primaryImageUrl, entity.primary_image_url));

    return {
        ...entity,
        id,
        title,
        slug,
        entityType,
        entity_type: entityType,
        primaryCategory,
        primary_category: primaryCategory,
        secondaryCategory,
        secondary_category: secondaryCategory,
        shortDescription,
        short_description: shortDescription,
        primaryImageUrl,
        primary_image_url: primaryImageUrl,
        sourceIdentifier,
        source_identifier: sourceIdentifier,
    };
}

function normalizeDetail(detail) {
    if (!detail || typeof detail !== 'object') return null;

    const id = firstDefined(detail.id);
    const slug = firstDefined(detail.slug);
    const title = firstDefined(detail.title);
    const entityType = firstDefined(detail.entityType, detail.entity_type);
    const subtype = firstDefined(detail.subtype);
    const primaryCategory = firstDefined(detail.primaryCategory, detail.primary_category);
    const secondaryCategory = firstDefined(detail.secondaryCategory, detail.secondary_category);
    const shortDescription = firstDefined(detail.shortDescription, detail.short_description);
    const sourceGameVersion = firstDefined(detail.sourceGameVersion, detail.source_game_version);
    const publishedMarkdown = firstDefined(detail.publishedMarkdown, detail.published_markdown, '');
    const renderedHtml = firstDefined(detail.renderedHtml, detail.rendered_html, '');
    const summary = firstDefined(detail.summary);
    const publishedAt = firstDefined(detail.publishedAt, detail.published_at);

    const primaryImage = normalizeImage(firstDefined(detail.primaryImage, detail.primary_image));
    const infobox = normalizeArray(detail.infobox, normalizeInfoboxField);
    const relatedEntities = normalizeArray(
        firstDefined(detail.relatedEntities, detail.related_entities),
        normalizeRelatedEntity,
    );
    const backlinks = normalizeArray(detail.backlinks, normalizeBacklink);
    const relatedMods = normalizeArray(
        firstDefined(detail.relatedMods, detail.related_mods),
        normalizeModRelation,
    );
    const importedProperties = normalizeArray(
        firstDefined(detail.importedProperties, detail.imported_properties),
        normalizeProperty,
    );

    return {
        ...detail,
        id,
        slug,
        title,
        entityType,
        entity_type: entityType,
        subtype,
        primaryCategory,
        primary_category: primaryCategory,
        secondaryCategory,
        secondary_category: secondaryCategory,
        shortDescription,
        short_description: shortDescription,
        sourceGameVersion,
        source_game_version: sourceGameVersion,
        publishedMarkdown,
        published_markdown: publishedMarkdown,
        renderedHtml,
        rendered_html: renderedHtml,
        summary,
        publishedAt,
        published_at: publishedAt,
        primaryImage,
        primary_image: primaryImage,
        infobox,
        relatedEntities,
        related_entities: relatedEntities,
        backlinks,
        relatedMods,
        related_mods: relatedMods,
        importedProperties,
        imported_properties: importedProperties,
    };
}

function normalizeEditorResponse(response) {
    if (!response || typeof response !== 'object') return null;

    const entityId = firstDefined(response.entityId, response.entity_id);
    const slug = firstDefined(response.slug);
    const title = firstDefined(response.title);
    const entityType = firstDefined(response.entityType, response.entity_type);
    const subtype = firstDefined(response.subtype);
    const primaryCategory = firstDefined(response.primaryCategory, response.primary_category);
    const secondaryCategory = firstDefined(response.secondaryCategory, response.secondary_category);
    const shortDescription = firstDefined(response.shortDescription, response.short_description);
    const article = normalizeArticleState(response.article);
    const infobox = normalizeArray(response.infobox, normalizeInfoboxField);
    const manualRelations = normalizeArray(
        firstDefined(response.manualRelations, response.manual_relations),
        normalizeRelatedEntity,
    );
    const importedProperties = normalizeArray(
        firstDefined(response.importedProperties, response.imported_properties),
        normalizeProperty,
    );

    return {
        ...response,
        entityId,
        entity_id: entityId,
        slug,
        title,
        entityType,
        entity_type: entityType,
        subtype,
        primaryCategory,
        primary_category: primaryCategory,
        secondaryCategory,
        secondary_category: secondaryCategory,
        shortDescription,
        short_description: shortDescription,
        article,
        infobox,
        manualRelations,
        manual_relations: manualRelations,
        importedProperties,
        imported_properties: importedProperties,
    };
}

function normalizePreviewResponse(response) {
    if (!response || typeof response !== 'object') {
        return {
            renderedHtml: '',
            rendered_html: '',
            links: [],
        };
    }

    const renderedHtml = firstDefined(response.renderedHtml, response.rendered_html, '');
    const links = normalizeArray(response.links, (link) => {
        if (!link || typeof link !== 'object') return null;
        const rawText = firstDefined(link.rawText, link.raw_text, '');
        const resolvedSlug = firstDefined(link.resolvedSlug, link.resolved_slug, null);
        const resolved = Boolean(firstDefined(link.resolved, link.isResolved, link.is_resolved));

        return {
            ...link,
            rawText,
            raw_text: rawText,
            resolvedSlug,
            resolved_slug: resolvedSlug,
            resolved,
            isResolved: resolved,
            is_resolved: resolved,
        };
    });

    return {
        ...response,
        renderedHtml,
        rendered_html: renderedHtml,
        links,
    };
}

function normalizeEncyclopediaPage(response) {
    const normalized = normalizePagedResponse(response);
    return {
        ...normalized,
        items: normalizeArray(normalized.items, normalizeListItem),
    };
}

function normalizeAvailableEntitiesPage(response) {
    const normalized = normalizePagedResponse(response);
    return {
        ...normalized,
        items: normalizeArray(normalized.items, normalizeAvailableEntity),
    };
}

function normalizeInfoboxPayload(fields) {
    if (!Array.isArray(fields)) return [];
    return fields.map((field, index) => ({
        field_key: String(firstDefined(field.fieldKey, field.field_key, '')).trim(),
        field_label: String(firstDefined(field.fieldLabel, field.field_label, '')).trim(),
        field_value: String(firstDefined(field.fieldValue, field.field_value, '')).trim(),
        sort_order: Number(firstDefined(field.sortOrder, field.sort_order, index)) || 0,
    }));
}

function normalizeRelationsPayload(relations) {
    if (!Array.isArray(relations)) return [];
    return relations.map((relation, index) => ({
        target_entity_id: firstDefined(relation.targetEntityId, relation.target_entity_id, relation.id),
        relation_type: firstDefined(relation.relationType, relation.relation_type, 'RELATED'),
        sort_order: Number(firstDefined(relation.sortOrder, relation.sort_order, index)) || 0,
    }));
}

export async function getEncyclopediaList({
    q = '',
    entityType,
    primaryCategory,
    secondaryCategory,
    page = 0,
    size = 12,
    sortBy = 'publishedAt',
    direction = 'desc',
} = {}) {
    const response = await request('/api/encyclopedia', {
        query: {
            q: String(q || '').trim(),
            entityType,
            primaryCategory,
            secondaryCategory,
            page,
            size,
            sortBy,
            direction,
        },
    });

    return normalizeEncyclopediaPage(response);
}

export async function getEncyclopediaCategories() {
    const response = await request('/api/encyclopedia/categories');
    return normalizeArray(response, normalizeCategoryCounter);
}

export async function getEncyclopediaNavigation() {
    const response = await request('/api/encyclopedia/navigation');
    return normalizeNavigation(response);
}

export async function getEncyclopediaDetail(slug) {
    const response = await request(`/api/encyclopedia/${encodeURIComponent(slug)}`);
    return normalizeDetail(response);
}

export async function getEncyclopediaBacklinks(slug) {
    const response = await request(`/api/encyclopedia/${encodeURIComponent(slug)}/backlinks`);
    return normalizeArray(response, normalizeBacklink);
}

export async function getEncyclopediaMods(slug) {
    const response = await request(`/api/encyclopedia/${encodeURIComponent(slug)}/mods`);
    return normalizeArray(response, normalizeModRelation);
}

export async function createEncyclopediaArticle({
    entityId,
    draftMarkdown,
    summary,
}) {
    const response = await request('/api/admin/encyclopedia', {
        method: 'POST',
        body: {
            entity_id: entityId,
            draft_markdown: draftMarkdown,
            summary,
        },
    });

    return normalizeEditorResponse(response);
}

export async function getAvailableEncyclopediaEntities({
    q = '',
    entityType,
    page = 0,
    size = 20,
} = {}) {
    const response = await request('/api/admin/encyclopedia/available-entities', {
        query: {
            q: String(q || '').trim(),
            entityType,
            page,
            size,
        },
    });
    return normalizeAvailableEntitiesPage(response);
}

export async function getEncyclopediaEditor(entityId) {
    const response = await request(`/api/admin/encyclopedia/${entityId}`);
    return normalizeEditorResponse(response);
}

export async function updateEncyclopediaMetadata(entityId, { summary }) {
    const response = await request(`/api/admin/encyclopedia/${entityId}/metadata`, {
        method: 'PUT',
        body: { summary },
    });
    return normalizeEditorResponse(response);
}

export async function saveEncyclopediaDraft(entityId, markdownContent) {
    const response = await request(`/api/admin/encyclopedia/${entityId}/draft`, {
        method: 'PUT',
        body: { markdown_content: markdownContent },
    });
    return normalizeEditorResponse(response);
}

export async function previewEncyclopediaDraft(entityId, markdownContent) {
    const response = await request(`/api/admin/encyclopedia/${entityId}/preview`, {
        method: 'POST',
        body: markdownContent === undefined || markdownContent === null
            ? {}
            : { markdown_content: markdownContent },
    });
    return normalizePreviewResponse(response);
}

export async function publishEncyclopediaDraft(entityId, markdownContent) {
    const response = await request(`/api/admin/encyclopedia/${entityId}/publish`, {
        method: 'PUT',
        body: markdownContent === undefined || markdownContent === null
            ? {}
            : { markdown_content: markdownContent },
    });
    return normalizeEditorResponse(response);
}

export async function updateEncyclopediaInfobox(entityId, fields) {
    const response = await request(`/api/admin/encyclopedia/${entityId}/infobox`, {
        method: 'PUT',
        body: {
            fields: normalizeInfoboxPayload(fields),
        },
    });
    return normalizeEditorResponse(response);
}

export async function updateEncyclopediaRelations(entityId, relations) {
    const response = await request(`/api/admin/encyclopedia/${entityId}/relations`, {
        method: 'PUT',
        body: {
            relations: normalizeRelationsPayload(relations),
        },
    });
    return normalizeEditorResponse(response);
}

export async function archiveEncyclopediaArticle(entityId) {
    const response = await request(`/api/admin/encyclopedia/${entityId}/archive`, {
        method: 'PUT',
    });
    return normalizeEditorResponse(response);
}
