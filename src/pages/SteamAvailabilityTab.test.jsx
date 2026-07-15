import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SteamAvailabilityTab from './SteamAvailabilityTab';
import {
    getSteamAvailabilityHistory,
    getSteamAvailabilityStatus,
    startSteamAvailabilityCheck,
} from '../api/steamAvailability';

vi.mock('../api/steamAvailability', () => ({
    getSteamAvailabilityHistory: vi.fn(),
    getSteamAvailabilityStatus: vi.fn(),
    startSteamAvailabilityCheck: vi.fn(),
    stopSteamAvailabilityCheck: vi.fn(),
}));

const completedStatus = {
    status: 'COMPLETED',
    run_id: 'run-1',
    trigger_type: 'MANUAL',
    total_records: 20,
    processed_records: 20,
    available_count: 18,
    unavailable_count: 2,
    recovered_count: 1,
    error_count: 0,
    started_at: '2026-07-15T10:00:00Z',
    completed_at: '2026-07-15T10:05:00Z',
};

describe('SteamAvailabilityTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getSteamAvailabilityStatus.mockResolvedValue(completedStatus);
        getSteamAvailabilityHistory.mockResolvedValue({
            since: '2026-07-08T10:00:00Z',
            runs: [completedStatus],
            events: [{
                id: 'event-1',
                content_type: 'MOD',
                external_id: 123,
                title: 'Example mod',
                previous_status: 'AVAILABLE',
                new_status: 'UNAVAILABLE',
                checked_at: '2026-07-15T10:04:00Z',
                message: 'Steam result=9',
            }],
        });
    });

    it('shows current progress and last-week availability changes', async () => {
        render(<SteamAvailabilityTab />);

        expect(await screen.findByText('20 / 20 (100%)')).toBeInTheDocument();
        expect(screen.getByText(/Example mod: AVAILABLE → UNAVAILABLE/)).toBeInTheDocument();
        expect(screen.getByText('Run History (last 7 days)')).toBeInTheDocument();
    });

    it('starts a finite manual check', async () => {
        const user = userEvent.setup();
        startSteamAvailabilityCheck.mockResolvedValue({
            ...completedStatus,
            status: 'RUNNING',
            run_id: 'run-2',
            processed_records: 0,
        });
        render(<SteamAvailabilityTab />);

        const button = await screen.findByRole('button', { name: 'Start Availability Check' });
        await waitFor(() => expect(button).toBeEnabled());
        await user.click(button);

        expect(startSteamAvailabilityCheck).toHaveBeenCalledOnce();
        expect(await screen.findByText('RUNNING')).toBeInTheDocument();
    });
});
