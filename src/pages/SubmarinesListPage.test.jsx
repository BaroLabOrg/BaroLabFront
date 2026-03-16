import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import SubmarinesListPage from './SubmarinesListPage';
import * as submarinesApi from '../api/submarines';
import * as tagsApi from '../api/tags';

let authState = { isAuthenticated: false };

vi.mock('../api/submarines', () => ({
    searchSubmarines: vi.fn(),
    createSubmarine: vi.fn(),
    SUBMARINE_CLASS_VALUES: ['TRANSPORT', 'ATTACK', 'SCOUT', 'DEEP_DIVER', 'SUPPORT', 'OTHER'],
    FABRICATION_TYPE_VALUES: ['DEFAULT', 'DECONSTRUCTOR_ONLY', 'SPECIAL', 'OTHER'],
    TURRET_WEAPON_VALUES: ['COILGUN', 'CHAIN_GUN', 'PULSE_LASER'],
    LARGE_TURRET_WEAPON_VALUES: ['RAILGUN', 'DOUBLE_COILGUN', 'FLAK_CANNON'],
}));

vi.mock('../api/tags', () => ({
    getTags: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => authState,
}));

function buildSubmarine(externalId, title, overrides = {}) {
    return {
        id: `${externalId}`,
        externalId,
        title,
        description: `${title} description`,
        submarineClass: 'ATTACK',
        tier: 2,
        price: 2500,
        recommendedCrewMin: 2,
        recommendedCrewMax: 4,
        cargoCapacity: 12,
        maxHorizontalSpeedKph: 30.5,
        turretSlotCount: 3,
        largeTurretSlotCount: 1,
        fabricationType: 'DEFAULT',
        active: true,
        blocked: false,
        tags: [],
        ...overrides,
    };
}

function paged(items, overrides = {}) {
    return {
        items,
        total: items.length,
        page: 0,
        size: 12,
        total_pages: 1,
        has_next: false,
        has_previous: false,
        ...overrides,
    };
}

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="submarines-location">{`${location.pathname}${location.search}`}</div>;
}

function renderSubmarinesPage(initialPath = '/submarines') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route
                    path="/submarines"
                    element={(
                        <>
                            <SubmarinesListPage />
                            <LocationProbe />
                        </>
                    )}
                />
                <Route path="/submarines/:externalId" element={<LocationProbe />} />
            </Routes>
        </MemoryRouter>,
    );
}

function getLocation() {
    return screen.getByTestId('submarines-location').textContent || '';
}

function fillCreateSubmarineForm(form) {
    fireEvent.change(within(form).getByLabelText('Название'), { target: { value: 'Kastrull' } });
    fireEvent.change(within(form).getByLabelText('Описание'), { target: { value: 'Attack submarine' } });
    fireEvent.change(within(form).getByLabelText('Tier'), { target: { value: '2' } });
    fireEvent.change(within(form).getByLabelText('Цена'), { target: { value: '2100' } });
    fireEvent.change(within(form).getByLabelText('Мин. экипаж'), { target: { value: '2' } });
    fireEvent.change(within(form).getByLabelText('Макс. экипаж'), { target: { value: '5' } });
    fireEvent.change(within(form).getByLabelText('Грузоподъёмность'), { target: { value: '18' } });
    fireEvent.change(within(form).getByLabelText('Макс. скорость (гориз.), км/ч'), { target: { value: '29.5' } });
    fireEvent.change(within(form).getByLabelText('Слотов турелей'), { target: { value: '3' } });
    fireEvent.change(within(form).getByLabelText('Крупных слотов турелей'), { target: { value: '1' } });
}

const TAGS = [
    { id: '1', name: 'Military', slug: 'military' },
    { id: '2', name: 'Fast', slug: 'fast' },
];

