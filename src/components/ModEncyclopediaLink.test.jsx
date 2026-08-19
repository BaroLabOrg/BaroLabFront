import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ModEncyclopediaLink from './ModEncyclopediaLink';
import { getEncyclopediaList } from '../api/encyclopedia';

vi.mock('../api/encyclopedia', () => ({ getEncyclopediaList: vi.fn() }));

function renderLink(externalId = 3190189044) {
    return render(
        <MemoryRouter>
            <ModEncyclopediaLink externalId={externalId} />
        </MemoryRouter>,
    );
}

beforeEach(() => {
    getEncyclopediaList.mockReset();
});

describe('ModEncyclopediaLink', () => {
    it('links into the encyclopedia filtered to this mod, and counts what is there', async () => {
        getEncyclopediaList.mockResolvedValue({ items: [], total: 12 });

        renderLink();

        const link = await screen.findByRole('link');
        expect(link).toHaveAttribute('href', '/encyclopedia?mod=3190189044');
        expect(screen.getByText('12 entries in the encyclopedia')).toBeInTheDocument();
        expect(getEncyclopediaList).toHaveBeenCalledWith({ mod: 3190189044, size: 1 });
    });

    it('draws nothing for a mod nobody has inventoried', async () => {
        // an empty page would read as "this mod adds nothing", which is a
        // different claim from "nobody has looked at it yet"
        getEncyclopediaList.mockResolvedValue({ items: [], total: 0 });

        const { container } = renderLink();

        await waitFor(() => expect(getEncyclopediaList).toHaveBeenCalled());
        expect(container).toBeEmptyDOMElement();
    });

    it('stays quiet when the request fails', async () => {
        getEncyclopediaList.mockRejectedValue(new Error('down'));

        const { container } = renderLink();

        await waitFor(() => expect(getEncyclopediaList).toHaveBeenCalled());
        expect(container).toBeEmptyDOMElement();
    });

    it('says entry in the singular for exactly one', async () => {
        getEncyclopediaList.mockResolvedValue({ items: [], total: 1 });

        renderLink();

        expect(await screen.findByText('1 entry in the encyclopedia')).toBeInTheDocument();
    });
});
