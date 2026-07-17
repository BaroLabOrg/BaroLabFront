import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminPage from './AdminPage';
import * as api from '../api/api';
import * as submarineApi from '../api/submarines';

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ isAdmin: true, isSuperAdmin: false }),
}));

vi.mock('../api/api', () => ({
    getMods: vi.fn(),
    mapPaginationError: vi.fn((error, fallback) => error?.message || fallback),
    activateMod: vi.fn(),
    blockMod: vi.fn(),
    getComments: vi.fn(),
    activateComment: vi.fn(),
    blockComment: vi.fn(),
}));

vi.mock('../api/submarines', () => ({
    SUBMARINE_CLASS_VALUES: ['SCOUT'],
    getSubmarines: vi.fn(),
    activateSubmarine: vi.fn(),
    blockSubmarine: vi.fn(),
}));

vi.mock('../api/modGuides', () => ({}));

const emptyPage = {
    items: [],
    total: 0,
    page: 0,
    size: 10,
    total_pages: 0,
    has_next: false,
    has_previous: false,
};

describe('AdminPage Steam status filters', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.getMods.mockResolvedValue(emptyPage);
        submarineApi.getSubmarines.mockResolvedValue({ ...emptyPage, size: 12 });
    });

    it('passes the selected Steam status to the mods request', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><AdminPage /></MemoryRouter>);

        const filter = await screen.findByLabelText('Steam availability status');
        await user.selectOptions(filter, 'UNAVAILABLE');
        await user.click(screen.getByRole('button', { name: 'Search' }));

        await waitFor(() => expect(api.getMods).toHaveBeenLastCalledWith(
            expect.objectContaining({ steamStatus: 'UNAVAILABLE' }),
        ));
    });

    it('passes NOT_TRACKED to the submarines request', async () => {
        const user = userEvent.setup();
        render(<MemoryRouter><AdminPage /></MemoryRouter>);

        await user.click(screen.getByRole('button', { name: /Submarines/ }));
        const filter = await screen.findByLabelText('Steam availability status');
        await user.selectOptions(filter, 'NOT_TRACKED');
        await user.click(screen.getByRole('button', { name: 'Search' }));

        await waitFor(() => expect(submarineApi.getSubmarines).toHaveBeenLastCalledWith(
            expect.objectContaining({ steamStatus: 'NOT_TRACKED' }),
        ));
    });
});
