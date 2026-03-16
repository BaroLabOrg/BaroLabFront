import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { mapPaginationError } from '../api/api';
import * as tagsApi from '../api/tags';
import * as submarinesApi from '../api/submarines';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import SubmarineCard from '../components/SubmarineCard';
import TagChips from '../components/TagChips';
import './SubmarinesListPage.css';

const DEFAULT_PAGE_SIZE = 12;
const TAGS_PAGE_SIZE = 100;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_DIRECTION = 'desc';
const DIRECTION_VALUES = ['asc', 'desc'];
const PAGE_SIZE_VALUES = [12, 20, 50, 100];
const SORT_BY_VALUES = [
    'createdAt',
    'updatedAt',
    'title',
    'submarineClass',
    'tier',
    'price',
    'recommendedCrewMin',
    'recommendedCrewMax',
    'cargoCapacity',
    'maxHorizontalSpeedKph',
    'turretSlotCount',
    'largeTurretSlotCount',
    'lengthMeters',
    'heightMeters',
    'maxDescentSpeedKph',
    'maxReactorOutputKw',
    'fabricationType',
];
const SORT_BY_ALIAS = {
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    submarine_class: 'submarineClass',
    recommended_crew_min: 'recommendedCrewMin',
    recommended_crew_max: 'recommendedCrewMax',
    cargo_capacity: 'cargoCapacity',
    max_horizontal_speed_kph: 'maxHorizontalSpeedKph',
    turret_slot_count: 'turretSlotCount',
    large_turret_slot_count: 'largeTurretSlotCount',
    length_meters: 'lengthMeters',
    height_meters: 'heightMeters',
    max_descent_speed_kph: 'maxDescentSpeedKph',
    max_reactor_output_kw: 'maxReactorOutputKw',
    fabrication_type: 'fabricationType',
};

const ADVANCED_SEARCH_PARAM_KEYS = [
    'submarineClass',
    'tier',
    'priceMin',
    'priceMax',
    'recommendedCrewMin',
    'recommendedCrewMax',
    'cargoCapacityMin',
    'cargoCapacityMax',
    'maxHorizontalSpeedKphMin',
    'maxHorizontalSpeedKphMax',
    'turretSlotCount',
    'largeTurretSlotCount',
    'lengthMetersMin',
    'lengthMetersMax',
    'heightMetersMin',
    'heightMetersMax',
    'maxDescentSpeedKphMin',
    'maxDescentSpeedKphMax',
    'maxReactorOutputKwMin',
    'maxReactorOutputKwMax',
    'fabricationType',
    'tags',
    'size',
    'sortBy',
    'direction',
];

const CLASS_LABELS = {
    TRANSPORT: 'TRANSPORT',
    ATTACK: 'ATTACK',
    SCOUT: 'SCOUT',
    DEEP_DIVER: 'DEEP_DIVER',
    SUPPORT: 'SUPPORT',
    OTHER: 'OTHER',
};

const FABRICATION_LABELS = {
    DEFAULT: 'DEFAULT',
    DECONSTRUCTOR_ONLY: 'DECONSTRUCTOR_ONLY',
    SPECIAL: 'SPECIAL',
    OTHER: 'OTHER',
};

function normalizeQuery(value) {
    return String(value || '').trim();
}

function normalizePage(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) return 0;
    return parsed;
}

function normalizeSize(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) return DEFAULT_PAGE_SIZE;
    return parsed;
}

function parseOptionalInteger(value) {
    if (value === null || value === undefined || String(value).trim() === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) return undefined;
    return parsed;
}

function parseOptionalFloat(value) {
    if (value === null || value === undefined || String(value).trim() === '') return undefined;
    const parsed = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(parsed)) return undefined;
    return parsed;
}

function normalizeDirection(value) {
    if (DIRECTION_VALUES.includes(value)) return value;
    return DEFAULT_DIRECTION;
}

function normalizeSortBy(value) {
    const aliasResolved = SORT_BY_ALIAS[value] || value;
    if (SORT_BY_VALUES.includes(aliasResolved)) return aliasResolved;
    return DEFAULT_SORT_BY;
}

function parseEnum(value, options) {
    if (!value) return '';
    const normalized = String(value).trim();
    return options.includes(normalized) ? normalized : '';
}

