import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ModPage from './ModPage';
import * as modsApi from '../api/mods';

vi.mock('react-router-dom', () => ({
    Link: ({ children, to, ...props }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
    useParams: () => ({ externalId: '42' }),
}));

vi.mock('../components/ModHero', () => ({
    default: () => <div>ModHero</div>,
}));

vi.mock('../components/UsedInCollections', () => ({
    default: () => <div>UsedInCollections</div>,
}));

vi.mock('../components/GuidesSection', () => ({
    default: () => <div>GuidesSection</div>,
}));

vi.mock('../components/CommentsSection', () => ({
    default: () => <div>CommentsSection</div>,
}));

describe('ModPage tags read-only behavior', () => {
    it('renders only tags from backend mod response', async () => {
        vi.spyOn(modsApi, 'getMod').mockResolvedValue({
            title: 'Test Mod',
            description: 'Desc',
            tags: [
                { id: 1, name: 'Medical', slug: 'medical' },
                { id: 2, name: 'Survival', slug: 'survival' },
            ],
            additional_images: [],
            required_mods: [],
            mods_above: [],
        });

        render(<ModPage />);

        await waitFor(() => {
            expect(screen.getByText('Medical')).toBeInTheDocument();
            expect(screen.getByText('Survival')).toBeInTheDocument();
        });
        expect(screen.queryByText('Server Booster')).not.toBeInTheDocument();
    });

    it('does not render fake attach/create controls on mod page', async () => {
        vi.spyOn(modsApi, 'getMod').mockResolvedValue({
            title: 'Test Mod',
            description: 'Desc',
            tags: [],
            additional_images: [],
            required_mods: [],
            mods_above: [],
        });

        const { container } = render(<ModPage />);

        await waitFor(() => {
            expect(screen.getByText('ModHero')).toBeInTheDocument();
        });

        expect(container.querySelector('.mod-tags-form')).toBeNull();
        expect(screen.queryByLabelText(/добавить тег/i)).not.toBeInTheDocument();
    });
});

