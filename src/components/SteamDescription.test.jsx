import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

    it('turns plain HTTP URLs into safe clickable links', () => {
        render(<SteamDescription source="Discord: https://discord.gg/barolab" />);

        expect(screen.getByRole('link', { name: 'https://discord.gg/barolab' })).toHaveAttribute(
            'href',
            'https://discord.gg/barolab',
        );
    });

    it('does not nest links when a Steam URL tag repeats its address as the label', () => {
        const { container } = render(
            <SteamDescription source="[url=https://example.com]https://example.com[/url]" />,
        );

        expect(screen.getByRole('link', { name: 'https://example.com' })).toHaveAttribute(
            'href',
            'https://example.com/',
        );
        expect(container.querySelector('a a')).toBeNull();
    });

    it('shows the full-description control only when rendered content overflows', async () => {
        const scrollHeight = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(320);
        const clientHeight = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(112);

        render(<SteamDescription source={'Line one\nLine two\nLine three\nLine four\nLine five\nLine six'} />);

        const toggle = await screen.findByRole('button', { name: 'Show full description' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(toggle);
        expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');

        scrollHeight.mockRestore();
        clientHeight.mockRestore();
    });

    it('does not show a toggle for a short description', async () => {
        render(<SteamDescription source="Short description." />);

        await waitFor(() => {
            expect(screen.queryByRole('button', { name: 'Show full description' })).not.toBeInTheDocument();
        });
    });
});