function parseTags(searchParams) {
    const rawValues = searchParams.getAll('tags');
    const values = rawValues.flatMap((value) =>
        String(value || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
    );
    return [...new Set(values)];
}

function getTagFilterValue(tag) {
    return String(tag?.slug || tag?.name || '').trim();
}

function setParam(params, key, value) {
    if (value === undefined || value === null || value === '') {
        params.delete(key);
        return;
    }
    params.set(key, String(value));
}

function parseRequiredNumber(rawValue, label, { integer = true, min } = {}) {
    const value = String(rawValue || '').trim().replace(',', '.');
    if (!value) {
        throw new Error(`Поле "${label}" обязательно`);
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Поле "${label}" должно быть числом`);
    }
    if (integer && !Number.isInteger(parsed)) {
        throw new Error(`Поле "${label}" должно быть целым числом`);
    }
    if (min !== undefined && parsed < min) {
        throw new Error(`Поле "${label}" должно быть не меньше ${min}`);
    }
    return parsed;
}

function parseOptionalNumber(rawValue, label, { integer = false } = {}) {
    const value = String(rawValue || '').trim().replace(',', '.');
    if (!value) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Поле "${label}" должно быть числом`);
    }
    if (integer && !Number.isInteger(parsed)) {
        throw new Error(`Поле "${label}" должно быть целым числом`);
    }
    return parsed;
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function SubmarinesListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const query = normalizeQuery(searchParams.get('q'));
    const submarineClass = parseEnum(searchParams.get('submarineClass'), submarinesApi.SUBMARINE_CLASS_VALUES);
    const tier = parseOptionalInteger(searchParams.get('tier'));
    const priceMin = parseOptionalInteger(searchParams.get('priceMin'));
    const priceMax = parseOptionalInteger(searchParams.get('priceMax'));
    const recommendedCrewMin = parseOptionalInteger(searchParams.get('recommendedCrewMin'));
    const recommendedCrewMax = parseOptionalInteger(searchParams.get('recommendedCrewMax'));
    const cargoCapacityMin = parseOptionalInteger(searchParams.get('cargoCapacityMin'));
    const cargoCapacityMax = parseOptionalInteger(searchParams.get('cargoCapacityMax'));
    const maxHorizontalSpeedKphMin = parseOptionalFloat(searchParams.get('maxHorizontalSpeedKphMin'));
    const maxHorizontalSpeedKphMax = parseOptionalFloat(searchParams.get('maxHorizontalSpeedKphMax'));
    const turretSlotCount = parseOptionalInteger(searchParams.get('turretSlotCount'));
    const largeTurretSlotCount = parseOptionalInteger(searchParams.get('largeTurretSlotCount'));
    const lengthMetersMin = parseOptionalFloat(searchParams.get('lengthMetersMin'));
    const lengthMetersMax = parseOptionalFloat(searchParams.get('lengthMetersMax'));
    const heightMetersMin = parseOptionalFloat(searchParams.get('heightMetersMin'));
    const heightMetersMax = parseOptionalFloat(searchParams.get('heightMetersMax'));
    const maxDescentSpeedKphMin = parseOptionalFloat(searchParams.get('maxDescentSpeedKphMin'));
    const maxDescentSpeedKphMax = parseOptionalFloat(searchParams.get('maxDescentSpeedKphMax'));
    const maxReactorOutputKwMin = parseOptionalFloat(searchParams.get('maxReactorOutputKwMin'));
    const maxReactorOutputKwMax = parseOptionalFloat(searchParams.get('maxReactorOutputKwMax'));
    const fabricationType = parseEnum(searchParams.get('fabricationType'), submarinesApi.FABRICATION_TYPE_VALUES);
    const selectedTags = parseTags(searchParams);
    const selectedTagsKey = selectedTags.join(',');
    const page = normalizePage(searchParams.get('page'));
    const size = normalizeSize(searchParams.get('size'));
    const sortBy = normalizeSortBy(searchParams.get('sortBy'));
    const direction = normalizeDirection(searchParams.get('direction'));
    const hasAdvancedParamsInUrl = ADVANCED_SEARCH_PARAM_KEYS.some((key) => searchParams.has(key));

    const [submarines, setSubmarines] = useState([]);
    const [totalSubmarines, setTotalSubmarines] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingError, setLoadingError] = useState('');
    const [searchInput, setSearchInput] = useState(query);
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(hasAdvancedParamsInUrl);

    const [allTags, setAllTags] = useState([]);
    const [tagToAdd, setTagToAdd] = useState('');
    const [tagsLoading, setTagsLoading] = useState(true);
    const [tagsError, setTagsError] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        submarineClass: submarinesApi.SUBMARINE_CLASS_VALUES[0],
        tier: '',
        price: '',
        recommendedCrewMin: '',
        recommendedCrewMax: '',
        cargoCapacity: '',
        maxHorizontalSpeedKph: '',
        turretSlotCount: '',
        largeTurretSlotCount: '',
        lengthMeters: '',
        heightMeters: '',
        maxDescentSpeedKph: '',
        maxReactorOutputKw: '',
        fabricationType: '',
        defaultTurretWeapons: [],
        defaultLargeTurretWeapons: [],
    });

    const updateSearch = (patch = {}) => {
        const nextState = {
            q: query,
            submarineClass,
            tier,
            priceMin,
            priceMax,
            recommendedCrewMin,
            recommendedCrewMax,
            cargoCapacityMin,
            cargoCapacityMax,
            maxHorizontalSpeedKphMin,
            maxHorizontalSpeedKphMax,
            turretSlotCount,
            largeTurretSlotCount,
            lengthMetersMin,
            lengthMetersMax,
            heightMetersMin,
            heightMetersMax,
            maxDescentSpeedKphMin,
            maxDescentSpeedKphMax,
            maxReactorOutputKwMin,
            maxReactorOutputKwMax,
            fabricationType,
            tags: selectedTags,
            page,
            size,
            sortBy,
            direction,
            ...patch,
        };

        const nextParams = new URLSearchParams(searchParams);
        setParam(nextParams, 'q', normalizeQuery(nextState.q));
        setParam(nextParams, 'submarineClass', nextState.submarineClass);
        setParam(nextParams, 'tier', nextState.tier);
        setParam(nextParams, 'priceMin', nextState.priceMin);
        setParam(nextParams, 'priceMax', nextState.priceMax);
        setParam(nextParams, 'recommendedCrewMin', nextState.recommendedCrewMin);
        setParam(nextParams, 'recommendedCrewMax', nextState.recommendedCrewMax);
        setParam(nextParams, 'cargoCapacityMin', nextState.cargoCapacityMin);
        setParam(nextParams, 'cargoCapacityMax', nextState.cargoCapacityMax);
        setParam(nextParams, 'maxHorizontalSpeedKphMin', nextState.maxHorizontalSpeedKphMin);
        setParam(nextParams, 'maxHorizontalSpeedKphMax', nextState.maxHorizontalSpeedKphMax);
        setParam(nextParams, 'turretSlotCount', nextState.turretSlotCount);
        setParam(nextParams, 'largeTurretSlotCount', nextState.largeTurretSlotCount);
        setParam(nextParams, 'lengthMetersMin', nextState.lengthMetersMin);
        setParam(nextParams, 'lengthMetersMax', nextState.lengthMetersMax);
        setParam(nextParams, 'heightMetersMin', nextState.heightMetersMin);
        setParam(nextParams, 'heightMetersMax', nextState.heightMetersMax);
        setParam(nextParams, 'maxDescentSpeedKphMin', nextState.maxDescentSpeedKphMin);
        setParam(nextParams, 'maxDescentSpeedKphMax', nextState.maxDescentSpeedKphMax);
        setParam(nextParams, 'maxReactorOutputKwMin', nextState.maxReactorOutputKwMin);
        setParam(nextParams, 'maxReactorOutputKwMax', nextState.maxReactorOutputKwMax);
        setParam(nextParams, 'fabricationType', nextState.fabricationType);

        const normalizedTags = [...new Set((nextState.tags || [])
            .map((tag) => String(tag || '').trim())
            .filter(Boolean))];
        if (normalizedTags.length > 0) {
            nextParams.set('tags', normalizedTags.join(','));
        } else {
            nextParams.delete('tags');
        }

        if (nextState.page > 0) {
            nextParams.set('page', String(nextState.page));
        } else {
            nextParams.delete('page');
        }

        if (nextState.size !== DEFAULT_PAGE_SIZE) {
            nextParams.set('size', String(nextState.size));
        } else {
            nextParams.delete('size');
        }

        if (nextState.sortBy !== DEFAULT_SORT_BY) {
            nextParams.set('sortBy', nextState.sortBy);
        } else {
            nextParams.delete('sortBy');
        }

        if (nextState.direction !== DEFAULT_DIRECTION) {
            nextParams.set('direction', nextState.direction);
        } else {
            nextParams.delete('direction');
        }

        setSearchParams(nextParams);
    };

    const loadSubmarines = async () => {
        setLoading(true);
        setLoadingError('');
        try {
            const response = await submarinesApi.searchSubmarines({
                q: query,
                submarineClass: submarineClass || undefined,
                tier,
                priceMin,
                priceMax,
                recommendedCrewMin,
                recommendedCrewMax,
                cargoCapacityMin,
                cargoCapacityMax,
                maxHorizontalSpeedKphMin,
                maxHorizontalSpeedKphMax,
                turretSlotCount,
                largeTurretSlotCount,
                lengthMetersMin,
                lengthMetersMax,
                heightMetersMin,
                heightMetersMax,
                maxDescentSpeedKphMin,
                maxDescentSpeedKphMax,
                maxReactorOutputKwMin,
                maxReactorOutputKwMax,
                fabricationType: fabricationType || undefined,
                tags: selectedTags,
                page,
                size,
                sortBy,
                direction,
            });
            setSubmarines(response.items);
            setTotalSubmarines(response.total);
            setTotalPages(response.total_pages);
            setHasNext(response.has_next);
            setHasPrevious(response.has_previous);
        } catch (error) {
            setSubmarines([]);
            setTotalSubmarines(0);
            setTotalPages(0);
            setHasNext(false);
            setHasPrevious(false);
            setLoadingError(mapPaginationError(error, 'Не удалось загрузить подлодки'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    useEffect(() => {
        if (hasAdvancedParamsInUrl) {
            setShowAdvancedSearch(true);
        }
    }, [hasAdvancedParamsInUrl]);

    useEffect(() => {
        loadSubmarines();
    }, [
        query,
        submarineClass,
        tier,
        priceMin,
        priceMax,
        recommendedCrewMin,
        recommendedCrewMax,
        cargoCapacityMin,
        cargoCapacityMax,
        maxHorizontalSpeedKphMin,
        maxHorizontalSpeedKphMax,
        turretSlotCount,
        largeTurretSlotCount,
        lengthMetersMin,
        lengthMetersMax,
        heightMetersMin,
        heightMetersMax,
        maxDescentSpeedKphMin,
        maxDescentSpeedKphMax,
        maxReactorOutputKwMin,
        maxReactorOutputKwMax,
        fabricationType,
        selectedTagsKey,
        page,
        size,
        sortBy,
        direction,
    ]);

    useEffect(() => {
        let cancelled = false;

        const loadTags = async () => {
            setTagsLoading(true);
            setTagsError('');
            try {
                const response = await tagsApi.getTags({
                    page: 0,
                    size: TAGS_PAGE_SIZE,
                    sortBy: 'name',
                    direction: 'asc',
                });
                if (!cancelled) {
                    setAllTags(Array.isArray(response.items) ? response.items : []);
                }
            } catch (error) {
                if (!cancelled) {
                    setAllTags([]);
                    setTagsError(mapPaginationError(error, 'Не удалось загрузить теги'));
                }
            } finally {
                if (!cancelled) {
                    setTagsLoading(false);
                }
            }
        };

        loadTags();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        updateSearch({
            q: searchInput,
            page: 0,
        });
    };

    const handleResetFilters = () => {
        setSearchInput('');
        setTagToAdd('');
        setShowAdvancedSearch(false);
        setSearchParams(new URLSearchParams());
    };

    const handlePageChange = (nextPage) => {
        updateSearch({
            page: nextPage,
        });
    };

    const handleFieldChange = (field, value) => {
        updateSearch({
            [field]: value,
            page: 0,
        });
    };

    const handleSortChange = (value) => {
        updateSearch({
            sortBy: value,
            page: 0,
        });
    };

    const handleDirectionChange = (value) => {
        updateSearch({
            direction: value,
            page: 0,
        });
    };

    const handleSizeChange = (value) => {
        updateSearch({
            size: normalizeSize(value),
            page: 0,
        });
    };

    const handleAddTagFilter = () => {
        if (!tagToAdd || selectedTags.includes(tagToAdd)) return;
        updateSearch({
            tags: [...selectedTags, tagToAdd],
            page: 0,
        });
        setTagToAdd('');
    };

    const handleRemoveTagFilter = (tagValue) => {
        updateSearch({
            tags: selectedTags.filter((tag) => tag !== tagValue),
            page: 0,
        });
    };

    const resetCreateForm = () => {
        setCreateForm({
            title: '',
            description: '',
            submarineClass: submarinesApi.SUBMARINE_CLASS_VALUES[0],
            tier: '',
            price: '',
            recommendedCrewMin: '',
            recommendedCrewMax: '',
            cargoCapacity: '',
            maxHorizontalSpeedKph: '',
            turretSlotCount: '',
            largeTurretSlotCount: '',
            lengthMeters: '',
            heightMeters: '',
            maxDescentSpeedKph: '',
            maxReactorOutputKw: '',
            fabricationType: '',
            defaultTurretWeapons: [],
            defaultLargeTurretWeapons: [],
        });
    };

    const handleCreateFieldChange = (field, value) => {
        setCreateForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const toggleCreateArrayValue = (field, value) => {
        setCreateForm((prev) => {
            const current = Array.isArray(prev[field]) ? prev[field] : [];
            const isPresent = current.includes(value);
            return {
                ...prev,
                [field]: isPresent
                    ? current.filter((item) => item !== value)
                    : [...current, value],
            };
        });
    };

    const handleCreateSubmarine = async (event) => {
        event.preventDefault();
        setCreateError('');
        setCreating(true);

        try {
            const title = createForm.title.trim();
            const description = createForm.description.trim();
            if (!title) {
                throw new Error('Поле "Название" обязательно');
            }
            if (!description) {
                throw new Error('Поле "Описание" обязательно');
            }

            const tierValue = parseRequiredNumber(createForm.tier, 'Tier', { integer: true, min: 1 });
            const priceValue = parseRequiredNumber(createForm.price, 'Цена', { integer: true, min: 0 });
            const crewMinValue = parseRequiredNumber(createForm.recommendedCrewMin, 'Мин. экипаж', { integer: true, min: 1 });
            const crewMaxValue = parseRequiredNumber(createForm.recommendedCrewMax, 'Макс. экипаж', { integer: true, min: 1 });
            const cargoValue = parseRequiredNumber(createForm.cargoCapacity, 'Грузоподъёмность', { integer: true, min: 0 });
            const speedValue = parseRequiredNumber(createForm.maxHorizontalSpeedKph, 'Макс. горизонтальная скорость', {
                integer: false,
                min: 0.000001,
            });
            const turretSlotsValue = parseRequiredNumber(createForm.turretSlotCount, 'Обычных слотов турелей', {
                integer: true,
                min: 0,
            });
            const largeTurretSlotsValue = parseRequiredNumber(createForm.largeTurretSlotCount, 'Крупных слотов турелей', {
                integer: true,
                min: 0,
            });
            const lengthMetersValue = parseOptionalNumber(createForm.lengthMeters, 'Длина, м');
            const heightMetersValue = parseOptionalNumber(createForm.heightMeters, 'Высота, м');
            const maxDescentSpeedValue = parseOptionalNumber(createForm.maxDescentSpeedKph, 'Макс. скорость погружения, км/ч');
            const maxReactorOutputValue = parseOptionalNumber(createForm.maxReactorOutputKw, 'Макс. мощность реактора, кВт');

            if (crewMinValue > crewMaxValue) {
                throw new Error('Минимальный экипаж должен быть меньше или равен максимальному');
            }
            if (createForm.defaultTurretWeapons.length > turretSlotsValue) {
                throw new Error('Количество обычных орудий не может превышать число обычных слотов');
            }
            if (createForm.defaultLargeTurretWeapons.length > largeTurretSlotsValue) {
                throw new Error('Количество крупных орудий не может превышать число крупных слотов');
            }

            const created = await submarinesApi.createSubmarine({
                title,
                description,
                submarineClass: createForm.submarineClass,
                tier: tierValue,
                price: priceValue,
                recommendedCrewMin: crewMinValue,
                recommendedCrewMax: crewMaxValue,
                cargoCapacity: cargoValue,
                maxHorizontalSpeedKph: speedValue,
                turretSlotCount: turretSlotsValue,
                largeTurretSlotCount: largeTurretSlotsValue,
                lengthMeters: lengthMetersValue,
                heightMeters: heightMetersValue,
                maxDescentSpeedKph: maxDescentSpeedValue,
                maxReactorOutputKw: maxReactorOutputValue,
                fabricationType: createForm.fabricationType || undefined,
                defaultTurretWeapons: createForm.defaultTurretWeapons,
                defaultLargeTurretWeapons: createForm.defaultLargeTurretWeapons,
            });

            resetCreateForm();
            setShowForm(false);
            const createdExternalId = created?.externalId ?? created?.external_id;
            if (createdExternalId !== undefined && createdExternalId !== null) {
                navigate(`/submarines/${createdExternalId}`);
                return;
            }

            if (page === 0) {
                await loadSubmarines();
            } else {
                updateSearch({ page: 0 });
            }
        } catch (error) {
            setCreateError(error?.message || 'Не удалось создать подлодку');
        } finally {
            setCreating(false);
        }
    };

    const hasActiveFilters = (
        query ||
        submarineClass ||
        tier !== undefined ||
        priceMin !== undefined ||
        priceMax !== undefined ||
        recommendedCrewMin !== undefined ||
        recommendedCrewMax !== undefined ||
        cargoCapacityMin !== undefined ||
        cargoCapacityMax !== undefined ||
        maxHorizontalSpeedKphMin !== undefined ||
        maxHorizontalSpeedKphMax !== undefined ||
        turretSlotCount !== undefined ||
        largeTurretSlotCount !== undefined ||
        lengthMetersMin !== undefined ||
        lengthMetersMax !== undefined ||
        heightMetersMin !== undefined ||
        heightMetersMax !== undefined ||
        maxDescentSpeedKphMin !== undefined ||
        maxDescentSpeedKphMax !== undefined ||
        maxReactorOutputKwMin !== undefined ||
        maxReactorOutputKwMax !== undefined ||
        fabricationType ||
        selectedTags.length > 0 ||
        page > 0 ||
        size !== DEFAULT_PAGE_SIZE ||
        sortBy !== DEFAULT_SORT_BY ||
        direction !== DEFAULT_DIRECTION
    );

    const selectableTags = allTags.filter((tag) => {
        const value = getTagFilterValue(tag);
        return value && !selectedTags.includes(value);
    });

    const selectedTagObjects = selectedTags.map((value) => {
        const selectedTag = allTags.find((tag) => getTagFilterValue(tag) === value);
        if (selectedTag) {
            return {
                id: value,
                name: selectedTag.name || selectedTag.slug || value,
                slug: selectedTag.slug || value,
            };
        }
        return { id: value, name: value, slug: value };
    });

    return (
        <div className="page">
            <div className="container submarines-page">
                <section className="submarines-header-box glass-card shine">
                    <h1 className="submarines-title">Подлодки</h1>
                    <p className="submarines-subtitle">
                        Каталог подлодок сообщества. Всего: {totalSubmarines}
                    </p>
                    {isAuthenticated ? (
                        <div className="submarines-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowForm((prev) => !prev)}
                                id="create-submarine-toggle"
                            >
                                {showForm ? 'Закрыть форму' : 'Добавить подлодку'}
                            </button>
                        </div>
                    ) : (
                        <p className="auth-prompt submarine-auth-prompt">
                            <Link to="/login" className="auth-link">Войдите в аккаунт</Link> или{' '}
                            <Link to="/sign-up" className="auth-link">зарегистрируйтесь</Link>, чтобы добавлять подлодки.
                        </p>
                    )}
                </section>

                <section className="submarines-filters glass-card">
                    <form className="submarines-search-form" onSubmit={handleSearchSubmit}>
                        <label htmlFor="submarines-search-input">Поиск по названию</label>
                        <div className="submarines-search-row">
                            <input
                                id="submarines-search-input"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Введите название подлодки"
                                autoComplete="off"
                            />
                            <button className="btn btn-primary" type="submit" disabled={loading || creating}>
                                Найти
                            </button>
                            <button
                                className="btn btn-ghost"
                                type="button"
                                onClick={handleResetFilters}
                                disabled={!hasActiveFilters || loading || creating}
                            >
                                Сбросить
                            </button>
                        </div>
                        <div className="submarines-advanced-toggle">
                            <button
                                className="btn btn-ghost"
                                type="button"
                                onClick={() => setShowAdvancedSearch((prev) => !prev)}
                                aria-expanded={showAdvancedSearch}
                                aria-controls="submarines-advanced-search"
                            >
                                {showAdvancedSearch ? 'Скрыть расширенный поиск' : 'Расширенный поиск'}
                            </button>
                        </div>
                    </form>

                    {showAdvancedSearch && (
                        <div id="submarines-advanced-search" className="submarines-advanced-search">
                            <div className="submarines-filter-grid">
                        <div className="submarines-filter-group">
                            <h3>Класс и сборка</h3>
                            <label>
                                Класс
                                <select
                                    aria-label="Класс подлодки"
                                    value={submarineClass}
                                    onChange={(event) => handleFieldChange('submarineClass', event.target.value)}
                                >
                                    <option value="">Любой</option>
                                    {submarinesApi.SUBMARINE_CLASS_VALUES.map((value) => (
                                        <option key={value} value={value}>{CLASS_LABELS[value] || value}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Tier
                                <input
                                    aria-label="Tier"
                                    type="number"
                                    min="1"
                                    value={tier ?? ''}
                                    onChange={(event) => handleFieldChange('tier', parseOptionalInteger(event.target.value))}
                                />
                            </label>
                            <label>
                                Тип изготовления
                                <select
                                    aria-label="Тип изготовления"
                                    value={fabricationType}
                                    onChange={(event) => handleFieldChange('fabricationType', event.target.value)}
                                >
                                    <option value="">Любой</option>
                                    {submarinesApi.FABRICATION_TYPE_VALUES.map((value) => (
                                        <option key={value} value={value}>{FABRICATION_LABELS[value] || value}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="submarines-filter-group">
                            <h3>Экономика и экипаж</h3>
                            <div className="submarines-range-row">
                                <label>
                                    Мин. цена
                                    <input
                                        aria-label="Мин. цена"
                                        type="number"
                                        min="0"
                                        value={priceMin ?? ''}
                                        onChange={(event) => handleFieldChange('priceMin', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Макс. цена
                                    <input
                                        aria-label="Макс. цена"
                                        type="number"
                                        min="0"
                                        value={priceMax ?? ''}
                                        onChange={(event) => handleFieldChange('priceMax', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="submarines-range-row">
                                <label>
                                    Мин. экипаж
                                    <input
                                        aria-label="Мин. экипаж"
                                        type="number"
                                        min="1"
                                        value={recommendedCrewMin ?? ''}
                                        onChange={(event) => handleFieldChange('recommendedCrewMin', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Макс. экипаж
                                    <input
                                        aria-label="Макс. экипаж"
                                        type="number"
                                        min="1"
                                        value={recommendedCrewMax ?? ''}
                                        onChange={(event) => handleFieldChange('recommendedCrewMax', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="submarines-range-row">
                                <label>
                                    Мин. грузоподъёмность
                                    <input
                                        aria-label="Мин. грузоподъёмность"
                                        type="number"
                                        min="0"
                                        value={cargoCapacityMin ?? ''}
                                        onChange={(event) => handleFieldChange('cargoCapacityMin', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Макс. грузоподъёмность
                                    <input
                                        aria-label="Макс. грузоподъёмность"
                                        type="number"
                                        min="0"
                                        value={cargoCapacityMax ?? ''}
                                        onChange={(event) => handleFieldChange('cargoCapacityMax', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="submarines-filter-group">
                            <h3>Скорости и реактор</h3>
                            <div className="submarines-range-row">
                                <label>
                                    Мин. скорость (гориз.)
                                    <input
                                        aria-label="Мин. скорость (гориз.)"
                                        type="number"
                                        step="0.1"
                                        value={maxHorizontalSpeedKphMin ?? ''}
                                        onChange={(event) => handleFieldChange('maxHorizontalSpeedKphMin', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Макс. скорость (гориз.)
                                    <input
                                        aria-label="Макс. скорость (гориз.)"
                                        type="number"
                                        step="0.1"
                                        value={maxHorizontalSpeedKphMax ?? ''}
                                        onChange={(event) => handleFieldChange('maxHorizontalSpeedKphMax', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="submarines-range-row">
                                <label>
                                    Мин. скорость погружения
                                    <input
                                        aria-label="Мин. скорость погружения"
                                        type="number"
                                        step="0.1"
                                        value={maxDescentSpeedKphMin ?? ''}
                                        onChange={(event) => handleFieldChange('maxDescentSpeedKphMin', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Макс. скорость погружения
                                    <input
                                        aria-label="Макс. скорость погружения"
                                        type="number"
                                        step="0.1"
                                        value={maxDescentSpeedKphMax ?? ''}
                                        onChange={(event) => handleFieldChange('maxDescentSpeedKphMax', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="submarines-range-row">
                                <label>
                                    Мин. реактор, кВт
                                    <input
                                        aria-label="Мин. реактор, кВт"
                                        type="number"
                                        step="0.1"
                                        value={maxReactorOutputKwMin ?? ''}
                                        onChange={(event) => handleFieldChange('maxReactorOutputKwMin', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Макс. реактор, кВт
                                    <input
                                        aria-label="Макс. реактор, кВт"
                                        type="number"
                                        step="0.1"
                                        value={maxReactorOutputKwMax ?? ''}
                                        onChange={(event) => handleFieldChange('maxReactorOutputKwMax', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="submarines-filter-group">
                            <h3>Размеры и вооружение</h3>
                            <div className="submarines-range-row">
                                <label>
                                    Мин. длина, м
                                    <input
                                        aria-label="Мин. длина, м"
                                        type="number"
                                        step="0.1"
                                        value={lengthMetersMin ?? ''}
                                        onChange={(event) => handleFieldChange('lengthMetersMin', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Макс. длина, м
                                    <input
                                        aria-label="Макс. длина, м"
                                        type="number"
                                        step="0.1"
                                        value={lengthMetersMax ?? ''}
                                        onChange={(event) => handleFieldChange('lengthMetersMax', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="submarines-range-row">
                                <label>
                                    Мин. высота, м
                                    <input
                                        aria-label="Мин. высота, м"
                                        type="number"
                                        step="0.1"
                                        value={heightMetersMin ?? ''}
                                        onChange={(event) => handleFieldChange('heightMetersMin', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Макс. высота, м
                                    <input
                                        aria-label="Макс. высота, м"
                                        type="number"
                                        step="0.1"
                                        value={heightMetersMax ?? ''}
                                        onChange={(event) => handleFieldChange('heightMetersMax', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="submarines-range-row">
                                <label>
                                    Слотов турелей
                                    <input
                                        aria-label="Слотов турелей"
                                        type="number"
                                        min="0"
                                        value={turretSlotCount ?? ''}
                                        onChange={(event) => handleFieldChange('turretSlotCount', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Крупных слотов турелей
                                    <input
                                        aria-label="Крупных слотов турелей"
                                        type="number"
                                        min="0"
                                        value={largeTurretSlotCount ?? ''}
                                        onChange={(event) => handleFieldChange('largeTurretSlotCount', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="submarines-tags-filter">
                        <label htmlFor="submarines-tag-select">Фильтр по тегам</label>
                        <div className="submarines-tag-row">
                            <select
                                id="submarines-tag-select"
                                aria-label="Фильтр по тегам"
                                value={tagToAdd}
                                onChange={(event) => setTagToAdd(event.target.value)}
                                disabled={tagsLoading || selectableTags.length === 0}
                            >
                                <option value="">Выберите тег</option>
                                {selectableTags.map((tag) => {
                                    const value = getTagFilterValue(tag);
                                    return (
                                        <option key={tag.id || value} value={value}>
                                            {tag.name || value}
                                        </option>
                                    );
                                })}
                            </select>
                            <button
                                className="btn btn-ghost"
                                type="button"
                                onClick={handleAddTagFilter}
                                disabled={!tagToAdd || loading || creating}
                            >
                                Добавить тег
                            </button>
                        </div>
                        {tagsLoading && <p className="submarines-tags-meta">Загрузка тегов...</p>}
                        {tagsError && <p className="submarines-tags-error">{tagsError}</p>}
                        <TagChips
                            tags={selectedTagObjects}
                            showRemoveButton
                            onRemove={handleRemoveTagFilter}
                        />
                    </div>

                    <div className="submarines-sort-controls">
                        <label>
                            Сортировка
                            <select
                                aria-label="Сортировка подлодок"
                                value={sortBy}
                                onChange={(event) => handleSortChange(event.target.value)}
                            >
                                {SORT_BY_VALUES.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Направление
                            <select
                                aria-label="Направление сортировки"
                                value={direction}
                                onChange={(event) => handleDirectionChange(event.target.value)}
                            >
                                {DIRECTION_VALUES.map((value) => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Размер страницы
                            <select
                                aria-label="Размер страницы"
                                value={size}
                                onChange={(event) => handleSizeChange(event.target.value)}
                            >
                                {PAGE_SIZE_VALUES.map((value) => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                        </div>
                    )}
                </section>

                {isAuthenticated && showForm && (
                    <form
                        className="create-submarine-form glass-card fade-in"
                        onSubmit={handleCreateSubmarine}
                        aria-label="Форма создания подлодки"
                    >
                        <h2>Новая подлодка</h2>
                        <div className="create-submarine-grid">
                            <label>
                                Название
                                <input
                                    id="submarine-title-input"
                                    value={createForm.title}
                                    onChange={(event) => handleCreateFieldChange('title', event.target.value)}
                                />
                            </label>
                            <label>
                                Класс
                                <select
                                    id="submarine-class-input"
                                    value={createForm.submarineClass}
                                    onChange={(event) => handleCreateFieldChange('submarineClass', event.target.value)}
                                >
                                    {submarinesApi.SUBMARINE_CLASS_VALUES.map((value) => (
                                        <option key={value} value={value}>{CLASS_LABELS[value] || value}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Tier
                                <input
                                    id="submarine-tier-input"
                                    type="number"
                                    min="1"
                                    value={createForm.tier}
                                    onChange={(event) => handleCreateFieldChange('tier', event.target.value)}
                                />
                            </label>
                            <label>
                                Цена
                                <input
                                    id="submarine-price-input"
                                    type="number"
                                    min="0"
                                    value={createForm.price}
                                    onChange={(event) => handleCreateFieldChange('price', event.target.value)}
                                />
                            </label>
                            <label>
                                Мин. экипаж
                                <input
                                    id="submarine-crew-min-input"
                                    type="number"
                                    min="1"
                                    value={createForm.recommendedCrewMin}
                                    onChange={(event) => handleCreateFieldChange('recommendedCrewMin', event.target.value)}
                                />
                            </label>
                            <label>
                                Макс. экипаж
                                <input
                                    id="submarine-crew-max-input"
                                    type="number"
                                    min="1"
                                    value={createForm.recommendedCrewMax}
                                    onChange={(event) => handleCreateFieldChange('recommendedCrewMax', event.target.value)}
                                />
                            </label>
                            <label>
                                Грузоподъёмность
                                <input
                                    id="submarine-cargo-input"
                                    type="number"
                                    min="0"
                                    value={createForm.cargoCapacity}
                                    onChange={(event) => handleCreateFieldChange('cargoCapacity', event.target.value)}
                                />
                            </label>
                            <label>
                                Макс. скорость (гориз.), км/ч
                                <input
                                    id="submarine-speed-input"
                                    type="number"
                                    step="0.1"
                                    min="0.000001"
                                    value={createForm.maxHorizontalSpeedKph}
                                    onChange={(event) => handleCreateFieldChange('maxHorizontalSpeedKph', event.target.value)}
                                />
                            </label>
                            <label>
                                Слотов турелей
                                <input
                                    id="submarine-turret-slots-input"
                                    type="number"
                                    min="0"
                                    value={createForm.turretSlotCount}
                                    onChange={(event) => handleCreateFieldChange('turretSlotCount', event.target.value)}
                                />
                            </label>
                            <label>
                                Крупных слотов турелей
                                <input
                                    id="submarine-large-turret-slots-input"
                                    type="number"
                                    min="0"
                                    value={createForm.largeTurretSlotCount}
                                    onChange={(event) => handleCreateFieldChange('largeTurretSlotCount', event.target.value)}
                                />
                            </label>
                            <label>
                                Длина, м
                                <input
                                    id="submarine-length-input"
                                    type="number"
                                    step="0.1"
                                    value={createForm.lengthMeters}
                                    onChange={(event) => handleCreateFieldChange('lengthMeters', event.target.value)}
                                />
                            </label>
                            <label>
                                Высота, м
                                <input
                                    id="submarine-height-input"
                                    type="number"
                                    step="0.1"
                                    value={createForm.heightMeters}
                                    onChange={(event) => handleCreateFieldChange('heightMeters', event.target.value)}
                                />
                            </label>
                            <label>
                                Макс. скорость погружения, км/ч
                                <input
                                    id="submarine-descent-speed-input"
                                    type="number"
                                    step="0.1"
                                    value={createForm.maxDescentSpeedKph}
                                    onChange={(event) => handleCreateFieldChange('maxDescentSpeedKph', event.target.value)}
                                />
                            </label>
                            <label>
                                Макс. мощность реактора, кВт
                                <input
                                    id="submarine-reactor-output-input"
                                    type="number"
                                    step="0.1"
                                    value={createForm.maxReactorOutputKw}
                                    onChange={(event) => handleCreateFieldChange('maxReactorOutputKw', event.target.value)}
                                />
                            </label>
                            <label>
                                Тип изготовления
                                <select
                                    id="submarine-fabrication-input"
                                    value={createForm.fabricationType}
                                    onChange={(event) => handleCreateFieldChange('fabricationType', event.target.value)}
                                >
                                    <option value="">Не указан</option>
                                    {submarinesApi.FABRICATION_TYPE_VALUES.map((value) => (
                                        <option key={value} value={value}>{FABRICATION_LABELS[value] || value}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <label className="create-submarine-description">
                            Описание
                            <textarea
                                id="submarine-description-input"
                                rows="4"
                                value={createForm.description}
                                onChange={(event) => handleCreateFieldChange('description', event.target.value)}
                            />
                        </label>

                        <div className="create-submarine-weapons">
                            <div className="create-submarine-weapon-block">
                                <h3>Обычные турели</h3>
                                <div className="create-submarine-weapon-grid">
                                    {submarinesApi.TURRET_WEAPON_VALUES.map((weapon) => (
                                        <label key={weapon} className="create-submarine-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={createForm.defaultTurretWeapons.includes(weapon)}
                                                onChange={() => toggleCreateArrayValue('defaultTurretWeapons', weapon)}
                                            />
                                            <span>{weapon}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="create-submarine-weapon-block">
                                <h3>Крупные турели</h3>
                                <div className="create-submarine-weapon-grid">
                                    {submarinesApi.LARGE_TURRET_WEAPON_VALUES.map((weapon) => (
                                        <label key={weapon} className="create-submarine-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={createForm.defaultLargeTurretWeapons.includes(weapon)}
                                                onChange={() => toggleCreateArrayValue('defaultLargeTurretWeapons', weapon)}
                                            />
                                            <span>{weapon}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {createError && <div className="auth-error">{createError}</div>}

                        <button className="btn btn-primary" type="submit" id="submit-submarine" disabled={creating}>
                            {creating ? 'Создание...' : 'Создать подлодку'}
                        </button>
                    </form>
                )}
                {loadingError && <div className="auth-error submarines-load-error">{loadingError}</div>}

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Загрузка подлодок...</p>
                    </div>
                ) : submarines.length === 0 ? (
                    <div className="empty-state">
                        <p>По текущему запросу подлодки не найдены.</p>
                    </div>
                ) : (
                    <section className="submarines-grid">
                        {submarines.map((submarine) => (
                            <SubmarineCard
                                key={submarine.id || submarine.externalId || submarine.external_id}
                                submarine={submarine}
                            />
                        ))}
                    </section>
                )}

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    hasNext={hasNext}
                    hasPrevious={hasPrevious}
                    disabled={loading || creating}
                    onPageChange={handlePageChange}
                />

                <section className="submarines-footnote glass-card">
                    <p>Текущее состояние фильтров сохранено в URL. Дата открытия страницы: {formatDate(new Date())}</p>
                </section>
            </div>
        </div>
    );
}
