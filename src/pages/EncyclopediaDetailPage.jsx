import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getEncyclopediaDetail } from '../api/encyclopedia';
import { useAuth } from '../context/AuthContext';
import './EncyclopediaDetailPage.css';

const DEMO_PUBLISHED_AT = '2026-03-01T00:00:00.000Z';

function buildDemoDetail({
    slug,
    title,
    entityType,
    primaryCategory,
    secondaryCategory = '',
    summary,
    articleMarkdown,
    infobox = [],
    relatedEntities = [],
    backlinks = [],
    relatedMods = [],
    importedProperties = [],
    crafting = null,
    armament = null,
    subtype = null,
}) {
    return {
        id: `demo-${slug}`,
        slug,
        title,
        entityType,
        subtype,
        primaryCategory,
        secondaryCategory,
        shortDescription: summary,
        sourceGameVersion: 'Barotrauma (Demo data)',
        publishedMarkdown: articleMarkdown,
        renderedHtml: '',
        summary,
        publishedAt: DEMO_PUBLISHED_AT,
        primaryImage: null,
        infobox,
        relatedEntities,
        backlinks,
        relatedMods,
        importedProperties,
        crafting,
        armament,
        isDemo: true,
    };
}

const DEMO_DETAIL_BY_SLUG = {
    charybdis: buildDemoDetail({
        slug: 'charybdis',
        title: 'Charybdis',
        entityType: 'CREATURE',
        primaryCategory: 'Monsters',
        secondaryCategory: 'Abyss',
        summary: 'Глубоководный хищник очень высокого уровня угрозы.',
        articleMarkdown: `
## Обзор
Charybdis встречается в глубоких биомах и опасен для неподготовленного экипажа.

## Тактика
- Держать дистанцию и использовать тяжелое вооружение.
- Следить за состоянием корпуса и энергосистемы.
- Подготовить медиков к массовым травмам экипажа.

См. также: [[Endworm]].
        `,
        infobox: [
            { fieldKey: 'threat', fieldLabel: 'Угроза', fieldValue: 'Очень высокая', sortOrder: 0 },
            { fieldKey: 'biome', fieldLabel: 'Биом', fieldValue: 'Бездна', sortOrder: 1 },
            { fieldKey: 'counter', fieldLabel: 'Контрмера', fieldValue: 'Тяжелые турели / координация экипажа', sortOrder: 2 },
        ],
        relatedEntities: [
            { id: 'demo-endworm', slug: 'endworm', title: 'Endworm', relationType: 'RELATED', origin: 'DEMO' },
        ],
        importedProperties: [
            { propertyKey: 'threat_level', propertyValue: '5', valueType: 'INTEGER', origin: 'DEMO' },
            { propertyKey: 'encounter_zone', propertyValue: 'Abyss', valueType: 'STRING', origin: 'DEMO' },
        ],
    }),
    endworm: buildDemoDetail({
        slug: 'endworm',
        title: 'Endworm',
        entityType: 'CREATURE',
        primaryCategory: 'Monsters',
        secondaryCategory: 'Abyss',
        summary: 'Крупное абиссальное существо с высокой устойчивостью.',
        articleMarkdown: `
## Обзор
Endworm представляет угрозу на поздних этапах кампании и требует мощного вооружения.
        `,
        infobox: [
            { fieldKey: 'threat', fieldLabel: 'Угроза', fieldValue: 'Высокая', sortOrder: 0 },
            { fieldKey: 'biome', fieldLabel: 'Биом', fieldValue: 'Бездна', sortOrder: 1 },
        ],
        importedProperties: [
            { propertyKey: 'threat_level', propertyValue: '4', valueType: 'INTEGER', origin: 'DEMO' },
        ],
    }),
    'husk-infection': buildDemoDetail({
        slug: 'husk-infection',
        title: 'Husk Infection',
        entityType: 'AFFLICTION',
        primaryCategory: 'Infections',
        secondaryCategory: 'Husk',
        summary: 'Паразитарная инфекция, требующая быстрой диагностики и лечения.',
        articleMarkdown: `
## Симптомы
На ранних стадиях симптомы могут быть слабо выражены, но состояние прогрессирует.

## Лечение
Используются медицинские препараты и изоляция зараженного при необходимости.

Базовый препарат: [Bandage](/encyclopedia/bandage)
        `,
        infobox: [
            { fieldKey: 'type', fieldLabel: 'Тип', fieldValue: 'Инфекция', sortOrder: 0 },
            { fieldKey: 'progression', fieldLabel: 'Прогрессирование', fieldValue: 'Постепенное', sortOrder: 1 },
            { fieldKey: 'treatment', fieldLabel: 'Лечение', fieldValue: 'Медпрепараты / наблюдение', sortOrder: 2 },
        ],
        relatedEntities: [
            { id: 'demo-item-bandage', slug: 'bandage', title: 'Bandage', relationType: 'COUNTERS', origin: 'DEMO' },
        ],
        importedProperties: [
            { propertyKey: 'category', propertyValue: 'Parasitic', valueType: 'STRING', origin: 'DEMO' },
        ],
    }),
    bandage: buildDemoDetail({
        slug: 'bandage',
        title: 'Bandage',
        entityType: 'ITEM',
        primaryCategory: 'Medical',
        secondaryCategory: 'Treatment',
        summary: 'Базовый медицинский расходник для стабилизации состояния.',
        articleMarkdown: `
## Назначение
Используется как первая помощь при травмах и кровотечениях.
        `,
        infobox: [
            { fieldKey: 'slot', fieldLabel: 'Категория', fieldValue: 'Medical item', sortOrder: 0 },
            { fieldKey: 'usage', fieldLabel: 'Применение', fieldValue: 'Первая помощь', sortOrder: 1 },
        ],
        crafting: {
            hasRecipe: true,
            recipes: [
                {
                    recipeType: 'FABRICATE',
                    fabricationTime: '6',
                    outputCount: '1',
                    requiredStations: ['fabricator'],
                    requiredSkills: [{ identifier: 'medical', level: '15' }],
                    ingredients: [
                        {
                            itemIdentifier: 'organicfiber',
                            amount: '1',
                            title: 'Organic Fiber',
                            slug: 'organic-fiber',
                            isLinkable: true,
                        },
                    ],
                },
            ],
        },
    }),
    'blood-pack': buildDemoDetail({
        slug: 'blood-pack',
        title: 'Blood Pack',
        entityType: 'ITEM',
        primaryCategory: 'Medical',
        secondaryCategory: 'Treatment',
        summary: 'Препарат для восстановления объема крови у пациента.',
        articleMarkdown: `
## Назначение
Применяется для стабилизации тяжелых ранений при кровопотере.
        `,
        infobox: [
            { fieldKey: 'slot', fieldLabel: 'Категория', fieldValue: 'Medical item', sortOrder: 0 },
            { fieldKey: 'usage', fieldLabel: 'Применение', fieldValue: 'Переливание', sortOrder: 1 },
        ],
    }),
    'alien-ruins': buildDemoDetail({
        slug: 'alien-ruins',
        title: 'Alien Ruins',
        entityType: 'LOCATION',
        primaryCategory: 'Ruins',
        secondaryCategory: 'Alien',
        summary: 'Опасная локация с артефактами и высоким риском для экипажа.',
        articleMarkdown: `
## Особенности
Руины содержат ценный лут, но требуют подготовленной команды и ресурсов.
        `,
        infobox: [
            { fieldKey: 'location_type', fieldLabel: 'Тип локации', fieldValue: 'Руины', sortOrder: 0 },
            { fieldKey: 'risk', fieldLabel: 'Риск', fieldValue: 'Высокий', sortOrder: 1 },
        ],
    }),
    orca: buildDemoDetail({
        slug: 'orca',
        title: 'Orca',
        entityType: 'SUBMARINE',
        primaryCategory: 'Transport',
        secondaryCategory: '',
        summary: 'Универсальная подлодка для грузовых и боевых задач.',
        articleMarkdown: `
## Обзор
Orca подходит для сбалансированного стиля игры и средних по сложности миссий.
        `,
        infobox: [
            { fieldKey: 'class', fieldLabel: 'Класс', fieldValue: 'Transport', sortOrder: 0 },
            { fieldKey: 'crew', fieldLabel: 'Экипаж', fieldValue: '3-5', sortOrder: 1 },
            { fieldKey: 'strength', fieldLabel: 'Сильная сторона', fieldValue: 'Универсальность', sortOrder: 2 },
        ],
        armament: {
            turretSlotCount: 2,
            largeTurretSlotCount: 1,
            defaultTurretWeapons: ['coilgun', 'doublecoilgun'],
            defaultLargeTurretWeapons: ['railgun'],
        },
    }),
    captain: buildDemoDetail({
        slug: 'captain',
        title: 'Captain',
        entityType: 'JOB',
        primaryCategory: 'Crew Roles',
        secondaryCategory: '',
        summary: 'Командная роль, ответственная за маршрут, приоритеты и координацию.',
        articleMarkdown: `
## Задачи
- Выбор миссий и контроль навигации.
- Постановка задач экипажу через систему команд.
- Оценка рисков в конфликтных ситуациях.
        `,
        infobox: [
            { fieldKey: 'role', fieldLabel: 'Роль', fieldValue: 'Командование', sortOrder: 0 },
            { fieldKey: 'focus', fieldLabel: 'Фокус', fieldValue: 'Навигация и координация', sortOrder: 1 },
        ],
    }),
    'medical-doctor': buildDemoDetail({
        slug: 'medical-doctor',
        title: 'Medical Doctor',
        entityType: 'JOB',
        primaryCategory: 'Crew Roles',
        secondaryCategory: '',
        summary: 'Ключевая роль для лечения аффликтов и поддержания живучести экипажа.',
        articleMarkdown: `
## Задачи
Доктор контролирует запасы медикаментов и состояние экипажа в боевых и аварийных условиях.
        `,
        infobox: [
            { fieldKey: 'role', fieldLabel: 'Роль', fieldValue: 'Медицина', sortOrder: 0 },
            { fieldKey: 'focus', fieldLabel: 'Фокус', fieldValue: 'Лечение / диагностика', sortOrder: 1 },
        ],
    }),
    'inspiring-presence': buildDemoDetail({
        slug: 'inspiring-presence',
        title: 'Inspiring Presence',
        entityType: 'TALENT',
        primaryCategory: 'Captain Tree',
        secondaryCategory: '',
        summary: 'Талант, усиливающий эффективность команды в критических ситуациях.',
        articleMarkdown: `
## Эффект
Повышает устойчивость и полезность ближайших членов экипажа.
        `,
        infobox: [
            { fieldKey: 'tree', fieldLabel: 'Дерево', fieldValue: 'Captain', sortOrder: 0 },
            { fieldKey: 'impact', fieldLabel: 'Влияние', fieldValue: 'Поддержка команды', sortOrder: 1 },
        ],
    }),
    'reactor-management': buildDemoDetail({
        slug: 'reactor-management',
        title: 'Reactor Management',
        entityType: 'OTHER',
        primaryCategory: 'Mechanics',
        secondaryCategory: '',
        summary: 'Базовая механика контроля генерации и потребления энергии на подлодке.',
        articleMarkdown: `
## Основы
Стабильная подача энергии критична для всех систем: навигации, вооружения и жизнеобеспечения.
        `,
        infobox: [
            { fieldKey: 'topic', fieldLabel: 'Тема', fieldValue: 'Энергосистема', sortOrder: 0 },
            { fieldKey: 'importance', fieldLabel: 'Важность', fieldValue: 'Критическая', sortOrder: 1 },
        ],
    }),
};

