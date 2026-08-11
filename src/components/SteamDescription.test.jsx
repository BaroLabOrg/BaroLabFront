import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SteamDescription from './SteamDescription';

describe('SteamDescription', () => {
    it('renders Steam headings, formatting, lists and safe links', () => {
        render(
            <SteamDescription
                source={'[h1]Updated[/h1]\nA [b]formatted[/b] description.\n[list][*]One[*]Two[/list]\n[url=https://steamcommunity.com]Steam[/url]'}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Updated' })).toBeInTheDocument();
        expect(screen.getByText('formatted')).toHaveProperty('tagName', 'STRONG');
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(screen.getByRole('link', { name: 'Steam' })).toHaveAttribute('rel', 'noopener noreferrer nofollow');
    });

    it('does not create unsafe links and keeps their label', () => {
        render(<SteamDescription source="[url=javascript:alert(1)]Do not run[/url]" />);

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.getByText('Do not run')).toBeInTheDocument();
    });

    it('renders HTML-like input as text', () => {
        const { container } = render(<SteamDescription source="<script>alert('xss')</script>" />);

        expect(container.querySelector('script')).toBeNull();
        expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
    });
});
