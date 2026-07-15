import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QuestProvider } from '../context/QuestContext';
import Pagination from './Pagination';

function renderPagination(props, { path = '/catalog', withQuest = false } = {}) {
    const content = <Pagination {...props} />;

    return render(
        <MemoryRouter initialEntries={[path]}>
            {withQuest ? <QuestProvider>{content}</QuestProvider> : content}
        </MemoryRouter>,
    );
}

describe('Pagination', () => {
    beforeEach(() => {
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

    it('always exposes the first and last page with ellipses around a middle range', () => {
        const { container } = renderPagination({
            page: 9,
            totalPages: 20,
            hasNext: true,
            hasPrevious: true,
            onPageChange: vi.fn(),
        });

        expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 20' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 7' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 13' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 10' })).toHaveAttribute('aria-current', 'page');
        expect(container.querySelectorAll('.pagination-ellipsis')).toHaveLength(2);
    });

    it('shows the first seven page numbers before the first ellipsis', () => {
        renderPagination({
            page: 0,
            totalPages: 20,
            hasNext: true,
            hasPrevious: false,
            onPageChange: vi.fn(),
        });

        for (let pageNumber = 1; pageNumber <= 7; pageNumber += 1) {
            expect(screen.getByRole('button', { name: `Page ${pageNumber}` })).toBeInTheDocument();
        }
        expect(screen.queryByRole('button', { name: 'Page 8' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Page 20' })).toBeInTheDocument();
    });

    it('moves directly to the first and last page through their page numbers', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        renderPagination({
            page: 9,
            totalPages: 20,
            hasNext: true,
            hasPrevious: true,
            onPageChange,
        });

        await user.click(screen.getByRole('button', { name: 'Page 1' }));
        await user.click(screen.getByRole('button', { name: 'Page 20' }));

        expect(onPageChange).toHaveBeenNthCalledWith(1, 0);
        expect(onPageChange).toHaveBeenNthCalledWith(2, 19);
    });

    it('corrects a page that is outside the available range', async () => {
        const onPageChange = vi.fn();
        renderPagination({
            page: 25,
            totalPages: 6,
            hasNext: false,
            hasPrevious: true,
            onPageChange,
        });

        await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(5));
    });

    it('keeps the anomalous Back button clickable on the first mods page', async () => {
        const user = userEvent.setup();
        const onPageChange = vi.fn();
        renderPagination({
            page: 0,
            totalPages: 10,
            hasNext: true,
            hasPrevious: false,
            onPageChange,
        }, { path: '/mods', withQuest: true });

        const backButton = screen.getByRole('button', { name: 'Back (anomaly detected)' });
        expect(backButton).toBeEnabled();

        await user.click(backButton);

        expect(screen.getByRole('dialog', { name: 'Anomaly detected' })).toBeInTheDocument();
        expect(onPageChange).not.toHaveBeenCalled();
    });
});
