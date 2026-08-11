import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import WorkshopAuthorCard from './WorkshopAuthorCard';

describe('WorkshopAuthorCard', () => {
    it('makes the complete card a Steam profile link', () => {
        const { container } = render(
            <WorkshopAuthorCard
                authorName="rav2n"
                authorSteamId="76561198000000000"
                variant="mod"
            />,
        );

        const link = screen.getByRole('link', { name: "Open rav2n's Steam profile" });
        expect(link).toHaveAttribute('href', 'https://steamcommunity.com/profiles/76561198000000000');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveClass('workshop-author-card--mod');
        expect(container.querySelector('.workshop-author-card-copy')).toBeInTheDocument();
    });

    it('uses a non-clickable fallback when Steam ID is missing', () => {
        const { container } = render(
            <WorkshopAuthorCard authorName="Local author" variant="submarine" />,
        );

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.getByText('BaroLab author')).toBeInTheDocument();
        expect(container.querySelector('.workshop-author-card--submarine')).toBeInTheDocument();
    });
});
