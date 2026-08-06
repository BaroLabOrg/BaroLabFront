import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchInternalReferences } from '../../api/internalReferences';
import InternalLinkPicker from './InternalLinkPicker';

vi.mock('../../api/internalReferences', () => ({
    searchInternalReferences: vi.fn(),
}));

function searchPage(page = 0) {
    return {
        items: [{
            external_id: 99 + page,
            title: page === 0 ? 'Neurotrauma' : 'Second page mod',
            popularity: 12500,
            created_at: '2021-06-17T00:00:00Z',
        }],
        page,
        total_pages: 3,
        has_next: page < 2,
        has_previous: page > 0,
    };
}

describe('InternalLinkPicker mod search', () => {
    beforeEach(() => {
        searchInternalReferences.mockImplementation((type, query, options) => (
            Promise.resolve(searchPage(options.page))
        ));
    });

    it('uses subscriber sorting by default and supports Steam publication sorting', async () => {
        const user = userEvent.setup();
        render(<InternalLinkPicker open onClose={vi.fn()} onSelect={vi.fn()} />);

        await waitFor(() => {
            expect(searchInternalReferences).toHaveBeenCalledWith('mod', '', {
                page: 0,
                size: 12,
                sortBy: 'popularity',
                direction: 'desc',
            });
        });
        expect(await screen.findByText(/12\.5K subscribers/)).toBeInTheDocument();

        await user.selectOptions(screen.getByLabelText('Sort mods'), 'createdAt:asc');

        await waitFor(() => {
            expect(searchInternalReferences).toHaveBeenLastCalledWith('mod', '', {
                page: 0,
                size: 12,
                sortBy: 'createdAt',
                direction: 'asc',
            });
        });
    });

    it('loads additional result pages without losing the selected sorting', async () => {
        const user = userEvent.setup();
        render(<InternalLinkPicker open onClose={vi.fn()} onSelect={vi.fn()} />);

        await screen.findByText('Page 1 of 3');
        await user.selectOptions(screen.getByLabelText('Sort mods'), 'popularity:asc');
        await waitFor(() => {
            expect(searchInternalReferences).toHaveBeenLastCalledWith('mod', '', {
                page: 0,
                size: 12,
                sortBy: 'popularity',
                direction: 'asc',
            });
        });

        await user.click(screen.getByRole('button', { name: 'Next' }));

        await waitFor(() => {
            expect(searchInternalReferences).toHaveBeenLastCalledWith('mod', '', {
                page: 1,
                size: 12,
                sortBy: 'popularity',
                direction: 'asc',
            });
        });
        expect(await screen.findByText('Second page mod')).toBeInTheDocument();
        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });
});
