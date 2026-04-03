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
        throw new Error(`Field "${label}" is required`);
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Field "${label}" must be a number`);
    }
    if (integer && !Number.isInteger(parsed)) {
        throw new Error(`Field "${label}" must be an integer`);
    }
    if (min !== undefined && parsed < min) {
        throw new Error(`Field "${label}" must be at least ${min}`);
    }
    return parsed;
}

function parseOptionalNumber(rawValue, label, { integer = false } = {}) {
    const value = String(rawValue || '').trim().replace(',', '.');
    if (!value) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Field "${label}" must be a number`);
    }
    if (integer && !Number.isInteger(parsed)) {
        throw new Error(`Field "${label}" must be an integer`);
    }
    return parsed;
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
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
            setLoadingError(mapPaginationError(error, 'Failed to load submarines'));
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
                    setTagsError(mapPaginationError(error, 'Failed to load tags'));
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
                throw new Error('Field "Title" is required');
            }
            if (!description) {
                throw new Error('Field "Description" is required');
            }

            const tierValue = parseRequiredNumber(createForm.tier, 'Tier', { integer: true, min: 1 });
            const priceValue = parseRequiredNumber(createForm.price, 'Price', { integer: true, min: 0 });
            const crewMinValue = parseRequiredNumber(createForm.recommendedCrewMin, 'Min crew', { integer: true, min: 1 });
            const crewMaxValue = parseRequiredNumber(createForm.recommendedCrewMax, 'Max crew', { integer: true, min: 1 });
            const cargoValue = parseRequiredNumber(createForm.cargoCapacity, 'Cargo capacity', { integer: true, min: 0 });
            const speedValue = parseRequiredNumber(createForm.maxHorizontalSpeedKph, 'Max horizontal speed', {
                integer: false,
                min: 0.000001,
            });
            const turretSlotsValue = parseRequiredNumber(createForm.turretSlotCount, 'Regular turret slots', {
                integer: true,
                min: 0,
            });
            const largeTurretSlotsValue = parseRequiredNumber(createForm.largeTurretSlotCount, 'Large turret slots', {
                integer: true,
                min: 0,
            });
            const lengthMetersValue = parseOptionalNumber(createForm.lengthMeters, 'Length, m');
            const heightMetersValue = parseOptionalNumber(createForm.heightMeters, 'Height, m');
            const maxDescentSpeedValue = parseOptionalNumber(createForm.maxDescentSpeedKph, 'Max descent speed, km/h');
            const maxReactorOutputValue = parseOptionalNumber(createForm.maxReactorOutputKw, 'Max reactor output, kW');

            if (crewMinValue > crewMaxValue) {
                throw new Error('Minimum crew must be less than or equal to maximum crew');
            }
            if (createForm.defaultTurretWeapons.length > turretSlotsValue) {
                throw new Error('Number of regular weapons cannot exceed regular turret slots');
            }
            if (createForm.defaultLargeTurretWeapons.length > largeTurretSlotsValue) {
                throw new Error('Number of large weapons cannot exceed large turret slots');
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
            setCreateError(error?.message || 'Failed to create submarine');
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
                    <h1 className="submarines-title">Submarines</h1>
                    <p className="submarines-subtitle">
                        Community submarine catalog. Total: {totalSubmarines}
                    </p>
                    {isAuthenticated ? (
                        <div className="submarines-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowForm((prev) => !prev)}
                                id="create-submarine-toggle"
                            >
                                {showForm ? 'Close form' : 'Add submarine'}
                            </button>
                        </div>
                    ) : (
                        <p className="auth-prompt submarine-auth-prompt">
                            <Link to="/login" className="auth-link">Log in</Link> or{' '}
                            <Link to="/sign-up" className="auth-link">sign up</Link>, to add submarines.
                        </p>
                    )}
                </section>

                <section className="submarines-filters glass-card">
                    <form className="submarines-search-form" onSubmit={handleSearchSubmit}>
                        <label htmlFor="submarines-search-input">Search by title</label>
                        <div className="submarines-search-row">
                            <input
                                id="submarines-search-input"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Enter submarine title"
                                autoComplete="off"
                            />
                            <button className="btn btn-primary" type="submit" disabled={loading || creating}>
                                Search
                            </button>
                            <button
                                className="btn btn-ghost"
                                type="button"
                                onClick={handleResetFilters}
                                disabled={!hasActiveFilters || loading || creating}
                            >
                                Reset
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
                                {showAdvancedSearch ? 'Hide advanced search' : 'Advanced search'}
                            </button>
                        </div>
                    </form>

                    {showAdvancedSearch && (
                        <div id="submarines-advanced-search" className="submarines-advanced-search">
                            <div className="submarines-filter-grid">
                        <div className="submarines-filter-group">
                            <h3>Class and build</h3>
                            <label>
                                Class
                                <select
                                    aria-label="Submarine class"
                                    value={submarineClass}
                                    onChange={(event) => handleFieldChange('submarineClass', event.target.value)}
                                >
                                    <option value="">Any</option>
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
                                Fabrication type
                                <select
                                    aria-label="Fabrication type"
                                    value={fabricationType}
                                    onChange={(event) => handleFieldChange('fabricationType', event.target.value)}
                                >
                                    <option value="">Any</option>
                                    {submarinesApi.FABRICATION_TYPE_VALUES.map((value) => (
                                        <option key={value} value={value}>{FABRICATION_LABELS[value] || value}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="submarines-filter-group">
                            <h3>Economy and crew</h3>
                            <div className="submarines-range-row">
                                <label>
                                    Min price
                                    <input
                                        aria-label="Min price"
                                        type="number"
                                        min="0"
                                        value={priceMin ?? ''}
                                        onChange={(event) => handleFieldChange('priceMin', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Max price
                                    <input
                                        aria-label="Max price"
                                        type="number"
                                        min="0"
                                        value={priceMax ?? ''}
                                        onChange={(event) => handleFieldChange('priceMax', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="submarines-range-row">
                                <label>
                                    Min crew
                                    <input
                                        aria-label="Min crew"
                                        type="number"
                                        min="1"
                                        value={recommendedCrewMin ?? ''}
                                        onChange={(event) => handleFieldChange('recommendedCrewMin', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Max crew
                                    <input
                                        aria-label="Max crew"
                                        type="number"
                                        min="1"
                                        value={recommendedCrewMax ?? ''}
                                        onChange={(event) => handleFieldChange('recommendedCrewMax', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="submarines-range-row">
                                <label>
                                    Min cargo capacity
                                    <input
                                        aria-label="Min cargo capacity"
                                        type="number"
                                        min="0"
                                        value={cargoCapacityMin ?? ''}
                                        onChange={(event) => handleFieldChange('cargoCapacityMin', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Max cargo capacity
                                    <input
                                        aria-label="Max cargo capacity"
                                        type="number"
                                        min="0"
                                        value={cargoCapacityMax ?? ''}
                                        onChange={(event) => handleFieldChange('cargoCapacityMax', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="submarines-filter-group">
                            <h3>Speeds and reactor</h3>
                            <div className="submarines-range-row">
                                <label>
                                    Min speed (horizontal)
                                    <input
                                        aria-label="Min speed (horizontal)"
                                        type="number"
                                        step="0.1"
                                        value={maxHorizontalSpeedKphMin ?? ''}
                                        onChange={(event) => handleFieldChange('maxHorizontalSpeedKphMin', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Max speed (horizontal)
                                    <input
                                        aria-label="Max speed (horizontal)"
                                        type="number"
                                        step="0.1"
                                        value={maxHorizontalSpeedKphMax ?? ''}
                                        onChange={(event) => handleFieldChange('maxHorizontalSpeedKphMax', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="submarines-range-row">
                                <label>
                                    Min descent speed
                                    <input
                                        aria-label="Min descent speed"
                                        type="number"
                                        step="0.1"
                                        value={maxDescentSpeedKphMin ?? ''}
                                        onChange={(event) => handleFieldChange('maxDescentSpeedKphMin', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Max descent speed
                                    <input
                                        aria-label="Max descent speed"
                                        type="number"
                                        step="0.1"
                                        value={maxDescentSpeedKphMax ?? ''}
                                        onChange={(event) => handleFieldChange('maxDescentSpeedKphMax', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="submarines-range-row">
                                <label>
                                    Min reactor, kW
                                    <input
                                        aria-label="Min reactor, kW"
                                        type="number"
                                        step="0.1"
                                        value={maxReactorOutputKwMin ?? ''}
                                        onChange={(event) => handleFieldChange('maxReactorOutputKwMin', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Max reactor, kW
                                    <input
                                        aria-label="Max reactor, kW"
                                        type="number"
                                        step="0.1"
                                        value={maxReactorOutputKwMax ?? ''}
                                        onChange={(event) => handleFieldChange('maxReactorOutputKwMax', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="submarines-filter-group">
                            <h3>Dimensions and weapons</h3>
                            <div className="submarines-range-row">
                                <label>
                                    Min length, m
                                    <input
                                        aria-label="Min length, m"
                                        type="number"
                                        step="0.1"
                                        value={lengthMetersMin ?? ''}
                                        onChange={(event) => handleFieldChange('lengthMetersMin', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Max length, m
                                    <input
                                        aria-label="Max length, m"
                                        type="number"
                                        step="0.1"
                                        value={lengthMetersMax ?? ''}
                                        onChange={(event) => handleFieldChange('lengthMetersMax', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="submarines-range-row">
                                <label>
                                    Min height, m
                                    <input
                                        aria-label="Min height, m"
                                        type="number"
                                        step="0.1"
                                        value={heightMetersMin ?? ''}
                                        onChange={(event) => handleFieldChange('heightMetersMin', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Max height, m
                                    <input
                                        aria-label="Max height, m"
                                        type="number"
                                        step="0.1"
                                        value={heightMetersMax ?? ''}
                                        onChange={(event) => handleFieldChange('heightMetersMax', parseOptionalFloat(event.target.value))}
                                    />
                                </label>
                            </div>
                            <div className="submarines-range-row">
                                <label>
                                    Turret slots
                                    <input
                                        aria-label="Turret slots"
                                        type="number"
                                        min="0"
                                        value={turretSlotCount ?? ''}
                                        onChange={(event) => handleFieldChange('turretSlotCount', parseOptionalInteger(event.target.value))}
                                    />
                                </label>
                                <label>
                                    Large turret slots
                                    <input
                                        aria-label="Large turret slots"
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
                        <label htmlFor="submarines-tag-select">Filter by tags</label>
                        <div className="submarines-tag-row">
                            <select
                                id="submarines-tag-select"
                                aria-label="Filter by tags"
                                value={tagToAdd}
                                onChange={(event) => setTagToAdd(event.target.value)}
                                disabled={tagsLoading || selectableTags.length === 0}
                            >
                                <option value="">Select tag</option>
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
                                Add tag
                            </button>
                        </div>
                        {tagsLoading && <p className="submarines-tags-meta">Loading tags...</p>}
                        {tagsError && <p className="submarines-tags-error">{tagsError}</p>}
                        <TagChips
                            tags={selectedTagObjects}
                            showRemoveButton
                            onRemove={handleRemoveTagFilter}
                        />
                    </div>

                    <div className="submarines-sort-controls">
                        <label>
                            Sorting
                            <select
                                aria-label="Submarine sorting"
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
                            Direction
                            <select
                                aria-label="Sort direction"
                                value={direction}
                                onChange={(event) => handleDirectionChange(event.target.value)}
                            >
                                {DIRECTION_VALUES.map((value) => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Page size
                            <select
                                aria-label="Page size"
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
                        aria-label="Submarine creation form"
                    >
                        <h2>New submarine</h2>
                        <div className="create-submarine-grid">
                            <label>
                                Title
                                <input
                                    id="submarine-title-input"
                                    value={createForm.title}
                                    onChange={(event) => handleCreateFieldChange('title', event.target.value)}
                                />
                            </label>
                            <label>
                                Class
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
                                Price
                                <input
                                    id="submarine-price-input"
                                    type="number"
                                    min="0"
                                    value={createForm.price}
                                    onChange={(event) => handleCreateFieldChange('price', event.target.value)}
                                />
                            </label>
                            <label>
                                Min crew
                                <input
                                    id="submarine-crew-min-input"
                                    type="number"
                                    min="1"
                                    value={createForm.recommendedCrewMin}
                                    onChange={(event) => handleCreateFieldChange('recommendedCrewMin', event.target.value)}
                                />
                            </label>
                            <label>
                                Max crew
                                <input
                                    id="submarine-crew-max-input"
                                    type="number"
                                    min="1"
                                    value={createForm.recommendedCrewMax}
                                    onChange={(event) => handleCreateFieldChange('recommendedCrewMax', event.target.value)}
                                />
                            </label>
                            <label>
                                Cargo capacity
                                <input
                                    id="submarine-cargo-input"
                                    type="number"
                                    min="0"
                                    value={createForm.cargoCapacity}
                                    onChange={(event) => handleCreateFieldChange('cargoCapacity', event.target.value)}
                                />
                            </label>
                            <label>
                                Max speed (horizontal), km/h
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
                                Turret slots
                                <input
                                    id="submarine-turret-slots-input"
                                    type="number"
                                    min="0"
                                    value={createForm.turretSlotCount}
                                    onChange={(event) => handleCreateFieldChange('turretSlotCount', event.target.value)}
                                />
                            </label>
                            <label>
                                Large turret slots
                                <input
                                    id="submarine-large-turret-slots-input"
                                    type="number"
                                    min="0"
                                    value={createForm.largeTurretSlotCount}
                                    onChange={(event) => handleCreateFieldChange('largeTurretSlotCount', event.target.value)}
                                />
                            </label>
                            <label>
                                Length, m
                                <input
                                    id="submarine-length-input"
                                    type="number"
                                    step="0.1"
                                    value={createForm.lengthMeters}
                                    onChange={(event) => handleCreateFieldChange('lengthMeters', event.target.value)}
                                />
                            </label>
                            <label>
                                Height, m
                                <input
                                    id="submarine-height-input"
                                    type="number"
                                    step="0.1"
                                    value={createForm.heightMeters}
                                    onChange={(event) => handleCreateFieldChange('heightMeters', event.target.value)}
                                />
                            </label>
                            <label>
                                Max descent speed, km/h
                                <input
                                    id="submarine-descent-speed-input"
                                    type="number"
                                    step="0.1"
                                    value={createForm.maxDescentSpeedKph}
                                    onChange={(event) => handleCreateFieldChange('maxDescentSpeedKph', event.target.value)}
                                />
                            </label>
                            <label>
                                Max reactor output, kW
                                <input
                                    id="submarine-reactor-output-input"
                                    type="number"
                                    step="0.1"
                                    value={createForm.maxReactorOutputKw}
                                    onChange={(event) => handleCreateFieldChange('maxReactorOutputKw', event.target.value)}
                                />
                            </label>
                            <label>
                                Fabrication type
                                <select
                                    id="submarine-fabrication-input"
                                    value={createForm.fabricationType}
                                    onChange={(event) => handleCreateFieldChange('fabricationType', event.target.value)}
                                >
                                    <option value="">Not specified</option>
                                    {submarinesApi.FABRICATION_TYPE_VALUES.map((value) => (
                                        <option key={value} value={value}>{FABRICATION_LABELS[value] || value}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <label className="create-submarine-description">
                            Description
                            <textarea
                                id="submarine-description-input"
                                rows="4"
                                value={createForm.description}
                                onChange={(event) => handleCreateFieldChange('description', event.target.value)}
                            />
                        </label>

                        <div className="create-submarine-weapons">
                            <div className="create-submarine-weapon-block">
                                <h3>Regular turrets</h3>
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
                                <h3>Large turrets</h3>
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
                            {creating ? 'Creating...' : 'Create submarine'}
                        </button>
                    </form>
                )}
                {loadingError && <div className="auth-error submarines-load-error">{loadingError}</div>}

                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Loading submarines...</p>
                    </div>
                ) : submarines.length === 0 ? (
                    <div className="empty-state">
                        <p>No submarines found for the current query.</p>
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
                    <p>Current filter state is stored in the URL. Page open date: {formatDate(new Date())}</p>
                </section>
            </div>
        </div>
    );
}

