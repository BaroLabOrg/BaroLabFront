const UUID_PATTERN = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}';

const REFERENCE_PATTERNS = [
    {
        type: 'guide',
        pattern: new RegExp(`^/guides/(${UUID_PATTERN})$`),
        create: ([, guideId]) => ({ type: 'guide', guideId }),
    },
    {
        type: 'guide',
        pattern: new RegExp(`^/mod/(\\d+)/guides/(${UUID_PATTERN})$`),
        create: ([, modId, guideId]) => ({ type: 'guide', modId, guideId }),
    },
    {
        type: 'mod',
        pattern: /^\/mod\/(\d+)$/,
        create: ([, externalId]) => ({ type: 'mod', externalId }),
    },
    {
        type: 'submarine',
        pattern: /^\/submarines\/(\d+)$/,
        create: ([, externalId]) => ({ type: 'submarine', externalId }),
    },
    {
        type: 'encyclopedia',
        pattern: /^\/encyclopedia\/([a-zA-Z0-9][a-zA-Z0-9_-]*)$/,
        create: ([, slug]) => ({ type: 'encyclopedia', slug }),
    },
];

export const INTERNAL_REFERENCE_TYPES = [
    { id: 'mod', label: 'Mods' },
    { id: 'submarine', label: 'Submarines' },
    { id: 'guide', label: 'Guides' },
    { id: 'encyclopedia', label: 'Encyclopedia' },
];

export function parseInternalGuideLink(href) {
    const value = String(href || '').trim();
    if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
    if (value.includes('?') || value.includes('#')) return null;

    for (const definition of REFERENCE_PATTERNS) {
        const match = value.match(definition.pattern);
        if (match) {
            return {
                ...definition.create(match),
                href: value,
            };
        }
    }

    return null;
}

export function buildInternalGuideLink(type, item) {
    if (type === 'mod') {
        const externalId = item?.external_id ?? item?.externalId;
        return externalId ? `/mod/${externalId}` : null;
    }
    if (type === 'submarine') {
        const externalId = item?.externalId ?? item?.external_id;
        return externalId ? `/submarines/${externalId}` : null;
    }
    if (type === 'guide') {
        return item?.id ? `/guides/${item.id}` : null;
    }
    if (type === 'encyclopedia') {
        return item?.slug ? `/encyclopedia/${item.slug}` : null;
    }
    return null;
}

export function escapeMarkdownLinkLabel(value) {
    return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\r?\n/g, ' ')
        .trim();
}
