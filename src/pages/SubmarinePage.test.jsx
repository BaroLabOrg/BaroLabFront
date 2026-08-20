import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubmarinePage from './SubmarinePage';
import * as submarinesApi from '../api/submarines';
import * as tagsApi from '../api/tags';

let authState = {
    isAuthenticated: false,
    isAdmin: false,
    user: null,
};

vi.mock('react-router-dom', () => ({
    Link: ({ children, to, ...props }) => (
        <a href={to} {...props}>
            {children}
        </a>
    ),
    useParams: () => ({ externalId: '42' }),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => authState,
}));

function buildSubmarine(overrides = {}) {
    return {
        externalId: 42,
        title: 'Orca',
        description: 'Attack submarine',
        main_image: 'https://cdn.test/orca-main.jpg',
        additional_images: [
            'https://cdn.test/orca-main.jpg',
            'https://cdn.test/orca-2.jpg',
            'https://cdn.test/orca-3.jpg',
        ],
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
        tags: [{ id: 'tag-1', name: 'Military', slug: 'military' }],
        userId: 'author-1',
        authorUsername: 'captain',
        authorSteamId: '76561198000000000',
        active: true,
        blocked: false,
        createdAt: '2026-01-01T12:00:00.000Z',
        updatedAt: '2026-01-02T12:00:00.000Z',
        ...overrides,
    };
}

