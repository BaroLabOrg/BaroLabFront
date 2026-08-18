import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CollectionBuilderPage from './CollectionBuilderPage';
import { analyseCollection, createCollection } from '../api/modCollections';
import { searchMods } from '../api/mods';

vi.mock('../api/modCollections', async (importOriginal) => ({
    ...(await importOriginal()),
    analyseCollection: vi.fn(),
    createCollection: vi.fn(),
    updateCollection: vi.fn(),
    getCollection: vi.fn(),
}));

vi.mock('../api/mods', () => ({ searchMods: vi.fn() }));

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

beforeEach(() => {
    searchMods.mockResolvedValue({ items: [NEUROTRAUMA, PATCH] });
    analyseCollection.mockResolvedValue(analysis());
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
        analyseCollection.mockResolvedValue(analysis({
            order: [{
                packageId: 'p1',
                externalId: NEUROTRAUMA.external_id,
                name: 'Neurotrauma',
                position: 1,
                reason: '',
            }],
            missing: [{
                packageId: 'p9',
                externalId: 2559634234,
                name: 'Barotraumatic',
                neededBy: 'Neurotrauma',
                hard: true,
                alternatives: ['Barotraumatic RU'],
            }],
        }));

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
});
