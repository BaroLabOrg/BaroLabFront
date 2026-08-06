import { describe, expect, it } from 'vitest';
import {
    buildInternalGuideLink,
    escapeMarkdownLinkLabel,
    parseInternalGuideLink,
} from './internalGuideLinks';

describe('internal guide links', () => {
    it.each([
        ['/mod/123', 'mod'],
        ['/submarines/456', 'submarine'],
        ['/mod/123/guides/123e4567-e89b-42d3-a456-426614174000', 'guide'],
        ['/guides/123e4567-e89b-42d3-a456-426614174000', 'guide'],
        ['/encyclopedia/wrench', 'encyclopedia'],
    ])('accepts %s', (href, type) => {
        expect(parseInternalGuideLink(href)).toMatchObject({ href, type });
    });

    it.each([
        'https://example.com',
        '//example.com/mod/123',
        '/admin',
        '/mod/123?next=https://example.com',
        '/encyclopedia/wrench#section',
        '/mod/not-a-number',
    ])('rejects unsupported destination %s', (href) => {
        expect(parseInternalGuideLink(href)).toBeNull();
    });

    it('builds canonical hrefs from API response aliases', () => {
        expect(buildInternalGuideLink('mod', { external_id: 11 })).toBe('/mod/11');
        expect(buildInternalGuideLink('submarine', { externalId: 22 })).toBe('/submarines/22');
        expect(buildInternalGuideLink('guide', { mod_id: 11, id: 'guide-id' })).toBe('/guides/guide-id');
        expect(buildInternalGuideLink('encyclopedia', { slug: 'wrench' })).toBe('/encyclopedia/wrench');
    });

    it('escapes selected text before inserting a markdown link', () => {
        expect(escapeMarkdownLinkLabel('Use [this]\\tool\nnow')).toBe('Use \\[this\\]\\\\tool now');
    });
});
