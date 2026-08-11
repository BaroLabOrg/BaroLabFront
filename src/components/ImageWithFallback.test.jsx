import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ImageWithFallback from './ImageWithFallback';

describe('ImageWithFallback', () => {
    it('shows a clear fallback when the source is missing', () => {
        render(<ImageWithFallback src="" alt="Submarine preview" />);

        expect(screen.getByRole('img', { name: /submarine preview.*image unavailable/i })).toBeInTheDocument();
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
    });

    it('replaces an image that fails to load and preserves the error callback', () => {
        const onError = vi.fn();
        render(<ImageWithFallback src="https://cdn.example.test/missing.png" alt="Mod cover" onError={onError} />);

        fireEvent.error(screen.getByRole('img', { name: 'Mod cover' }));

        expect(onError).toHaveBeenCalledOnce();
        expect(screen.getByRole('img', { name: /mod cover.*image unavailable/i })).toBeInTheDocument();
    });

    it('tries again when the source changes', () => {
        const { rerender } = render(<ImageWithFallback src="https://cdn.example.test/first.png" alt="Preview" />);
        fireEvent.error(screen.getByRole('img', { name: 'Preview' }));

        rerender(<ImageWithFallback src="https://cdn.example.test/second.png" alt="Preview" />);

        expect(screen.getByRole('img', { name: 'Preview' })).toHaveAttribute(
            'src',
            'https://cdn.example.test/second.png',
        );
    });
});
