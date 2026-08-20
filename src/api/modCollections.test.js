import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    analyseCollection,
    collectionExportFilename,
    createCollection,
    exportCollectionXml,
    getCollection,
    normalizeWorkshopIds,
} from './modCollections';

function jsonResponse(body, { ok = true, status = 200 } = {}) {
    return {
        ok,
        status,
        text: async () => JSON.stringify(body),
    };
}

function textResponse(text, { ok = true, status = 200 } = {}) {
    return { ok, status, text: async () => text };
}

function lastCall() {
    return global.fetch.mock.calls.at(-1);
}

function lastBody() {
    return JSON.parse(lastCall()[1].body);
}

beforeEach(() => {
    global.fetch = vi.fn();
    const values = new Map();
    vi.stubGlobal('localStorage', {
        clear: () => values.clear(),
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => values.set(key, String(value)),
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('analyseCollection', () => {
    it('sends the ids the backend expects and unpacks the answer', async () => {
        global.fetch.mockResolvedValue(jsonResponse({
            order: [
                { package_id: 'p2', external_id: 20, name: 'Patch', position: 1, reason: 'patches Base' },
                { package_id: 'p1', external_id: 10, name: 'Base', position: 2, reason: '' },
            ],
            missing: [{
                package_id: 'p3',
                external_id: 30,
                name: 'Lua',
                needed_by: 'Patch',
                hard: true,
                alternatives: ['Other Lua'],
            }],
            problems: [{
                type: 'OUTDATED',
                severity: 'NOTICE',
                summary: 'Built for an older game',
                packages: ['Base'],
            }],
            unknown_workshop_ids: [40],
            content_packages_xml: '<contentpackages />',
        }));

        const analysis = await analyseCollection([20, 10, 40]);

        const [url, options] = lastCall();
        expect(url).toContain('/api/mod-collections/analyse');
        expect(options.method).toBe('POST');
        expect(lastBody()).toEqual({ workshop_ids: [20, 10, 40] });

        expect(analysis.order.map((entry) => entry.externalId)).toEqual([20, 10]);
        expect(analysis.order[0].reason).toBe('patches Base');
        expect(analysis.missing[0]).toMatchObject({ neededBy: 'Patch', hard: true, alternatives: ['Other Lua'] });
        expect(analysis.problems[0]).toMatchObject({ type: 'OUTDATED', severity: 'NOTICE' });
        expect(analysis.unknownWorkshopIds).toEqual([40]);
        expect(analysis.contentPackagesXml).toBe('<contentpackages />');
    });

    it('keeps how many items were borrowed, in either spelling', async () => {
        // счёт отделяет «взяли один предмет» от «построено вокруг мода»;
        // без него обе строки на экране одинаковы
        global.fetch.mockResolvedValue(jsonResponse({
            missing: [
                { external_id: 10, name: 'Snake', hard: false, used_content: 56 },
                { external_id: 20, name: 'Camel', hard: false, usedContent: 7 },
                { external_id: 30, name: 'Silent', hard: false },
            ],
        }));

        const analysis = await analyseCollection([10]);

        expect(analysis.missing.map((entry) => entry.usedContent)).toEqual([56, 7, 0]);
    });

    it('survives a response with nothing in it', async () => {
        global.fetch.mockResolvedValue(jsonResponse({}));

        const analysis = await analyseCollection([10]);

        expect(analysis).toEqual({
            order: [],
            missing: [],
            problems: [],
            unknownWorkshopIds: [],
            contentPackagesXml: '',
        });
    });
});

describe('normalizeWorkshopIds', () => {
    it('keeps the order the author gave and drops repeats and junk', () => {
        expect(normalizeWorkshopIds([30, 10, 30, null, 'nope', '20'])).toEqual([30, 10, 20]);
    });
});

describe('createCollection', () => {
    it('sends snake_case fields, with blanks as null', async () => {
        global.fetch.mockResolvedValue(jsonResponse({ id: 'c1', slug: 'my-setup', items: [] }));

        await createCollection({
            title: '  My Setup  ',
            description: '',
            gameVersion: '1.13.4.0',
            workshopIds: [10, 20],
        });

        expect(lastBody()).toEqual({
            title: 'My Setup',
            description: null,
            game_version: '1.13.4.0',
            workshop_ids: [10, 20],
        });
    });

    it('passes the message through when the site does not have a mod', async () => {
        global.fetch.mockResolvedValue(jsonResponse(
            { message: 'Mod 404 is not on the site, so it cannot go into a collection' },
            { ok: false, status: 400 },
        ));

        await expect(createCollection({ title: 'Setup', workshopIds: [404] }))
            .rejects.toMatchObject({
                status: 400,
                message: 'Mod 404 is not on the site, so it cannot go into a collection',
            });
    });
});

describe('getCollection', () => {
    it('orders items by position and keeps an unknown mod flagged', async () => {
        global.fetch.mockResolvedValue(jsonResponse({
            id: 'c1',
            slug: 'my-setup',
            title: 'My Setup',
            game_version: '1.13.4.0',
            status: 'ACTIVE',
            items: [
                { workshop_id: 10, name: 'Base', position: 2, added_reason: 'USER', known: false },
                { workshop_id: 20, name: 'Patch', position: 1, added_reason: 'USER', known: true },
            ],
        }));

        const collection = await getCollection('my-setup');

        expect(collection.items.map((item) => item.workshopId)).toEqual([20, 10]);
        expect(collection.items[1].known).toBe(false);
        expect(collection.gameVersion).toBe('1.13.4.0');
    });
});

describe('exportCollectionXml', () => {
    it('returns the body as text and carries the token', async () => {
        localStorage.setItem('barolab_token', 'token-123');
        global.fetch.mockResolvedValue(textResponse('<contentpackages>\n</contentpackages>'));

        const xml = await exportCollectionXml('my-setup');

        const [url, options] = lastCall();
        expect(url).toContain('/api/mod-collections/my-setup/export');
        expect(options.headers.Authorization).toBe('Bearer token-123');
        expect(xml).toContain('<contentpackages>');
    });

    it('reports a failure without trying to parse XML as JSON', async () => {
        global.fetch.mockResolvedValue(textResponse('not json', { ok: false, status: 404 }));

        await expect(exportCollectionXml('missing')).rejects.toMatchObject({ status: 404 });
    });

    it('names the file the way the backend does', () => {
        expect(collectionExportFilename('my-setup')).toBe('my-setup-contentpackages.xml');
    });
});
