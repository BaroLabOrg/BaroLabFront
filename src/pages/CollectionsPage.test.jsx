import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CollectionsPage from './CollectionsPage';
import { deleteCollection, getMyCollections } from '../api/modCollections';

vi.mock('../api/modCollections', async (importOriginal) => ({
    ...(await importOriginal()),
    getMyCollections: vi.fn(),
    deleteCollection: vi.fn(),
}));

function collection(overrides = {}) {
    return {
        id: 'c1',
        slug: 'my-setup',
        title: 'Medical overhaul run',
        description: '',
        gameVersion: '1.13.4.0',
        status: 'ACTIVE',
        ownerId: 'author-1',
        createdAt: '',
        updatedAt: '2026-08-01T10:00:00Z',
        items: [
            { workshopId: 1, name: 'A', position: 1, addedReason: 'USER', known: true },
            { workshopId: 2, name: 'B', position: 2, addedReason: 'USER', known: true },
        ],
        ...overrides,
    };
}

function renderPage() {
    return render(<MemoryRouter><CollectionsPage /></MemoryRouter>);
}

beforeEach(() => {
    getMyCollections.mockResolvedValue([collection()]);
});

describe('CollectionsPage', () => {
    it('lists what the author saved', async () => {
        renderPage();

        expect(await screen.findByText('Medical overhaul run')).toBeInTheDocument();
        expect(screen.getByText('2 mods')).toBeInTheDocument();
        expect(screen.getByText('for 1.13.4.0')).toBeInTheDocument();
    });

    it('points at the builder when there is nothing yet', async () => {
        getMyCollections.mockResolvedValue([]);
        renderPage();

        expect(await screen.findByText('Nothing here yet')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Build a collection/i })).toHaveAttribute(
            'href', '/collections/new',
        );
    });

    it('asks before deleting, and drops the row once it is gone', async () => {
        const user = userEvent.setup();
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        deleteCollection.mockResolvedValue(undefined);

        renderPage();
        await screen.findByText('Medical overhaul run');
        await user.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(deleteCollection).toHaveBeenCalledWith('c1'));
        expect(window.confirm).toHaveBeenCalled();
        await waitFor(() => expect(screen.queryByText('Medical overhaul run')).not.toBeInTheDocument());
    });

    it('keeps the row when the delete is refused', async () => {
        const user = userEvent.setup();
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        renderPage();
        await screen.findByText('Medical overhaul run');
        await user.click(screen.getByRole('button', { name: 'Delete' }));

        expect(deleteCollection).not.toHaveBeenCalled();
        expect(screen.getByText('Medical overhaul run')).toBeInTheDocument();
    });
});