describe('SubmarinePage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        authState = {
            isAuthenticated: false,
            isAdmin: false,
            user: null,
        };
    });

     it('loads and renders submarine characteristics with gallery', async () => {
         vi.spyOn(submarinesApi, 'getSubmarine').mockResolvedValue(buildSubmarine());
         vi.spyOn(submarinesApi, 'subscribeSubmarine').mockResolvedValue(undefined);

        render(<SubmarinePage />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Orca' })).toBeInTheDocument();
        });
        expect(screen.getAllByText('Attack submarine')).toHaveLength(2);
        expect(screen.getByText('COILGUN')).toBeInTheDocument();
        expect(screen.getByText('RAILGUN')).toBeInTheDocument();
        expect(screen.getByText('Military')).toBeInTheDocument();
         expect(await screen.findByRole('img', { name: 'Orca - image 1' })).toBeInTheDocument();
         expect(await screen.findByRole('button', { name: 'Show image 2' })).toBeInTheDocument();
         expect(screen.getByRole('button', { name: 'Open in Workshop' })).toBeInTheDocument();
         expect(screen.getByRole('link', { name: "Open captain's Steam profile" })).toHaveAttribute(
             'href',
             'https://steamcommunity.com/profiles/76561198000000000',
         );
         expect(screen.queryByRole('button', { name: '+ Add tag' })).not.toBeInTheDocument();
    });

    it('renders a non-clickable author card when Steam ID is unavailable', async () => {
        vi.spyOn(submarinesApi, 'getSubmarine').mockResolvedValue(buildSubmarine({ authorSteamId: null }));
        vi.spyOn(submarinesApi, 'subscribeSubmarine').mockResolvedValue(undefined);

        render(<SubmarinePage />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Orca' })).toBeInTheDocument();
        });

        expect(screen.getByText('captain')).toBeInTheDocument();
        expect(screen.getByText('BaroLab author')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Steam profile/ })).not.toBeInTheDocument();
    });

     it('shows gallery placeholder when images are missing', async () => {
         vi.spyOn(submarinesApi, 'getSubmarine').mockResolvedValue(buildSubmarine({
             main_image: '',
             additional_images: [],
         }));
         vi.spyOn(submarinesApi, 'subscribeSubmarine').mockResolvedValue(undefined);

        render(<SubmarinePage />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Orca' })).toBeInTheDocument();
        });
        expect(await screen.findByText('No images available.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Show image/i })).not.toBeInTheDocument();
    });

     it('shows tag editor for admins and supports add/remove', async () => {
         const user = userEvent.setup();
         authState = {
            isAuthenticated: true,
            isAdmin: true,
            user: { id: 'admin-1', username: 'admin' },
        };

        vi.spyOn(submarinesApi, 'getSubmarine')
            .mockResolvedValueOnce(buildSubmarine({
                tags: [{ id: 'tag-1', name: 'Military', slug: 'military' }],
            }))
            .mockResolvedValueOnce(buildSubmarine({
                tags: [
                    { id: 'tag-1', name: 'Military', slug: 'military' },
                    { id: 'tag-2', name: 'Fast', slug: 'fast' },
                ],
            }))
            .mockResolvedValueOnce(buildSubmarine({
                tags: [{ id: 'tag-2', name: 'Fast', slug: 'fast' }],
            }));
         vi.spyOn(submarinesApi, 'addSubmarineTag').mockResolvedValue(null);
         vi.spyOn(submarinesApi, 'removeSubmarineTag').mockResolvedValue(null);
         vi.spyOn(submarinesApi, 'subscribeSubmarine').mockResolvedValue(undefined);
        vi.spyOn(tagsApi, 'getTags').mockResolvedValue({
            items: [
                { id: 'tag-1', name: 'Military', slug: 'military' },
                { id: 'tag-2', name: 'Fast', slug: 'fast' },
            ],
        });

        render(<SubmarinePage />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Orca' })).toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: '+ Add tag' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: '+ Add tag' }));
        await user.selectOptions(screen.getByLabelText('Select tag'), 'tag-2');
        await user.click(screen.getByRole('button', { name: 'Add' }));

        await waitFor(() => {
            expect(submarinesApi.addSubmarineTag).toHaveBeenCalledWith('42', 'tag-2');
        });
        await waitFor(() => {
            expect(screen.getByText('Fast')).toBeInTheDocument();
        });

        const removeButtons = screen.getAllByTitle('Remove tag');
        await user.click(removeButtons[0]);

        await waitFor(() => {
            expect(submarinesApi.removeSubmarineTag).toHaveBeenCalledWith('42', 'tag-1');
        });
    });

     it('shows error state when request fails', async () => {
         vi.spyOn(submarinesApi, 'getSubmarine').mockRejectedValue(new Error('Not found'));

        render(<SubmarinePage />);

         expect(await screen.findByText('Not found')).toBeInTheDocument();
         expect(screen.getByRole('link', { name: '← Back to catalog' })).toBeInTheDocument();
     });

    it('calls submarine subscribe action when download button is clicked', async () => {
        const user = userEvent.setup();
        vi.spyOn(submarinesApi, 'getSubmarine').mockResolvedValue(buildSubmarine());
        const subscribeSpy = vi.spyOn(submarinesApi, 'subscribeSubmarine').mockResolvedValue(undefined);

        render(<SubmarinePage />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Orca' })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: 'Open in Workshop' }));

        await waitFor(() => {
            expect(subscribeSpy).toHaveBeenCalledWith('42');
        });
    });
 
    it('shows engine thrust instead of a speed the file cannot state', async () => {
        // скорость -- ответ физического движка, из .sub она не выводится;
        // тяга записана в определении двигателя и складывается без домыслов
        vi.spyOn(submarinesApi, 'getSubmarine').mockResolvedValue(buildSubmarine({
            maxHorizontalSpeedKph: null,
            engineForce: 1100,
        }));
        vi.spyOn(submarinesApi, 'subscribeSubmarine').mockResolvedValue(undefined);

        render(<SubmarinePage />);

        await waitFor(() => {
            expect(screen.getByText('Engine thrust')).toBeInTheDocument();
        });
        expect(screen.getByText('1,100')).toBeInTheDocument();
        expect(screen.queryByText('Max speed (horizontal)')).not.toBeInTheDocument();
    });

    it('leaves out a stat it does not know rather than dangling its unit', async () => {
        // до этого пустое значение рисовалось как «— mk» и «— km/h»
        vi.spyOn(submarinesApi, 'getSubmarine').mockResolvedValue(buildSubmarine({
            price: null,
            cargoCapacity: null,
        }));
        vi.spyOn(submarinesApi, 'subscribeSubmarine').mockResolvedValue(undefined);

        render(<SubmarinePage />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Orca' })).toBeInTheDocument();
        });
        expect(screen.queryByText('Price')).not.toBeInTheDocument();
        expect(screen.queryByText('Cargo capacity')).not.toBeInTheDocument();
        expect(screen.queryByText(/— mk/)).not.toBeInTheDocument();
    });

    it('says so plainly when nobody has read the boat file yet', async () => {
        // так выглядит лодка, которую свип ещё не разобрал: раньше это была
        // сетка нулей, выдававших себя за настоящие цифры
        vi.spyOn(submarinesApi, 'getSubmarine').mockResolvedValue(buildSubmarine({
            submarineClass: null,
            tier: null,
            price: null,
            cargoCapacity: null,
            recommendedCrewMin: null,
            recommendedCrewMax: null,
            recommendedCrewDisplay: null,
            maxHorizontalSpeedKph: null,
            engineForce: null,
            turretSlotCount: null,
            largeTurretSlotCount: null,
            fabricationType: null,
        }));
        vi.spyOn(submarinesApi, 'subscribeSubmarine').mockResolvedValue(undefined);

        render(<SubmarinePage />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Orca' })).toBeInTheDocument();
        });
        expect(screen.getByText(/Nobody has read this submarine/i)).toBeInTheDocument();
        expect(screen.getByText('Community submarine')).toBeInTheDocument();
    });

    it('drops the technical section entirely when it holds nothing', async () => {
        vi.spyOn(submarinesApi, 'getSubmarine').mockResolvedValue(buildSubmarine({
            lengthMeters: null,
            heightMeters: null,
            maxDescentSpeedKph: null,
            maxReactorOutputKw: null,
        }));
        vi.spyOn(submarinesApi, 'subscribeSubmarine').mockResolvedValue(undefined);

        render(<SubmarinePage />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Orca' })).toBeInTheDocument();
        });
        expect(screen.queryByRole('heading', { name: 'Technical parameters' })).not.toBeInTheDocument();
    });
 });