describe('SubmarinesListPage', () => {
    beforeEach(() => {
        authState = { isAuthenticated: false };
        tagsApi.getTags.mockResolvedValue(paged(TAGS, { total: TAGS.length, size: 100 }));
        submarinesApi.searchSubmarines.mockResolvedValue(paged([buildSubmarine(1, 'Typhon')]));
        submarinesApi.createSubmarine.mockResolvedValue({ externalId: 777 });
    });

    it('renders submarines list and requests data', async () => {
        submarinesApi.searchSubmarines.mockResolvedValue(paged([
            buildSubmarine(1, 'Typhon'),
            buildSubmarine(2, 'Orca'),
        ], { total: 2 }));

        renderSubmarinesPage();

        await waitFor(() => {
            expect(screen.getByText('Typhon')).toBeInTheDocument();
            expect(screen.getByText('Orca')).toBeInTheDocument();
        });

        expect(submarinesApi.searchSubmarines).toHaveBeenCalledWith(expect.objectContaining({
            q: '',
            page: 0,
            size: 12,
            sortBy: 'createdAt',
            direction: 'desc',
            tags: [],
        }));
    });

    it('restores filters from URL query params', async () => {
        renderSubmarinesPage('/submarines?q=orca&submarineClass=ATTACK&tier=2&priceMin=1000&priceMax=3000&tags=military,fast&page=1&size=20&sortBy=price&direction=asc');

        await waitFor(() => {
            expect(submarinesApi.searchSubmarines).toHaveBeenCalledWith(expect.objectContaining({
                q: 'orca',
                submarineClass: 'ATTACK',
                tier: 2,
                priceMin: 1000,
                priceMax: 3000,
                tags: ['military', 'fast'],
                page: 1,
                size: 20,
                sortBy: 'price',
                direction: 'asc',
            }));
        });
        expect(screen.getByDisplayValue('orca')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Скрыть расширенный поиск' })).toBeInTheDocument();
        expect(screen.getByLabelText('Класс подлодки')).toBeInTheDocument();
    });

    it('searches by q and syncs URL', async () => {
        const user = userEvent.setup();
        submarinesApi.searchSubmarines
            .mockResolvedValueOnce(paged([buildSubmarine(1, 'Typhon')]))
            .mockResolvedValueOnce(paged([buildSubmarine(10, 'Orca')], { total: 1 }));

        renderSubmarinesPage();

        await waitFor(() => expect(screen.getByText('Typhon')).toBeInTheDocument());
        await user.clear(screen.getByLabelText('Поиск по названию'));
        await user.type(screen.getByLabelText('Поиск по названию'), 'orca');
        await user.click(screen.getByRole('button', { name: 'Найти' }));

        await waitFor(() => {
            expect(submarinesApi.searchSubmarines).toHaveBeenLastCalledWith(expect.objectContaining({
                q: 'orca',
                page: 0,
            }));
        });
        expect(getLocation()).toContain('?q=orca');
    });

    it('toggles advanced search filters', async () => {
        const user = userEvent.setup();
        renderSubmarinesPage();

        await waitFor(() => expect(submarinesApi.searchSubmarines).toHaveBeenCalled());
        expect(screen.getByRole('button', { name: 'Расширенный поиск' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Класс подлодки')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Расширенный поиск' }));
        expect(screen.getByRole('button', { name: 'Скрыть расширенный поиск' })).toBeInTheDocument();
        expect(screen.getByLabelText('Класс подлодки')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Скрыть расширенный поиск' }));
        expect(screen.getByRole('button', { name: 'Расширенный поиск' })).toBeInTheDocument();
        expect(screen.queryByLabelText('Класс подлодки')).not.toBeInTheDocument();
    });

    it('changes filters and applies multiple params', async () => {
        const user = userEvent.setup();
        submarinesApi.searchSubmarines
            .mockResolvedValueOnce(paged([buildSubmarine(1, 'Typhon')]))
            .mockResolvedValue(paged([buildSubmarine(2, 'Orca')], { total: 1 }));

        renderSubmarinesPage();

        await waitFor(() => expect(screen.getByText('Typhon')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: 'Расширенный поиск' }));

        await user.selectOptions(screen.getByLabelText('Класс подлодки'), 'ATTACK');
        await user.type(screen.getByLabelText('Мин. цена'), '1000');
        await user.type(screen.getByLabelText('Макс. цена'), '3000');
        await user.selectOptions(screen.getByLabelText('Фильтр по тегам'), 'military');
        await user.click(screen.getByRole('button', { name: 'Добавить тег' }));

        await waitFor(() => {
            expect(submarinesApi.searchSubmarines).toHaveBeenLastCalledWith(expect.objectContaining({
                submarineClass: 'ATTACK',
                priceMin: 1000,
                priceMax: 3000,
                tags: ['military'],
                page: 0,
            }));
        });

        const location = getLocation();
        expect(location).toContain('submarineClass=ATTACK');
        expect(location).toContain('priceMin=1000');
        expect(location).toContain('priceMax=3000');
        expect(location).toContain('tags=military');
    });

    it('keeps filters on pagination', async () => {
        const user = userEvent.setup();
        submarinesApi.searchSubmarines
            .mockResolvedValueOnce(paged([buildSubmarine(1, 'Page 1')], {
                total: 15,
                page: 0,
                total_pages: 2,
                has_next: true,
                has_previous: false,
            }))
            .mockResolvedValueOnce(paged([buildSubmarine(2, 'Page 2')], {
                total: 15,
                page: 1,
                total_pages: 2,
                has_next: false,
                has_previous: true,
            }));

        renderSubmarinesPage('/submarines?q=orca&submarineClass=ATTACK');

        await waitFor(() => expect(screen.getByText('Page 1')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: 'Вперед' }));

        await waitFor(() => {
            expect(submarinesApi.searchSubmarines).toHaveBeenLastCalledWith(expect.objectContaining({
                q: 'orca',
                submarineClass: 'ATTACK',
                page: 1,
            }));
        });
        expect(getLocation()).toContain('page=1');
        expect(getLocation()).toContain('q=orca');
    });

    it('changes sorting and size', async () => {
        const user = userEvent.setup();
        renderSubmarinesPage();

        await waitFor(() => expect(submarinesApi.searchSubmarines).toHaveBeenCalled());
        await user.click(screen.getByRole('button', { name: 'Расширенный поиск' }));
        await user.selectOptions(screen.getByLabelText('Сортировка подлодок'), 'price');
        await user.selectOptions(screen.getByLabelText('Направление сортировки'), 'asc');
        await user.selectOptions(screen.getByLabelText('Размер страницы'), '20');

        await waitFor(() => {
            expect(submarinesApi.searchSubmarines).toHaveBeenLastCalledWith(expect.objectContaining({
                sortBy: 'price',
                direction: 'asc',
                size: 20,
                page: 0,
            }));
        });
    });

    it('shows create form only for authenticated users', async () => {
        const firstRender = renderSubmarinesPage();
        await waitFor(() => expect(submarinesApi.searchSubmarines).toHaveBeenCalled());
        expect(screen.queryByRole('button', { name: 'Добавить подлодку' })).not.toBeInTheDocument();
        firstRender.unmount();

        authState = { isAuthenticated: true };
        renderSubmarinesPage();
        await waitFor(() => expect(submarinesApi.searchSubmarines).toHaveBeenCalled());
        expect(screen.getByRole('button', { name: 'Добавить подлодку' })).toBeInTheDocument();
    });

    it('creates submarine successfully', async () => {
        authState = { isAuthenticated: true };
        const user = userEvent.setup();

        renderSubmarinesPage();
        await waitFor(() => expect(submarinesApi.searchSubmarines).toHaveBeenCalled());

        await user.click(screen.getByRole('button', { name: 'Добавить подлодку' }));
        const form = screen.getByRole('form', { name: 'Форма создания подлодки' });
        fillCreateSubmarineForm(form);
        fireEvent.submit(form);

        await waitFor(() => {
            expect(submarinesApi.createSubmarine).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Kastrull',
                description: 'Attack submarine',
                tier: 2,
                price: 2100,
                recommendedCrewMin: 2,
                recommendedCrewMax: 5,
                cargoCapacity: 18,
                maxHorizontalSpeedKph: 29.5,
                turretSlotCount: 3,
                largeTurretSlotCount: 1,
            }));
        });
    });

    it('shows load error', async () => {
        submarinesApi.searchSubmarines.mockRejectedValue({ message: 'Failed to load' });
        renderSubmarinesPage();
        expect(await screen.findByText('Failed to load')).toBeInTheDocument();
    });

    it('shows create error', async () => {
        authState = { isAuthenticated: true };
        submarinesApi.createSubmarine.mockRejectedValue(new Error('Create failed'));
        const user = userEvent.setup();

        renderSubmarinesPage();
        await waitFor(() => expect(submarinesApi.searchSubmarines).toHaveBeenCalled());

        await user.click(screen.getByRole('button', { name: 'Добавить подлодку' }));
        const form = screen.getByRole('form', { name: 'Форма создания подлодки' });
        fillCreateSubmarineForm(form);
        fireEvent.submit(form);

        expect(await screen.findByText('Create failed')).toBeInTheDocument();
    });
});
