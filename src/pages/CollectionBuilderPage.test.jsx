import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CollectionBuilderPage from './CollectionBuilderPage';
import { analyseCollection, createCollection } from '../api/modCollections';
import { getMod, searchMods } from '../api/mods';
import { searchSubmarines } from '../api/submarines';

vi.mock('../api/modCollections', async (importOriginal) => ({
    ...(await importOriginal()),
    analyseCollection: vi.fn(),
    createCollection: vi.fn(),
    updateCollection: vi.fn(),
    getCollection: vi.fn(),
}));

vi.mock('../api/mods', () => ({ searchMods: vi.fn(), getMod: vi.fn() }));

// Конструктор теперь спрашивает и лодки: без заглушки поиск уйдёт в сеть
vi.mock('../api/submarines', () => ({ searchSubmarines: vi.fn() }));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'author-1' } }),
}));

const NEUROTRAUMA = {
    external_id: 3190189044,
    title: 'Neurotrauma',
    author_username: 'Nice2Live',
    popularity: 120000,
};

const PATCH = {
    external_id: 3222593240,
    title: 'Hungry Europans - Neurotrauma Compatibility Patch',
    author_username: 'Someone',
    popularity: 900,
};

function analysis(overrides = {}) {
    return {
        order: [],
        missing: [],
        problems: [],
        unknownWorkshopIds: [],
        contentPackagesXml: '',
        ...overrides,
    };
}

