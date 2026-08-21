import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CollectionPage from './CollectionPage';
import {
    exportCollectionXml,
    getCollection,
    getCollectionAnalysis,
    resolveCollection,
} from '../api/modCollections';

const auth = vi.hoisted(() => ({ user: { id: 'author-1' } }));

vi.mock('../api/modCollections', async (importOriginal) => ({
    ...(await importOriginal()),
    getCollection: vi.fn(),
    getCollectionAnalysis: vi.fn(),
    resolveCollection: vi.fn(),
    exportCollectionXml: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));

const COLLECTION = {
    id: 'c1',
    slug: 'my-setup',
    title: 'Medical overhaul run',
    description: 'What we play on Tuesdays.',
    gameVersion: '1.13.4.0',
    status: 'ACTIVE',
    ownerId: 'author-1',
    createdAt: '',
    updatedAt: '',
    items: [
        { workshopId: 3222593240, name: 'Compatibility Patch', position: 1, addedReason: 'USER', known: true },
        { workshopId: 3190189044, name: 'Neurotrauma', position: 2, addedReason: 'USER', known: true },
        { workshopId: 999, name: 'Something New', position: 3, addedReason: 'USER', known: false },
    ],
};

const ANALYSIS = {
    order: [
        { packageId: 'p2', externalId: 3222593240, name: 'Compatibility Patch', position: 1, reason: 'patches Neurotrauma' },
        { packageId: 'p1', externalId: 3190189044, name: 'Neurotrauma', position: 2, reason: '' },
    ],
    missing: [],
    problems: [],
    unknownWorkshopIds: [999],
    contentPackagesXml: '<contentpackages>\n  <corepackage path="Content/ContentPackages/Vanilla.xml" />\n</contentpackages>',
};

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/collections/my-setup']}>
            <Routes>
                <Route path="/collections/:slug" element={<CollectionPage />} />
            </Routes>
        </MemoryRouter>,
    );
}

beforeEach(() => {
    auth.user = { id: 'author-1' };
    getCollection.mockResolvedValue(COLLECTION);
    getCollectionAnalysis.mockResolvedValue(ANALYSIS);
});

describe('CollectionPage', () => {
    it('shows the collection and the order the graph worked out', async () => {
        renderPage();

        expect(await screen.findByText('Medical overhaul run')).toBeInTheDocument();
        expect(screen.getByText('What we play on Tuesdays.')).toBeInTheDocument();
        expect(screen.getByText('for 1.13.4.0')).toBeInTheDocument();
        expect(screen.getByText('patches Neurotrauma')).toBeInTheDocument();
    });

    it('warns that mods outside the graph are left out of the downloaded file', async () => {
        renderPage();

        // said twice on purpose: on the row itself, and next to the download
        expect(await screen.findAllByText(/not in the graph yet/i)).toHaveLength(2);
        expect(screen.getByText(/add it in the game by hand/i)).toBeInTheDocument();
    });

    it('falls back to showing the file when the browser cannot download it', async () => {
        const user = userEvent.setup();
        exportCollectionXml.mockResolvedValue(ANALYSIS.contentPackagesXml);

        renderPage();
        await user.click(await screen.findByRole('button', { name: /Download for the game/i }));

        await waitFor(() => expect(exportCollectionXml).toHaveBeenCalledWith('my-setup'));
        expect(await screen.findByText(/corepackage path/)).toBeInTheDocument();
    });

    it('lets the author store the order, and nobody else', async () => {
        const user = userEvent.setup();
        resolveCollection.mockResolvedValue(ANALYSIS);

        const { unmount } = renderPage();
        await user.click(await screen.findByRole('button', { name: /Store this order/i }));
        await waitFor(() => expect(resolveCollection).toHaveBeenCalledWith('c1'));
        unmount();

        auth.user = null;
        renderPage();
        await screen.findByText('Medical overhaul run');
        expect(screen.queryByRole('button', { name: /Store this order/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    });

    it('reports a collection that is not there instead of rendering an empty page', async () => {
        getCollection.mockRejectedValue(Object.assign(new Error('nope'), {
            status: 404,
            message: 'Collection my-setup was not found',
        }));

        renderPage();

        expect(await screen.findByText('Collection not available')).toBeInTheDocument();
        expect(screen.getByText('Collection my-setup was not found')).toBeInTheDocument();
    });

});
