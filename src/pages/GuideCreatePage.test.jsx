import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import GuideCreatePage from './GuideCreatePage';

describe('GuideCreatePage', () => {
    it('asks for a subject type before showing a catalog', () => {
        render(<MemoryRouter><GuideCreatePage /></MemoryRouter>);

        expect(screen.getByRole('heading', { name: 'What is your guide about?' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Mod/ })).toHaveAttribute('href', '/mods?guideTarget=1');
        expect(screen.getByRole('link', { name: /Submarine/ })).toHaveAttribute('href', '/submarines?guideTarget=1');
        expect(screen.getByRole('link', { name: /Encyclopedia subject/ })).toHaveAttribute(
            'href',
            '/encyclopedia?guideTarget=1',
        );
        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });
});
