import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SubmarinePage from './SubmarinePage';
import * as submarinesApi from '../api/submarines';

vi.mock('react-router-dom', () => ({
    Link: ({ children, to, ...props }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
    useParams: () => ({ externalId: '42' }),
}));

describe('SubmarinePage', () => {
    it('loads and renders submarine characteristics', async () => {
        vi.spyOn(submarinesApi, 'getSubmarine').mockResolvedValue({
            externalId: 42,
            title: 'Orca',
            description: 'Attack submarine',
            submarineClass: 'ATTACK',
            tier: 2,
            price: 2500,
            recommendedCrewMin: 2,
            recommendedCrewMax: 4,
            recommendedCrewDisplay: '2 - 4',
            cargoCapacity: 18,
            maxHorizontalSpeedKph: 30.5,
            turretSlotCount: 3,
            largeTurretSlotCount: 1,
            lengthMeters: 38.2,
            heightMeters: 9.4,
            maxDescentSpeedKph: 21.3,
            maxReactorOutputKw: 510.1,
            fabricationType: 'DEFAULT',
            defaultTurretWeapons: ['COILGUN'],
            defaultLargeTurretWeapons: ['RAILGUN'],
            tags: [{ id: '1', name: 'Military', slug: 'military' }],
            authorUsername: 'captain',
            active: true,
            blocked: false,
            createdAt: '2026-01-01T12:00:00.000Z',
            updatedAt: '2026-01-02T12:00:00.000Z',
        });

        render(<SubmarinePage />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Orca' })).toBeInTheDocument();
        });
        expect(screen.getByText('Attack submarine')).toBeInTheDocument();
        expect(screen.getByText('COILGUN')).toBeInTheDocument();
        expect(screen.getByText('RAILGUN')).toBeInTheDocument();
        expect(screen.getByText('Military')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('shows error state when request fails', async () => {
        vi.spyOn(submarinesApi, 'getSubmarine').mockRejectedValue(new Error('Not found'));

        render(<SubmarinePage />);

        expect(await screen.findByText('Not found')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '← Назад к каталогу' })).toBeInTheDocument();
    });
});