function buildGenericDemoDetail(slug) {
    return buildDemoDetail({
        slug,
        title: `Demo Article: ${slug}`,
        entityType: 'OTHER',
        primaryCategory: 'Demo',
        summary: 'Демо-страница энциклопедии для проверки layout и структуры данных.',
        articleMarkdown: 'Контент будет заменен реальными данными после импорта ваниллы и публикации статей.',
        infobox: [
            { fieldKey: 'source', fieldLabel: 'Источник', fieldValue: 'Demo fallback', sortOrder: 0 },
        ],
    });
}

function getDemoDetail(slug) {
    if (!slug) return null;
    if (DEMO_DETAIL_BY_SLUG[slug]) return DEMO_DETAIL_BY_SLUG[slug];
    if (slug.startsWith('demo-')) return buildGenericDemoDetail(slug);
    return null;
}

function ensureDetailCollections(detail) {
    if (!detail || typeof detail !== 'object') return detail;

    const craftingRaw = detail.crafting && typeof detail.crafting === 'object' ? detail.crafting : null;
    const recipes = craftingRaw && Array.isArray(craftingRaw.recipes) ? craftingRaw.recipes : [];
    const recipe = craftingRaw ? (craftingRaw.recipe || recipes[0] || null) : null;
    const crafting = craftingRaw
        ? {
            ...craftingRaw,
            hasRecipe: Boolean(craftingRaw.hasRecipe ?? craftingRaw.has_recipe ?? recipes.length > 0),
            recipes,
            recipe,
        }
        : null;

    const armamentRaw = detail.armament && typeof detail.armament === 'object' ? detail.armament : null;
    const armament = armamentRaw
        ? {
            ...armamentRaw,
            turretSlotCount: Number(armamentRaw.turretSlotCount ?? armamentRaw.turret_slot_count ?? 0) || 0,
            largeTurretSlotCount:
                Number(armamentRaw.largeTurretSlotCount ?? armamentRaw.large_turret_slot_count ?? 0) || 0,
            defaultTurretWeapons: Array.isArray(armamentRaw.defaultTurretWeapons)
                ? armamentRaw.defaultTurretWeapons
                : (Array.isArray(armamentRaw.default_turret_weapons) ? armamentRaw.default_turret_weapons : []),
            defaultLargeTurretWeapons: Array.isArray(armamentRaw.defaultLargeTurretWeapons)
                ? armamentRaw.defaultLargeTurretWeapons
                : (Array.isArray(armamentRaw.default_large_turret_weapons)
                    ? armamentRaw.default_large_turret_weapons
                    : []),
        }
        : null;

    return {
        ...detail,
        infobox: Array.isArray(detail.infobox) ? detail.infobox : [],
        relatedEntities: Array.isArray(detail.relatedEntities) ? detail.relatedEntities : [],
        backlinks: Array.isArray(detail.backlinks) ? detail.backlinks : [],
        relatedMods: Array.isArray(detail.relatedMods) ? detail.relatedMods : [],
        importedProperties: Array.isArray(detail.importedProperties) ? detail.importedProperties : [],
        crafting,
        armament,
    };
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

function humanizeIdentifier(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    return normalized
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ingredientLabel(ingredient) {
    return ingredient?.title
        || humanizeIdentifier(ingredient?.itemIdentifier)
        || humanizeIdentifier(ingredient?.itemTag)
        || 'Unknown ingredient';
}

function SectionTitle({ children }) {
    return (
        <div className="encyclopedia-detail-titleline">
            <span className="encyclopedia-detail-titleline-bar" />
            <h2>{children}</h2>
            <span className="encyclopedia-detail-titleline-bar" />
        </div>
    );
}

function slugifyWikiTarget(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9а-яё]+/gi, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizeArticleMarkdown(markdown) {
    const source = String(markdown || '');
    if (!source) return '';

    return source.replace(/\[\[([^\]]+)\]\]/g, (_, raw) => {
        const text = String(raw || '').trim();
        if (!text) return '';

        const splitByPipe = text.split('|');
        const targetRaw = splitByPipe[0]?.trim() || '';
        const labelRaw = splitByPipe[1]?.trim() || targetRaw;
        const slug = slugifyWikiTarget(targetRaw);
        if (!slug) return labelRaw;
        return `[${labelRaw}](/encyclopedia/${slug})`;
    });
}

export default function EncyclopediaDetailPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadDetail = async () => {
            setLoading(true);
            setError('');
            const demoFallback = getDemoDetail(slug);
            try {
                const response = await getEncyclopediaDetail(slug);
                if (!cancelled) {
                    if (response) {
                        setDetail(ensureDetailCollections(response));
                    } else if (demoFallback) {
                        setDetail(ensureDetailCollections(demoFallback));
                    } else {
                        setDetail(null);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    if (demoFallback) {
                        setDetail(ensureDetailCollections(demoFallback));
                        setError('');
                    } else {
                        setDetail(null);
                        setError(err?.message || 'Не удалось загрузить статью энциклопедии');
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadDetail();

        return () => {
            cancelled = true;
        };
    }, [slug]);

    const handleArticleClick = (event) => {
        const anchor = event.target.closest('a');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || !href.startsWith('/encyclopedia/')) return;

        event.preventDefault();
        navigate(href);
    };

    const articleMarkdown = useMemo(
        () => normalizeArticleMarkdown(detail?.publishedMarkdown || ''),
        [detail?.publishedMarkdown],
    );

    const markdownComponents = useMemo(() => ({
        a: ({ href, children, ...props }) => {
            const normalizedHref = String(href || '').trim();
            if (normalizedHref.startsWith('/encyclopedia/')) {
                return <Link to={normalizedHref}>{children}</Link>;
            }
            if (normalizedHref.startsWith('encyclopedia/')) {
                return <Link to={`/${normalizedHref}`}>{children}</Link>;
            }
            if (normalizedHref.startsWith('http://') || normalizedHref.startsWith('https://')) {
                return (
                    <a href={normalizedHref} target="_blank" rel="noreferrer noopener" {...props}>
                        {children}
                    </a>
                );
            }
            return (
                <a href={normalizedHref || href} {...props}>
                    {children}
                </a>
            );
        },
    }), []);

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Загрузка статьи...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !detail) {
        return (
            <div className="page">
                <div className="container">
                    <div className="auth-error">{error}</div>
                    <Link to="/encyclopedia" className="back-link">← Назад к энциклопедии</Link>
                </div>
            </div>
        );
    }

    if (!detail) {
        return null;
    }

    const hasArticleMarkdown = Boolean(articleMarkdown.trim().length > 0);
    const hasArticleHtml = Boolean(detail.renderedHtml && detail.renderedHtml.trim().length > 0);
    const craftingRecipes = detail.crafting?.recipes?.length
        ? detail.crafting.recipes
        : (detail.crafting?.recipe ? [detail.crafting.recipe] : []);
    const hasCraftRecipe = detail.entityType === 'ITEM'
        && Boolean(detail.crafting?.hasRecipe ?? detail.crafting?.has_recipe ?? craftingRecipes.length > 0);

    return (
        <div className="page encyclopedia-detail-page">
            <div className="container encyclopedia-detail-container">
                <Link to="/encyclopedia" className="back-link">← Назад к энциклопедии</Link>

                <section className="encyclopedia-detail-hero glass-card">
                    <div className="encyclopedia-detail-hero-main">
                        <h1>{detail.title}</h1>
                        {detail.isDemo && (
                            <p className="encyclopedia-detail-demo-hint">
                                Демо-версия статьи: контент и инфобокс служат для предпросмотра структуры.
                            </p>
                        )}
                        <p className="encyclopedia-detail-subtitle">
                            {detail.entityType || 'OTHER'}
                            {detail.primaryCategory ? ` · ${detail.primaryCategory}` : ''}
                            {detail.secondaryCategory ? ` / ${detail.secondaryCategory}` : ''}
                        </p>
                        <p className="encyclopedia-detail-summary">
                            {detail.summary || detail.shortDescription || 'Описание пока отсутствует.'}
                        </p>
                    </div>
                    {isAdmin && !detail.isDemo && (
                        <div className="encyclopedia-detail-hero-actions">
                            <Link to={`/admin/encyclopedia/${detail.id}/edit`} className="btn btn-primary">
                                ✏️ Редактировать
                            </Link>
                        </div>
                    )}
                </section>

                <div className="encyclopedia-detail-layout">
                    <main className="encyclopedia-detail-main">
                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Статья</SectionTitle>
                            {hasArticleMarkdown ? (
                                <article className="encyclopedia-article-html">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                        {articleMarkdown}
                                    </ReactMarkdown>
                                </article>
                            ) : hasArticleHtml ? (
                                <article
                                    className="encyclopedia-article-html"
                                    onClick={handleArticleClick}
                                    dangerouslySetInnerHTML={{ __html: detail.renderedHtml }}
                                />
                            ) : (
                                <p className="encyclopedia-empty-text">Опубликованный контент отсутствует.</p>
                            )}
                        </section>

                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Связанные сущности</SectionTitle>
                            {detail.relatedEntities.length === 0 ? (
                                <p className="encyclopedia-empty-text">Связи не добавлены.</p>
                            ) : (
                                <ul className="encyclopedia-compact-list">
                                    {detail.relatedEntities.map((relation, index) => (
                                        <li key={`${relation.id}-${relation.relationType}-${index}`}>
                                            <Link to={`/encyclopedia/${relation.slug}`}>
                                                {relation.title}
                                            </Link>
                                            <span>{relation.relationType}</span>
                                            <small>{relation.origin}</small>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {detail.entityType === 'ITEM' && (
                            <section className="encyclopedia-detail-section glass-card">
                                <SectionTitle>Крафт</SectionTitle>
                                {!hasCraftRecipe ? (
                                    <p className="encyclopedia-empty-text">Крафт отсутствует.</p>
                                ) : (
                                    <div className="encyclopedia-crafting-stack">
                                        {craftingRecipes.map((recipe, recipeIndex) => (
                                            <article
                                                className="encyclopedia-crafting-card"
                                                key={`${recipe.recipeType || 'recipe'}-${recipeIndex}`}
                                            >
                                                <div className="encyclopedia-crafting-card-meta">
                                                    <span>
                                                        <strong>Тип:</strong> {recipe.recipeType || 'FABRICATE'}
                                                    </span>
                                                    {recipe.fabricationTime && (
                                                        <span>
                                                            <strong>Время:</strong> {recipe.fabricationTime}
                                                        </span>
                                                    )}
                                                    {recipe.outputCount && (
                                                        <span>
                                                            <strong>Выход:</strong> {recipe.outputCount}
                                                        </span>
                                                    )}
                                                    {Array.isArray(recipe.requiredStations) && recipe.requiredStations.length > 0 && (
                                                        <span>
                                                            <strong>Станция:</strong> {recipe.requiredStations.join(', ')}
                                                        </span>
                                                    )}
                                                </div>

                                                {Array.isArray(recipe.requiredSkills) && recipe.requiredSkills.length > 0 && (
                                                    <p className="encyclopedia-crafting-subline">
                                                        <strong>Требуемые навыки:</strong>{' '}
                                                        {recipe.requiredSkills
                                                            .map((skill) => `${humanizeIdentifier(skill.identifier)} ${skill.level || ''}`.trim())
                                                            .join(', ')}
                                                    </p>
                                                )}

                                                {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? (
                                                    <ul className="encyclopedia-compact-list">
                                                        {recipe.ingredients.map((ingredient, ingredientIndex) => (
                                                            <li
                                                                key={`${ingredient.itemIdentifier || ingredient.itemTag || 'ingredient'}-${ingredientIndex}`}
                                                                className="encyclopedia-crafting-ingredient-item"
                                                            >
                                                                {ingredient.slug && ingredient.isLinkable ? (
                                                                    <Link to={`/encyclopedia/${ingredient.slug}`}>
                                                                        {ingredientLabel(ingredient)}
                                                                    </Link>
                                                                ) : (
                                                                    <span className="encyclopedia-crafting-ingredient-text">
                                                                        {ingredientLabel(ingredient)}
                                                                    </span>
                                                                )}
                                                                {ingredient.amount && (
                                                                    <span className="encyclopedia-crafting-chip">
                                                                        x{ingredient.amount}
                                                                    </span>
                                                                )}
                                                                {ingredient.minCondition && (
                                                                    <small>min condition: {ingredient.minCondition}</small>
                                                                )}
                                                                {ingredient.useCondition && (
                                                                    <small>use condition: {ingredient.useCondition}</small>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="encyclopedia-empty-text">Ингредиенты не указаны.</p>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {detail.entityType === 'SUBMARINE' && (
                            <section className="encyclopedia-detail-section glass-card">
                                <SectionTitle>Вооружение</SectionTitle>
                                <div className="encyclopedia-armament-meta">
                                    <p><strong>Малые слоты турелей:</strong> {detail.armament?.turretSlotCount ?? 0}</p>
                                    <p><strong>Большие слоты турелей:</strong> {detail.armament?.largeTurretSlotCount ?? 0}</p>
                                </div>
                                <div className="encyclopedia-armament-grid">
                                    <div>
                                        <p className="encyclopedia-armament-heading">Малые турели</p>
                                        {detail.armament?.defaultTurretWeapons?.length ? (
                                            <ul className="encyclopedia-compact-list">
                                                {detail.armament.defaultTurretWeapons.map((weapon, index) => (
                                                    <li key={`small-${weapon}-${index}`}>
                                                        <span className="encyclopedia-crafting-ingredient-text">
                                                            {humanizeIdentifier(weapon)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="encyclopedia-empty-text">Нет данных.</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="encyclopedia-armament-heading">Большие турели</p>
                                        {detail.armament?.defaultLargeTurretWeapons?.length ? (
                                            <ul className="encyclopedia-compact-list">
                                                {detail.armament.defaultLargeTurretWeapons.map((weapon, index) => (
                                                    <li key={`large-${weapon}-${index}`}>
                                                        <span className="encyclopedia-crafting-ingredient-text">
                                                            {humanizeIdentifier(weapon)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="encyclopedia-empty-text">Нет данных.</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Backlinks</SectionTitle>
                            {detail.backlinks.length === 0 ? (
                                <p className="encyclopedia-empty-text">Ссылок из других статей пока нет.</p>
                            ) : (
                                <ul className="encyclopedia-compact-list">
                                    {detail.backlinks.map((backlink) => (
                                        <li key={`${backlink.articleId}-${backlink.sourceEntityId}`}>
                                            <Link to={`/encyclopedia/${backlink.sourceSlug}`}>
                                                {backlink.sourceTitle}
                                            </Link>
                                            <small>{formatDate(backlink.publishedAt)}</small>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Связанные моды</SectionTitle>
                            {detail.relatedMods.length === 0 ? (
                                <p className="encyclopedia-empty-text">Связанные моды не указаны.</p>
                            ) : (
                                <ul className="encyclopedia-compact-list">
                                    {detail.relatedMods.map((mod) => (
                                        <li key={`${mod.modExternalId}-${mod.relationType}`}>
                                            <Link to={`/mod/${mod.modExternalId}`}>
                                                Mod #{mod.modExternalId}
                                            </Link>
                                            <span>{mod.relationType}</span>
                                            {mod.confidence !== null && mod.confidence !== undefined && (
                                                <small>confidence: {mod.confidence.toFixed(2)}</small>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Imported свойства</SectionTitle>
                            {detail.importedProperties.length === 0 ? (
                                <p className="encyclopedia-empty-text">Свойства импорта отсутствуют.</p>
                            ) : (
                                <div className="encyclopedia-properties-table-wrap">
                                    <table className="encyclopedia-properties-table">
                                        <thead>
                                            <tr>
                                                <th>Ключ</th>
                                                <th>Значение</th>
                                                <th>Тип</th>
                                                <th>Origin</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detail.importedProperties.map((property) => (
                                                <tr key={`${property.propertyKey}-${property.propertyValue}`}>
                                                    <td>{property.propertyKey}</td>
                                                    <td>{property.propertyValue}</td>
                                                    <td>{property.valueType}</td>
                                                    <td>{property.origin}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </main>

                    <aside className="encyclopedia-detail-sidebar">
                        <section className="encyclopedia-detail-section glass-card encyclopedia-image-card">
                            {detail.primaryImage?.publicUrl ? (
                                <img
                                    className="encyclopedia-primary-image"
                                    src={detail.primaryImage.publicUrl}
                                    alt={detail.title}
                                />
                            ) : (
                                <div className="encyclopedia-primary-image-placeholder">Изображение отсутствует</div>
                            )}
                        </section>

                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Infobox</SectionTitle>
                            {detail.infobox.length === 0 ? (
                                <p className="encyclopedia-empty-text">Поля infobox не заполнены.</p>
                            ) : (
                                <dl className="encyclopedia-infobox-list">
                                    {detail.infobox.map((field) => (
                                        <div key={`${field.fieldKey}-${field.sortOrder}`} className="encyclopedia-infobox-item">
                                            <dt>{field.fieldLabel}</dt>
                                            <dd>{field.fieldValue}</dd>
                                        </div>
                                    ))}
                                </dl>
                            )}
                        </section>

                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Метаданные</SectionTitle>
                            <div className="encyclopedia-meta-list">
                                <p><strong>Slug:</strong> {detail.slug}</p>
                                <p><strong>Тип:</strong> {detail.entityType || 'OTHER'}</p>
                                <p><strong>Subtype:</strong> {detail.subtype || '—'}</p>
                                <p><strong>Версия игры:</strong> {detail.sourceGameVersion || '—'}</p>
                                <p><strong>Опубликовано:</strong> {formatDate(detail.publishedAt)}</p>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}
