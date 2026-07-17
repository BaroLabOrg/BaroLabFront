import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SteamAvailabilityBadge from './SteamAvailabilityBadge';

describe('SteamAvailabilityBadge', () => {
    it('shows the Steam availability status and check details', () => {
        render(
            <SteamAvailabilityBadge
                managed
                status="UNAVAILABLE"
                lastCheckedAt="2026-07-17T10:00:00Z"
                failureCount={3}
            />,
        );

        const badge = screen.getByText('Steam: UNAVAILABLE');
        expect(badge).toHaveAttribute('data-status', 'UNAVAILABLE');
        expect(badge).toHaveAttribute('title', expect.stringContaining('consecutive failures: 3'));
    });

    it('distinguishes local content from unknown Steam status', () => {
        render(<SteamAvailabilityBadge managed={false} status="AVAILABLE" />);

        expect(screen.getByText('Steam: NOT TRACKED')).toHaveAttribute('data-status', 'NOT_TRACKED');
    });
});