function renderBuilder() {
    return render(
        <MemoryRouter initialEntries={['/collections/new']}>
            <Routes>
                <Route path="/collections/new" element={<CollectionBuilderPage />} />
                <Route path="/collections/:slug" element={<p>collection page</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

async function addFirstResult(user) {
    await waitFor(() => expect(screen.getByText('Neurotrauma')).toBeInTheDocument());
    await user.click(screen.getAllByRole('button', { name: 'Add' })[0]);
}

function withMissing(externalId, name) {
    return analysis({
        order: [{
            packageId: 'p1',
            externalId: NEUROTRAUMA.external_id,
            name: 'Neurotrauma',
            position: 1,
            reason: '',
        }],
        missing: [{
            packageId: 'p9',
            externalId,
            name,
            neededBy: 'Neurotrauma',
            hard: true,
            alternatives: ['Barotraumatic RU'],
        }],
    });
}

beforeEach(() => {
    searchMods.mockResolvedValue({ items: [NEUROTRAUMA, PATCH] });
    analyseCollection.mockResolvedValue(analysis());
    getMod.mockResolvedValue({ external_id: 2559634234, title: 'Barotraumatic' });
    searchSubmarines.mockResolvedValue({ items: [] });
});

describe('CollectionBuilderPage', () => {
    it('analyses what was added and lists the order with the winner first', async () => {
        const user = userEvent.setup();
        analyseCollection.mockResolvedValue(analysis({
            order: [
                {
                    packageId: 'p2',
                    externalId: PATCH.external_id,
                    name: 'Hungry Europans - Neurotrauma Compatibility Patch',
                    position: 1,
                    reason: 'patches Neurotrauma',
                },
                {
                    packageId: 'p1',
                    externalId: NEUROTRAUMA.external_id,
                    name: 'Neurotrauma',
                    position: 2,
                    reason: '',
                },
            ],
        }));

        renderBuilder();
        await addFirstResult(user);

        await waitFor(() => expect(analyseCollection).toHaveBeenCalledWith([NEUROTRAUMA.external_id]),
            { timeout: 3000 });

        const rows = await screen.findAllByRole('listitem', {}, { timeout: 3000 });
        const ordered = rows.filter((row) => row.classList.contains('ordered-mod'));
        expect(ordered).toHaveLength(2);
        expect(within(ordered[0]).getByText(/Compatibility Patch/)).toBeInTheDocument();
        expect(within(ordered[0]).getByText('patches Neurotrauma')).toBeInTheDocument();
        expect(within(ordered[1]).getByText('Neurotrauma')).toBeInTheDocument();

        // the rule the list must never invert
        expect(screen.getByText(/Top of the list loads first/i)).toBeInTheDocument();
    });

    it('says plainly when the graph knows nothing about a mod', async () => {
        const user = userEvent.setup();
        analyseCollection.mockResolvedValue(analysis({
            unknownWorkshopIds: [NEUROTRAUMA.external_id],
        }));

        renderBuilder();
        await addFirstResult(user);

        expect(await screen.findByText(/Not in the graph yet/i, {}, { timeout: 3000 })).toBeInTheDocument();
        expect(screen.getByText('not analysed')).toBeInTheDocument();
    });

    it('groups problems by how bad they are and says how to fix the Lua one', async () => {
        const user = userEvent.setup();
        analyseCollection.mockResolvedValue(analysis({
            order: [{
                packageId: 'p1',
                externalId: NEUROTRAUMA.external_id,
                name: 'Neurotrauma',
                position: 1,
                reason: '',
            }],
            problems: [
                {
                    type: 'CANNOT_COEXIST',
                    severity: 'BLOCKING',
                    summary: 'Both declare the same item without an override',
                    packages: ['Neurotrauma', 'Other Mod'],
                },
                {
                    type: 'NEEDS_LUA_RUNTIME',
                    severity: 'NOTICE',
                    summary: 'These run Lua or C# and need the LuaCs runtime installed',
                    packages: ['Neurotrauma'],
                },
            ],
        }));

        renderBuilder();
        await addFirstResult(user);

        expect(await screen.findByText('Breaks the game', {}, { timeout: 3000 })).toBeInTheDocument();
        expect(screen.getByText('Worth knowing')).toBeInTheDocument();
        expect(screen.getByText('Cannot be loaded together')).toBeInTheDocument();
        expect(screen.getByText(/Steam launch options/i)).toBeInTheDocument();
    });

    it('offers a missing mod for adding and keeps its alternatives as an any-one-of list', async () => {
        const user = userEvent.setup();
        analyseCollection.mockResolvedValue(withMissing(2559634234, 'Barotraumatic'));

        renderBuilder();
        await addFirstResult(user);

        expect(await screen.findByText('Barotraumatic', {}, { timeout: 3000 })).toBeInTheDocument();
        expect(screen.getByText(/Any one of these does the job instead: Barotraumatic RU/)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Add to collection/i }));

        await waitFor(
            () => expect(analyseCollection).toHaveBeenLastCalledWith([NEUROTRAUMA.external_id, 2559634234]),
            { timeout: 3000 },
        );
    });

    it('refuses on the row itself when the site has no such mod', async () => {
        const user = userEvent.setup();
        // DynamicEuropa is in the graph, but its author tagged it a submarine
        // on Steam, so the site files it outside /mods and the API would
        // refuse it at save time.
        analyseCollection.mockResolvedValue(withMissing(2532991202, 'DynamicEuropa'));
        getMod.mockRejectedValue(Object.assign(new Error('nope'), { status: 404 }));

        renderBuilder();
        await addFirstResult(user);

        await user.click(await screen.findByRole('button', { name: /Add to collection/i }, { timeout: 3000 }));

        expect(await screen.findByText(/does not carry this one as a mod/i)).toBeInTheDocument();
        // and it did not quietly land in the list anyway
        expect(screen.queryByText('DynamicEuropa', { selector: '.selected-mod-title' })).not.toBeInTheDocument();
    });

    it('shows the message the API sends when a mod is not on the site', async () => {
        const user = userEvent.setup();
        createCollection.mockRejectedValue(Object.assign(new Error('nope'), {
            status: 400,
            message: 'Mod 404 is not on the site, so it cannot go into a collection',
        }));

        renderBuilder();
        await addFirstResult(user);

        await user.type(screen.getByPlaceholderText('Medical overhaul run'), 'My Setup');
        await user.click(screen.getByRole('button', { name: /Create collection/i }));

        expect(await screen.findByText(/Mod 404 is not on the site/)).toBeInTheDocument();
    });

    it('will not save a collection with no title', async () => {
        const user = userEvent.setup();
        renderBuilder();
        await addFirstResult(user);

        await user.click(screen.getByRole('button', { name: /Create collection/i }));

        expect(await screen.findByText('Give the collection a title.')).toBeInTheDocument();
        expect(createCollection).not.toHaveBeenCalled();
    });

    it('takes a submarine into the list like any other item', async () => {
        // лодка едет в тот же contentpackages.xml, что и мод
        const user = userEvent.setup();
        searchSubmarines.mockResolvedValue({ items: [
            { external_id: 2951705369, title: 'Barsuk 3.1', popularity: 5000 },
        ] });
        createCollection.mockResolvedValue({ slug: 'fleet' });

        renderBuilder();
        const row = await screen.findByText('Barsuk 3.1');
        await user.click(within(row.closest('li')).getByRole('button', { name: 'Add' }));
        await user.type(screen.getByLabelText(/title/i), 'Fleet');
        await user.click(screen.getByRole('button', { name: 'Create collection' }));

        await waitFor(() => expect(createCollection).toHaveBeenCalledWith(
            expect.objectContaining({ workshopIds: [2951705369] })));
    });

    it('offers mods and submarines in one list, most used first', async () => {
        // разделять их незачем: человек ищет по названию, а не по разделу сайта
        searchSubmarines.mockResolvedValue({ items: [
            { external_id: 2951705369, title: 'Barsuk 3.1', popularity: 999999 },
        ] });

        renderBuilder();

        await screen.findByText('Barsuk 3.1');
        const rows = screen.getAllByRole('listitem').map((row) => row.textContent);
        expect(rows[0]).toContain('Barsuk 3.1');
        expect(rows.some((row) => row.includes('Neurotrauma'))).toBe(true);
    });

    it('says which of the two a row is', async () => {
        searchSubmarines.mockResolvedValue({ items: [
            { external_id: 2951705369, title: 'Barsuk 3.1', popularity: 999999 },
        ] });

        renderBuilder();

        const row = await screen.findByText('Barsuk 3.1');
        expect(row.closest('li').textContent).toContain('Submarine');
    });
});
