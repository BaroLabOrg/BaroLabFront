import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { mapPaginationError } from '../api/api';
import { ENCYCLOPEDIA_ENTITY_TYPES, getEncyclopediaList, getEncyclopediaNavigation } from '../api/encyclopedia';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import './EncyclopediaListPage.css';

const PAGE_SIZE = 12;
const DEFAULT_SORT_BY = 'publishedAt';
const DEFAULT_DIRECTION = 'desc';
const SORT_OPTIONS = ['publishedAt', 'updatedAt', 'title'];
const DIRECTION_OPTIONS = ['desc', 'asc'];

const ENTITY_LABELS = {
    ITEM: 'Предметы',
    AFFLICTION: 'Аффликты',
    CHARACTER: 'Персонажи',
    FACTION: 'Фракции',
    LOCATION: 'Локации',
    SUBMARINE: 'Подлодки',
    CREATURE: 'Существа',
    BIOME: 'Биомы',
    TALENT: 'Таланты',
    JOB: 'Профессии',
    OTHER: 'Прочее',
};

const DEMO_TYPE_SECTIONS = [
    {
        key: 'ITEM',
        label: ENTITY_LABELS.ITEM,
        count: 42,
        primaryBlocks: [
            {
                key: 'Medical',
                label: 'Медицина',
                count: 10,
                secondaryBlocks: [
                    { key: 'Treatment', label: 'Лечение', count: 5 },
                    { key: 'Antidotes', label: 'Антидоты', count: 5 },
                ],
            },
            {
                key: 'Weapons',
                label: 'Оружие',
                count: 12,
                secondaryBlocks: [],
            },
            {
                key: 'Tools',
                label: 'Инструменты',
                count: 10,
                secondaryBlocks: [],
            },
            {
                key: 'Materials',
                label: 'Материалы',
                count: 10,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'AFFLICTION',
        label: ENTITY_LABELS.AFFLICTION,
        count: 19,
        primaryBlocks: [
            {
                key: 'Injuries',
                label: 'Травмы',
                count: 8,
                secondaryBlocks: [],
            },
            {
                key: 'Infections',
                label: 'Инфекции',
                count: 7,
                secondaryBlocks: [
                    { key: 'Husk', label: 'Husk', count: 3 },
                    { key: 'Parasitic', label: 'Паразитические', count: 4 },
                ],
            },
            {
                key: 'Psychological',
                label: 'Психологические',
                count: 4,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'CHARACTER',
        label: ENTITY_LABELS.CHARACTER,
        count: 14,
        primaryBlocks: [
            {
                key: 'Crew Characters',
                label: 'Экипаж',
                count: 5,
                secondaryBlocks: [],
            },
            {
                key: 'Neutral NPCs',
                label: 'Нейтральные NPC',
                count: 5,
                secondaryBlocks: [],
            },
            {
                key: 'Story Characters',
                label: 'Сюжетные',
                count: 4,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'FACTION',
        label: ENTITY_LABELS.FACTION,
        count: 9,
        primaryBlocks: [
            {
                key: 'Major Factions',
                label: 'Крупные фракции',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Local Groups',
                label: 'Локальные группы',
                count: 3,
                secondaryBlocks: [],
            },
            {
                key: 'Hostile Forces',
                label: 'Враждебные силы',
                count: 2,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'LOCATION',
        label: ENTITY_LABELS.LOCATION,
        count: 21,
        primaryBlocks: [
            {
                key: 'Outposts',
                label: 'Аванпосты',
                count: 8,
                secondaryBlocks: [
                    { key: 'City', label: 'Гражданские', count: 4 },
                    { key: 'Military', label: 'Военные', count: 4 },
                ],
            },
            {
                key: 'Ruins',
                label: 'Руины',
                count: 7,
                secondaryBlocks: [
                    { key: 'Alien', label: 'Инопланетные', count: 4 },
                    { key: 'Wreck', label: 'Обломки', count: 3 },
                ],
            },
            {
                key: 'Transit Points',
                label: 'Транзитные точки',
                count: 6,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'SUBMARINE',
        label: ENTITY_LABELS.SUBMARINE,
        count: 13,
        primaryBlocks: [
            {
                key: 'Transport',
                label: 'Транспортные',
                count: 5,
                secondaryBlocks: [],
            },
            {
                key: 'Attack',
                label: 'Атакующие',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Scout',
                label: 'Разведчики',
                count: 4,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'CREATURE',
        label: ENTITY_LABELS.CREATURE,
        count: 18,
        primaryBlocks: [
            {
                key: 'Monsters',
                label: 'Монстры',
                count: 11,
                secondaryBlocks: [
                    { key: 'Abyss', label: 'Бездна', count: 5 },
                    { key: 'Cave', label: 'Пещеры', count: 3 },
                    { key: 'Shallows', label: 'Мелководье', count: 3 },
                ],
            },
            {
                key: 'Humanoids',
                label: 'Гуманоиды',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Pets',
                label: 'Питомцы',
                count: 3,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'BIOME',
        label: ENTITY_LABELS.BIOME,
        count: 9,
        primaryBlocks: [
            {
                key: 'Shallow Regions',
                label: 'Верхние регионы',
                count: 3,
                secondaryBlocks: [],
            },
            {
                key: 'Middle Regions',
                label: 'Средние регионы',
                count: 3,
                secondaryBlocks: [],
            },
            {
                key: 'Abyss Regions',
                label: 'Глубинные регионы',
                count: 3,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'TALENT',
        label: ENTITY_LABELS.TALENT,
        count: 24,
        primaryBlocks: [
            {
                key: 'Captain Tree',
                label: 'Капитан',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Engineer Tree',
                label: 'Инженер',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Mechanic Tree',
                label: 'Механик',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Security Tree',
                label: 'Офицер безопасности',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Medical Tree',
                label: 'Врач',
                count: 4,
                secondaryBlocks: [],
            },
            {
                key: 'Assistant Tree',
                label: 'Ассистент',
                count: 4,
                secondaryBlocks: [],
            },
        ],
    },
    {
        key: 'JOB',
        label: ENTITY_LABELS.JOB,
        count: 12,
        primaryBlocks: [
            {
                key: 'Crew Roles',
                label: 'Роли экипажа',
                count: 6,
                secondaryBlocks: [],
            },
            {
                key: 'Specializations',
                label: 'Специализации',
                count: 6,
                secondaryBlocks: [
                    { key: 'Medical', label: 'Медицинские', count: 2 },
                    { key: 'Engineering', label: 'Инженерные', count: 2 },
                    { key: 'Combat', label: 'Боевые', count: 2 },
                ],
            },
        ],
    },
    {
        key: 'OTHER',
        label: ENTITY_LABELS.OTHER,
        count: 11,
        primaryBlocks: [
            {
                key: 'Mechanics',
                label: 'Механики',
                count: 5,
                secondaryBlocks: [],
            },
            {
                key: 'UI & Symbols',
                label: 'UI и символы',
                count: 3,
                secondaryBlocks: [],
            },
            {
                key: 'Meta Systems',
                label: 'Системные темы',
                count: 3,
                secondaryBlocks: [],
            },
        ],
    },
];

const DEMO_ITEM_POOL = {
    'ITEM|Medical|Treatment': [
        {
            id: 'demo-item-med-1',
            slug: 'bandage',
            title: 'Bandage',
            entityType: 'ITEM',
            primaryCategory: 'Medical',
            secondaryCategory: 'Treatment',
            summary: 'Базовое средство для остановки кровотечения.',
            shortDescription: 'Базовое средство для остановки кровотечения.',
            primaryImageUrl: null,
        },
        {
            id: 'demo-item-med-2',
            slug: 'blood-pack',
            title: 'Blood Pack',
            entityType: 'ITEM',
            primaryCategory: 'Medical',
            secondaryCategory: 'Treatment',
            summary: 'Используется для переливания крови.',
            shortDescription: 'Используется для переливания крови.',
            primaryImageUrl: null,
        },
    ],
    'AFFLICTION|Infections|Husk': [
        {
            id: 'demo-affliction-husk-1',
            slug: 'husk-infection',
            title: 'Husk Infection',
            entityType: 'AFFLICTION',
            primaryCategory: 'Infections',
            secondaryCategory: 'Husk',
            summary: 'Постепенное заражение, требующее срочного лечения.',
            shortDescription: 'Постепенное заражение, требующее срочного лечения.',
            primaryImageUrl: null,
        },
    ],
    'LOCATION|Ruins|Alien': [
        {
            id: 'demo-location-ruins-1',
            slug: 'alien-ruins',
            title: 'Alien Ruins',
            entityType: 'LOCATION',
            primaryCategory: 'Ruins',
            secondaryCategory: 'Alien',
            summary: 'Опасные структуры с ценной добычей.',
            shortDescription: 'Опасные структуры с ценной добычей.',
            primaryImageUrl: null,
        },
    ],
    'SUBMARINE|Transport|': [
        {
            id: 'demo-submarine-transport-1',
            slug: 'orca',
            title: 'Orca',
            entityType: 'SUBMARINE',
            primaryCategory: 'Transport',
            secondaryCategory: '',
            summary: 'Универсальная подлодка для грузовых маршрутов.',
            shortDescription: 'Универсальная подлодка для грузовых маршрутов.',
            primaryImageUrl: null,
        },
    ],
    'CREATURE|Monsters|Abyss': [
        {
            id: 'demo-creature-abyss-1',
            slug: 'charybdis',
            title: 'Charybdis',
            entityType: 'CREATURE',
            primaryCategory: 'Monsters',
            secondaryCategory: 'Abyss',
            summary: 'Крупный хищник глубин.',
            shortDescription: 'Крупный хищник глубин.',
            primaryImageUrl: null,
        },
        {
            id: 'demo-creature-abyss-2',
            slug: 'endworm',
            title: 'Endworm',
            entityType: 'CREATURE',
            primaryCategory: 'Monsters',
            secondaryCategory: 'Abyss',
            summary: 'Опасный абиссальный червь.',
            shortDescription: 'Опасный абиссальный червь.',
            primaryImageUrl: null,
        },
    ],
    'TALENT|Captain Tree|': [
        {
            id: 'demo-talent-captain-1',
            slug: 'inspiring-presence',
            title: 'Inspiring Presence',
            entityType: 'TALENT',
            primaryCategory: 'Captain Tree',
            secondaryCategory: '',
            summary: 'Усиливает эффективность команды рядом с капитаном.',
            shortDescription: 'Усиливает эффективность команды рядом с капитаном.',
            primaryImageUrl: null,
        },
    ],
    'JOB|Crew Roles|': [
        {
            id: 'demo-job-role-1',
            slug: 'captain',
            title: 'Captain',
            entityType: 'JOB',
            primaryCategory: 'Crew Roles',
            secondaryCategory: '',
            summary: 'Координация экипажа и управление миссией.',
            shortDescription: 'Координация экипажа и управление миссией.',
            primaryImageUrl: null,
        },
        {
            id: 'demo-job-role-2',
            slug: 'medical-doctor',
            title: 'Medical Doctor',
            entityType: 'JOB',
            primaryCategory: 'Crew Roles',
            secondaryCategory: '',
            summary: 'Лечение экипажа и контроль аффликтов.',
            shortDescription: 'Лечение экипажа и контроль аффликтов.',
            primaryImageUrl: null,
        },
    ],
    'OTHER|Mechanics|': [
        {
            id: 'demo-other-mechanics-1',
            slug: 'reactor-management',
            title: 'Reactor Management',
            entityType: 'OTHER',
            primaryCategory: 'Mechanics',
            secondaryCategory: '',
            summary: 'Базовые принципы работы реактора и распределения нагрузки.',
            shortDescription: 'Базовые принципы работы реактора и распределения нагрузки.',
            primaryImageUrl: null,
        },
    ],
};

function normalizeQuery(value) {
    return String(value || '').trim();
}

function normalizePage(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) return 0;
    return parsed;
}

function normalizeSortBy(value) {
    return SORT_OPTIONS.includes(value) ? value : DEFAULT_SORT_BY;
}

function normalizeDirection(value) {
    return DIRECTION_OPTIONS.includes(value) ? value : DEFAULT_DIRECTION;
}

function normalizeEntityType(value) {
    return ENCYCLOPEDIA_ENTITY_TYPES.includes(value) ? value : '';
}

function normalizeFilter(value) {
    return String(value || '').trim();
}

function setParam(params, key, value) {
    if (value === undefined || value === null || value === '') {
        params.delete(key);
        return;
    }
    params.set(key, String(value));
}

function sortByCountDesc(a, b) {
    return b.count - a.count;
}

function buildSectionQuickLinks(section, maxLinks = 10) {
    if (!section || !Array.isArray(section.primaryBlocks)) return [];

    const links = [];
    section.primaryBlocks.forEach((primaryBlock) => {
        const secondaryBlocks = Array.isArray(primaryBlock.secondaryBlocks)
            ? primaryBlock.secondaryBlocks
            : [];

        if (secondaryBlocks.length > 0) {
            secondaryBlocks.forEach((secondaryBlock) => {
                links.push({
                    key: `${primaryBlock.key}-${secondaryBlock.key}`,
                    label: secondaryBlock.label,
                    primaryKey: primaryBlock.key,
                    secondaryKey: secondaryBlock.key,
                });
            });
            return;
        }

        links.push({
            key: primaryBlock.key,
            label: primaryBlock.label,
            primaryKey: primaryBlock.key,
            secondaryKey: '',
        });
    });

    return links.slice(0, maxLinks);
}

function buildBlockMonogram(label) {
    const words = String(label || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) return '??';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function buildDemoItems({ entityType, primaryCategory, secondaryCategory }) {
    const keyWithSecondary = `${entityType}|${primaryCategory}|${secondaryCategory || ''}`;
    const exactItems = DEMO_ITEM_POOL[keyWithSecondary];
    if (exactItems) return exactItems;

    const keyWithoutSecondary = `${entityType}|${primaryCategory}|`;
    const baseItems = DEMO_ITEM_POOL[keyWithoutSecondary];
    if (baseItems) return baseItems;

    const categorySuffix = secondaryCategory || primaryCategory || 'category';
    const slugSuffix = String(categorySuffix).toLowerCase().replace(/\s+/g, '-');
    return [
        {
            id: `demo-${entityType}-${primaryCategory}-1`,
            slug: `demo-${String(entityType || '').toLowerCase()}-${slugSuffix}`,
            title: `${primaryCategory || entityType} — демо`,
            entityType,
            primaryCategory,
            secondaryCategory: secondaryCategory || '',
            summary: 'Заглушка предпросмотра структуры энциклопедии.',
            shortDescription: 'Заглушка предпросмотра структуры энциклопедии.',
            primaryImageUrl: null,
        },
    ];
}

export default function EncyclopediaListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAdmin } = useAuth();

    const q = normalizeQuery(searchParams.get('q'));
    const entityType = normalizeEntityType(searchParams.get('entityType'));
    const primaryCategory = normalizeFilter(searchParams.get('primaryCategory'));
    const secondaryCategory = normalizeFilter(searchParams.get('secondaryCategory'));
    const page = normalizePage(searchParams.get('page'));
    const sortBy = normalizeSortBy(searchParams.get('sortBy'));
    const direction = normalizeDirection(searchParams.get('direction'));

    const rootLevel = !entityType;
    const primaryLevel = Boolean(entityType && !primaryCategory);
    const secondaryLevel = Boolean(entityType && primaryCategory && !secondaryCategory);

    const [typeSections, setTypeSections] = useState([]);

    const [loadingHub, setLoadingHub] = useState(true);
    const [hubError, setHubError] = useState('');

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [itemsError, setItemsError] = useState('');
    const [searchInput, setSearchInput] = useState(q);

    const updateSearch = (patch = {}) => {
        const nextState = {
            q,
            entityType,
            primaryCategory,
            secondaryCategory,
            page,
            sortBy,
            direction,
            ...patch,
        };
        const next = new URLSearchParams(searchParams);
        setParam(next, 'q', normalizeQuery(nextState.q));
        setParam(next, 'entityType', normalizeEntityType(nextState.entityType));
        setParam(next, 'primaryCategory', normalizeFilter(nextState.primaryCategory));
        setParam(next, 'secondaryCategory', normalizeFilter(nextState.secondaryCategory));
        setParam(next, 'sortBy', normalizeSortBy(nextState.sortBy) === DEFAULT_SORT_BY ? '' : nextState.sortBy);
        setParam(next, 'direction', normalizeDirection(nextState.direction) === DEFAULT_DIRECTION ? '' : nextState.direction);
        setParam(next, 'page', Number(nextState.page) > 0 ? nextState.page : '');
        setSearchParams(next);
    };

    useEffect(() => {
        setSearchInput(q);
    }, [q]);

    useEffect(() => {
        let cancelled = false;

        const loadHub = async () => {
            setLoadingHub(true);
            setHubError('');
            try {
                const navigationData = await getEncyclopediaNavigation();
                const types = Array.isArray(navigationData?.types) ? navigationData.types : [];
                const sections = types.map((typeNode) => ({
                    key: typeNode.entityType,
                    label: ENTITY_LABELS[typeNode.entityType] || typeNode.entityType,
                    count: Number(typeNode.total || 0),
                    primaryBlocks: (Array.isArray(typeNode.primaryCategories) ? typeNode.primaryCategories : [])
                        .map((primaryNode) => ({
                            key: primaryNode.primaryCategory,
                            label: primaryNode.primaryCategory,
                            count: Number(primaryNode.total || 0),
                            secondaryBlocks: (Array.isArray(primaryNode.secondaryCategories) ? primaryNode.secondaryCategories : [])
                                .map((secondaryNode) => ({
                                    key: secondaryNode.secondaryCategory,
                                    label: secondaryNode.secondaryCategory,
                                    count: Number(secondaryNode.total || 0),
                                }))
                                .filter((entry) => entry.key && entry.count > 0)
                                .sort(sortByCountDesc),
                        }))
                        .filter((entry) => entry.key && entry.count > 0)
                        .sort(sortByCountDesc),
                }));

                if (!cancelled) {
                    setTypeSections(sections.filter((entry) => entry.key && entry.count > 0).sort(sortByCountDesc));
                }
            } catch (error) {
                if (!cancelled) {
                    setTypeSections([]);
                    setHubError(mapPaginationError(error, 'Не удалось загрузить структуру энциклопедии'));
                }
            } finally {
                if (!cancelled) setLoadingHub(false);
            }
        };

        loadHub();
        return () => { cancelled = true; };
    }, []);

    const selectedTypeSection = useMemo(
        () => {
            const demoMode = !loadingHub && !hubError && typeSections.length === 0;
            const source = demoMode ? DEMO_TYPE_SECTIONS : typeSections;
            return source.find((section) => section.key === entityType) || null;
        },
        [typeSections, entityType, loadingHub, hubError],
    );

    const demoMode = !loadingHub && !hubError && typeSections.length === 0;
    const visibleTypeSections = demoMode ? DEMO_TYPE_SECTIONS : typeSections;
    const primaryBlocks = selectedTypeSection?.primaryBlocks || [];
    const selectedPrimaryBlock = primaryBlocks.find((block) => block.key === primaryCategory) || null;
    const effectiveSecondaryBlocks = selectedPrimaryBlock?.secondaryBlocks || [];
    const effectiveLoadingSecondary = false;
    const showEntries = Boolean(
        entityType
        && primaryCategory
        && (secondaryCategory || (!effectiveLoadingSecondary && effectiveSecondaryBlocks.length === 0)),
    );

    useEffect(() => {
        if (!showEntries) return undefined;

        if (demoMode) {
            setLoadingItems(false);
            setItemsError('');
            const rawItems = buildDemoItems({ entityType, primaryCategory, secondaryCategory });
            const normalizedQuery = q.toLowerCase();
            const filteredItems = normalizedQuery
                ? rawItems.filter((item) => (
                    String(item.title || '').toLowerCase().includes(normalizedQuery)
                    || String(item.summary || '').toLowerCase().includes(normalizedQuery)
                ))
                : rawItems;
            const pageStart = page * PAGE_SIZE;
            const pageItems = filteredItems.slice(pageStart, pageStart + PAGE_SIZE);
            const pages = filteredItems.length > 0 ? Math.ceil(filteredItems.length / PAGE_SIZE) : 0;

            setItems(pageItems);
            setTotal(filteredItems.length);
            setTotalPages(pages);
            setHasPrevious(page > 0);
            setHasNext(page + 1 < pages);
            return undefined;
        }

        let cancelled = false;
        const loadEntries = async () => {
            setLoadingItems(true);
            setItemsError('');
            try {
                const data = await getEncyclopediaList({
                    q,
                    entityType,
                    primaryCategory,
                    secondaryCategory: secondaryCategory || undefined,
                    page,
                    size: PAGE_SIZE,
                    sortBy,
                    direction,
                });
                if (!cancelled) {
                    setItems(Array.isArray(data.items) ? data.items : []);
                    setTotal(data.total || 0);
                    setTotalPages(data.total_pages || 0);
                    setHasNext(Boolean(data.has_next));
                    setHasPrevious(Boolean(data.has_previous));
                }
            } catch (error) {
                if (!cancelled) {
                    setItems([]);
                    setTotal(0);
                    setTotalPages(0);
                    setHasNext(false);
                    setHasPrevious(false);
                    setItemsError(mapPaginationError(error, 'Не удалось загрузить статьи'));
                }
            } finally {
                if (!cancelled) setLoadingItems(false);
            }
        };

        loadEntries();
        return () => { cancelled = true; };
    }, [showEntries, demoMode, q, entityType, primaryCategory, secondaryCategory, page, sortBy, direction]);

    return (
        <div className="page">
            <div className="container encyclopedia-list-page">
                <header className="encyclopedia-header-box glass-card">
                    <h1 className="encyclopedia-title">📖 Энциклопедия Barotrauma</h1>
                    <p className="encyclopedia-subtitle">
                        Структура: разделы → подгруппы → статьи.
                    </p>
                    <div className="encyclopedia-level-actions">
                        {entityType && (
                            <button
                                className="btn btn-ghost"
                                onClick={() => updateSearch({
                                    entityType: '',
                                    primaryCategory: '',
                                    secondaryCategory: '',
                                    q: '',
                                    page: 0,
                                })}
                            >
                                К разделам
                            </button>
                        )}
                        {entityType && primaryCategory && (
                            <button
                                className="btn btn-ghost"
                                onClick={() => updateSearch({
                                    primaryCategory: '',
                                    secondaryCategory: '',
                                    q: '',
                                    page: 0,
                                })}
                            >
                                К подгруппам
                            </button>
                        )}
                        {secondaryCategory && (
                            <button
                                className="btn btn-ghost"
                                onClick={() => updateSearch({
                                    secondaryCategory: '',
                                    q: '',
                                    page: 0,
                                })}
                            >
                                К подподгруппам
                            </button>
                        )}
                        {isAdmin && <Link to="/admin/encyclopedia/new" className="btn btn-primary">➕ Создать страницу</Link>}
                    </div>
                </header>

                {rootLevel && (
                    <section className="encyclopedia-sections">
                        <h2 className="encyclopedia-hub-title">Разделы энциклопедии</h2>
                        {demoMode && (
                            <div className="encyclopedia-demo-hint">
                                Показаны демо-заглушки структуры. Реальные данные появятся после импорта/публикации.
                            </div>
                        )}
                        {hubError && <div className="auth-error">{hubError}</div>}
                        {loadingHub ? (
                            <div className="loading-state">
                                <div className="loading-spinner" />
                                <p>Загрузка разделов...</p>
                            </div>
                        ) : (
                            <div className="encyclopedia-type-stack">
                                {visibleTypeSections.map((section) => (
                                    <article key={section.key} className="encyclopedia-type-section glass-card">
                                        <div className="encyclopedia-type-section-header">
                                            <div className="encyclopedia-type-section-titleline">
                                                <span className="encyclopedia-type-section-titleline-bar" />
                                                <h3>{section.label}</h3>
                                                <span className="encyclopedia-type-section-titleline-bar" />
                                            </div>
                                            <span className="encyclopedia-type-section-count">{section.count} статей</span>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                aria-label={`Открыть раздел ${section.label}`}
                                                onClick={() => updateSearch({
                                                    entityType: section.key,
                                                    primaryCategory: '',
                                                    secondaryCategory: '',
                                                    q: '',
                                                    page: 0,
                                                })}
                                            >
                                                Открыть раздел
                                            </button>
                                        </div>
                                        {section.primaryBlocks.length === 0 ? (
                                            <p className="encyclopedia-empty-text">Подгруппы пока не определены.</p>
                                        ) : (
                                            <>
                                                <div className="encyclopedia-hub-grid">
                                                    {section.primaryBlocks.slice(0, 12).map((block) => (
                                                        <button
                                                            key={`${section.key}-${block.key}`}
                                                            className="encyclopedia-hub-item"
                                                            onClick={() => updateSearch({
                                                                entityType: section.key,
                                                                primaryCategory: block.key,
                                                                secondaryCategory: '',
                                                                q: '',
                                                                page: 0,
                                                            })}
                                                        >
                                                            <span aria-hidden="true" className="encyclopedia-hub-item-icon">
                                                                {buildBlockMonogram(block.label)}
                                                            </span>
                                                            <strong>{block.label}</strong>
                                                            <span>{block.count} статей</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="encyclopedia-hub-links">
                                                    {buildSectionQuickLinks(section).map((quickLink) => (
                                                        <button
                                                            key={`${section.key}-${quickLink.key}`}
                                                            className="encyclopedia-hub-link-btn"
                                                            onClick={() => updateSearch({
                                                                entityType: section.key,
                                                                primaryCategory: quickLink.primaryKey,
                                                                secondaryCategory: quickLink.secondaryKey,
                                                                q: '',
                                                                page: 0,
                                                            })}
                                                        >
                                                            {quickLink.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {primaryLevel && (
                    <section className="encyclopedia-groups-panel glass-card">
                        <div className="encyclopedia-panel-titleline">
                            <span className="encyclopedia-panel-titleline-bar" />
                            <h2>{selectedTypeSection?.label || entityType}: подгруппы</h2>
                            <span className="encyclopedia-panel-titleline-bar" />
                        </div>
                        {loadingHub ? (
                            <div className="loading-state">
                                <div className="loading-spinner" />
                                <p>Загрузка подгрупп...</p>
                            </div>
                        ) : primaryBlocks.length === 0 ? (
                            <p className="encyclopedia-empty-text">Для раздела пока нет подгрупп.</p>
                        ) : (
                            <div className="encyclopedia-hub-grid encyclopedia-hub-grid-level">
                                {primaryBlocks.map((block) => (
                                    <button
                                        key={block.key}
                                        className="encyclopedia-hub-item encyclopedia-hub-item-level"
                                        onClick={() => updateSearch({
                                            primaryCategory: block.key,
                                            secondaryCategory: '',
                                            q: '',
                                            page: 0,
                                        })}
                                    >
                                        <span aria-hidden="true" className="encyclopedia-hub-item-icon">
                                            {buildBlockMonogram(block.label)}
                                        </span>
                                        <strong>{block.label}</strong>
                                        <span>{block.count} статей</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {secondaryLevel && !showEntries && (
                    <section className="encyclopedia-groups-panel glass-card">
                        <div className="encyclopedia-panel-titleline">
                            <span className="encyclopedia-panel-titleline-bar" />
                            <h2>{primaryCategory}: подподгруппы</h2>
                            <span className="encyclopedia-panel-titleline-bar" />
                        </div>
                        {effectiveLoadingSecondary ? (
                            <div className="loading-state">
                                <div className="loading-spinner" />
                                <p>Загрузка подподгрупп...</p>
                            </div>
                        ) : effectiveSecondaryBlocks.length === 0 ? (
                            <p className="encyclopedia-empty-text">У этой подгруппы нет дополнительных уровней.</p>
                        ) : (
                            <div className="encyclopedia-hub-grid encyclopedia-hub-grid-level">
                                {effectiveSecondaryBlocks.map((block) => (
                                    <button
                                        key={block.key}
                                        className="encyclopedia-hub-item encyclopedia-hub-item-level"
                                        onClick={() => updateSearch({
                                            secondaryCategory: block.key,
                                            q: '',
                                            page: 0,
                                        })}
                                    >
                                        <span aria-hidden="true" className="encyclopedia-hub-item-icon">
                                            {buildBlockMonogram(block.label)}
                                        </span>
                                        <strong>{block.label}</strong>
                                        <span>{block.count} статей</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {showEntries && (
                    <>
                        <section className="encyclopedia-search-panel glass-card">
                            <div className="encyclopedia-panel-titleline encyclopedia-panel-titleline-compact">
                                <span className="encyclopedia-panel-titleline-bar" />
                                <h2>Статьи раздела</h2>
                                <span className="encyclopedia-panel-titleline-bar" />
                            </div>
                            <form
                                className="encyclopedia-search-form"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    updateSearch({ q: searchInput, page: 0 });
                                }}
                            >
                                <label htmlFor="encyclopedia-search-input">Поиск в выбранной подгруппе</label>
                                <div className="encyclopedia-search-row">
                                    <input
                                        id="encyclopedia-search-input"
                                        value={searchInput}
                                        onChange={(event) => setSearchInput(event.target.value)}
                                        placeholder="Введите название статьи"
                                    />
                                    <button className="btn btn-primary" type="submit" disabled={loadingItems}>Найти</button>
                                    <button
                                        className="btn btn-ghost"
                                        type="button"
                                        onClick={() => updateSearch({ q: '', page: 0 })}
                                        disabled={loadingItems && !q}
                                    >
                                        Сбросить
                                    </button>
                                </div>
                            </form>
                        </section>
                        {itemsError && <div className="auth-error">{itemsError}</div>}
                        {loadingItems ? (
                            <div className="loading-state">
                                <div className="loading-spinner" />
                                <p>Загрузка статей...</p>
                            </div>
                        ) : items.length === 0 ? (
                            <section className="encyclopedia-empty-state glass-card">
                                <p>Статьи в этой подгруппе не найдены.</p>
                            </section>
                        ) : (
                            <section className="encyclopedia-grid">
                                {items.map((item) => (
                                    <article key={item.id || item.slug} className="encyclopedia-card glass-card">
                                        <Link to={`/encyclopedia/${item.slug}`} className="encyclopedia-card-image-link">
                                            {item.primaryImageUrl ? (
                                                <img src={item.primaryImageUrl} alt={item.title} className="encyclopedia-card-image" />
                                            ) : (
                                                <div className="encyclopedia-card-image-placeholder">📄</div>
                                            )}
                                        </Link>
                                        <div className="encyclopedia-card-body">
                                            <p className="encyclopedia-card-meta">
                                                <span>{item.entityType || 'OTHER'}</span>
                                                <span>{item.primaryCategory || 'Без категории'}</span>
                                            </p>
                                            <h2 className="encyclopedia-card-title">
                                                <Link to={`/encyclopedia/${item.slug}`}>{item.title}</Link>
                                            </h2>
                                            <p className="encyclopedia-card-description">
                                                {item.summary || item.shortDescription || 'Описание пока отсутствует.'}
                                            </p>
                                        </div>
                                    </article>
                                ))}
                            </section>
                        )}
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            hasNext={hasNext}
                            hasPrevious={hasPrevious}
                            disabled={loadingItems}
                            onPageChange={(nextPage) => updateSearch({ page: nextPage })}
                        />
                        {!loadingItems && <p className="encyclopedia-total-hint">Найдено статей: {total}</p>}
                    </>
                )}
            </div>
        </div>
    );
}
