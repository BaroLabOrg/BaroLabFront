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
        summary: 'A deep-sea predator with a very high threat level.',
        articleMarkdown: `
## Overview
Charybdis appears in deep biomes and is dangerous for unprepared crews.

## Tactics
- Keep distance and use heavy weapons.
- Monitor hull and power system condition.
- Prepare medics for mass crew injuries.

See also: [[Endworm]].
        `,
        infobox: [
            { fieldKey: 'threat', fieldLabel: 'Threat', fieldValue: 'Very high', sortOrder: 0 },
            { fieldKey: 'biome', fieldLabel: 'Biome', fieldValue: 'Abyss', sortOrder: 1 },
            { fieldKey: 'counter', fieldLabel: 'Countermeasure', fieldValue: 'Heavy turrets / crew coordination', sortOrder: 2 },
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
        summary: 'A large abyssal creature with high durability.',
        articleMarkdown: `
## Overview
Endworm is a threat in late campaign stages and requires strong weaponry.
        `,
        infobox: [
            { fieldKey: 'threat', fieldLabel: 'Threat', fieldValue: 'High', sortOrder: 0 },
            { fieldKey: 'biome', fieldLabel: 'Biome', fieldValue: 'Abyss', sortOrder: 1 },
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
        summary: 'A parasitic infection that requires rapid diagnosis and treatment.',
        articleMarkdown: `
## Symptoms
In early stages symptoms may be mild, but the condition progresses.

## Treatment
Medical drugs and patient isolation are used when needed.

Base medicine: [Bandage](/encyclopedia/bandage)
        `,
        infobox: [
            { fieldKey: 'type', fieldLabel: 'Type', fieldValue: 'Infection', sortOrder: 0 },
            { fieldKey: 'progression', fieldLabel: 'Progression', fieldValue: 'Gradual', sortOrder: 1 },
            { fieldKey: 'treatment', fieldLabel: 'Treatment', fieldValue: 'Medication / observation', sortOrder: 2 },
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
        summary: 'A basic medical consumable for stabilization.',
        articleMarkdown: `
## Purpose
Used as first aid for trauma and bleeding.
        `,
        infobox: [
            { fieldKey: 'slot', fieldLabel: 'Category', fieldValue: 'Medical item', sortOrder: 0 },
            { fieldKey: 'usage', fieldLabel: 'Usage', fieldValue: 'First aid', sortOrder: 1 },
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
        summary: 'A medicine for restoring patient blood volume.',
        articleMarkdown: `
## Purpose
Used to stabilize severe injuries with blood loss.
        `,
        infobox: [
            { fieldKey: 'slot', fieldLabel: 'Category', fieldValue: 'Medical item', sortOrder: 0 },
            { fieldKey: 'usage', fieldLabel: 'Usage', fieldValue: 'Transfusion', sortOrder: 1 },
        ],
    }),
    'alien-ruins': buildDemoDetail({
        slug: 'alien-ruins',
        title: 'Alien Ruins',
        entityType: 'LOCATION',
        primaryCategory: 'Ruins',
        secondaryCategory: 'Alien',
        summary: 'A dangerous location with artifacts and high crew risk.',
        articleMarkdown: `
## Features
Ruins contain valuable loot but require a prepared team and resources.
        `,
        infobox: [
            { fieldKey: 'location_type', fieldLabel: 'Location type', fieldValue: 'Ruins', sortOrder: 0 },
            { fieldKey: 'risk', fieldLabel: 'Risk', fieldValue: 'High', sortOrder: 1 },
        ],
    }),
    orca: buildDemoDetail({
        slug: 'orca',
        title: 'Orca',
        entityType: 'SUBMARINE',
        primaryCategory: 'Transport',
        secondaryCategory: '',
        summary: 'A versatile submarine for cargo and combat tasks.',
        articleMarkdown: `
## Overview
Orca fits a balanced playstyle and medium-difficulty missions.
        `,
        infobox: [
            { fieldKey: 'class', fieldLabel: 'Class', fieldValue: 'Transport', sortOrder: 0 },
            { fieldKey: 'crew', fieldLabel: 'Crew', fieldValue: '3-5', sortOrder: 1 },
            { fieldKey: 'strength', fieldLabel: 'Strength', fieldValue: 'Versatility', sortOrder: 2 },
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
        summary: 'A command role responsible for route, priorities, and coordination.',
        articleMarkdown: `
## Responsibilities
- Selecting missions and controlling navigation.
- Assigning tasks to the crew through the command system.
- Assessing risks in conflict situations.
        `,
        infobox: [
            { fieldKey: 'role', fieldLabel: 'Role', fieldValue: 'Command', sortOrder: 0 },
            { fieldKey: 'focus', fieldLabel: 'Focus', fieldValue: 'Navigation and coordination', sortOrder: 1 },
        ],
    }),
    'medical-doctor': buildDemoDetail({
        slug: 'medical-doctor',
        title: 'Medical Doctor',
        entityType: 'JOB',
        primaryCategory: 'Crew Roles',
        secondaryCategory: '',
        summary: 'A key role for treating afflictions and maintaining crew survivability.',
        articleMarkdown: `
## Responsibilities
The doctor manages medical supplies and crew condition in combat and emergency scenarios.
        `,
        infobox: [
            { fieldKey: 'role', fieldLabel: 'Role', fieldValue: 'Medicine', sortOrder: 0 },
            { fieldKey: 'focus', fieldLabel: 'Focus', fieldValue: 'Treatment / diagnostics', sortOrder: 1 },
        ],
    }),
    'inspiring-presence': buildDemoDetail({
        slug: 'inspiring-presence',
        title: 'Inspiring Presence',
        entityType: 'TALENT',
        primaryCategory: 'Captain Tree',
        secondaryCategory: '',
        summary: 'A talent that boosts team effectiveness in critical situations.',
        articleMarkdown: `
## Effect
Increases resilience and usefulness of nearby crew members.
        `,
        infobox: [
            { fieldKey: 'tree', fieldLabel: 'Tree', fieldValue: 'Captain', sortOrder: 0 },
            { fieldKey: 'impact', fieldLabel: 'Impact', fieldValue: 'Team support', sortOrder: 1 },
        ],
    }),
    'reactor-management': buildDemoDetail({
        slug: 'reactor-management',
        title: 'Reactor Management',
        entityType: 'OTHER',
        primaryCategory: 'Mechanics',
        secondaryCategory: '',
        summary: 'Basic mechanics for controlling power generation and consumption on a submarine.',
        articleMarkdown: `
## Basics
Stable power supply is critical for all systems: navigation, weapons, and life support.
        `,
        infobox: [
            { fieldKey: 'topic', fieldLabel: 'Topic', fieldValue: 'Power system', sortOrder: 0 },
            { fieldKey: 'importance', fieldLabel: 'Importance', fieldValue: 'Critical', sortOrder: 1 },
        ],
    }),
};

function buildGenericDemoDetail(slug) {
    return buildDemoDetail({
        slug,
        title: `Demo Article: ${slug}`,
        entityType: 'OTHER',
        primaryCategory: 'Demo',
        summary: 'Demo encyclopedia page for validating layout and data structure.',
        articleMarkdown: 'Content will be replaced with real data after vanilla import and article publication.',
        infobox: [
            { fieldKey: 'source', fieldLabel: 'Source', fieldValue: 'Demo fallback', sortOrder: 0 },
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
    return date.toLocaleDateString('en-US', {
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
        .replace(/[^a-z0-9]+/gi, '-')
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
                        setError(err?.message || 'Failed to load encyclopedia article');
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
                        <p>Loading article...</p>
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
                    <Link to="/encyclopedia" className="back-link">← Back to encyclopedia</Link>
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
                <Link to="/encyclopedia" className="back-link">← Back to encyclopedia</Link>

                <section className="encyclopedia-detail-hero glass-card">
                    <div className="encyclopedia-detail-hero-main">
                        <h1>{detail.title}</h1>
                        {detail.isDemo && (
                            <p className="encyclopedia-detail-demo-hint">
                                Demo article: content and infobox are used for structure preview.
                            </p>
                        )}
                        <p className="encyclopedia-detail-subtitle">
                            {detail.entityType || 'OTHER'}
                            {detail.primaryCategory ? ` · ${detail.primaryCategory}` : ''}
                            {detail.secondaryCategory ? ` / ${detail.secondaryCategory}` : ''}
                        </p>
                        <p className="encyclopedia-detail-summary">
                            {detail.summary || detail.shortDescription || 'Description is not available yet.'}
                        </p>
                    </div>
                    {isAdmin && !detail.isDemo && (
                        <div className="encyclopedia-detail-hero-actions">
                            <Link to={`/admin/encyclopedia/${detail.id}/edit`} className="btn btn-primary">
                                ✏️ Edit
                            </Link>
                        </div>
                    )}
                </section>

                <div className="encyclopedia-detail-layout">
                    <main className="encyclopedia-detail-main">
                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Article</SectionTitle>
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
                                <p className="encyclopedia-empty-text">Published content is missing.</p>
                            )}
                        </section>

                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Related entities</SectionTitle>
                            {detail.relatedEntities.length === 0 ? (
                                <p className="encyclopedia-empty-text">No relations added.</p>
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
                                <SectionTitle>Crafting</SectionTitle>
                                {!hasCraftRecipe ? (
                                    <p className="encyclopedia-empty-text">Crafting data is missing.</p>
                                ) : (
                                    <div className="encyclopedia-crafting-stack">
                                        {craftingRecipes.map((recipe, recipeIndex) => (
                                            <article
                                                className="encyclopedia-crafting-card"
                                                key={`${recipe.recipeType || 'recipe'}-${recipeIndex}`}
                                            >
                                                <div className="encyclopedia-crafting-card-meta">
                                                    <span>
                                                        <strong>Type:</strong> {recipe.recipeType || 'FABRICATE'}
                                                    </span>
                                                    {recipe.fabricationTime && (
                                                        <span>
                                                            <strong>Time:</strong> {recipe.fabricationTime}
                                                        </span>
                                                    )}
                                                    {recipe.outputCount && (
                                                        <span>
                                                            <strong>Output:</strong> {recipe.outputCount}
                                                        </span>
                                                    )}
                                                    {Array.isArray(recipe.requiredStations) && recipe.requiredStations.length > 0 && (
                                                        <span>
                                                            <strong>Station:</strong> {recipe.requiredStations.join(', ')}
                                                        </span>
                                                    )}
                                                </div>

                                                {Array.isArray(recipe.requiredSkills) && recipe.requiredSkills.length > 0 && (
                                                    <p className="encyclopedia-crafting-subline">
                                                        <strong>Required skills:</strong>{' '}
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
                                                    <p className="encyclopedia-empty-text">Ingredients are not specified.</p>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {detail.entityType === 'SUBMARINE' && (
                            <section className="encyclopedia-detail-section glass-card">
                                <SectionTitle>Armament</SectionTitle>
                                <div className="encyclopedia-armament-meta">
                                    <p><strong>Small turret slots:</strong> {detail.armament?.turretSlotCount ?? 0}</p>
                                    <p><strong>Large turret slots:</strong> {detail.armament?.largeTurretSlotCount ?? 0}</p>
                                </div>
                                <div className="encyclopedia-armament-grid">
                                    <div>
                                        <p className="encyclopedia-armament-heading">Small turrets</p>
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
                                            <p className="encyclopedia-empty-text">No data.</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="encyclopedia-armament-heading">Large turrets</p>
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
                                            <p className="encyclopedia-empty-text">No data.</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Backlinks</SectionTitle>
                            {detail.backlinks.length === 0 ? (
                                <p className="encyclopedia-empty-text">No backlinks from other articles yet.</p>
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
                            <SectionTitle>Related mods</SectionTitle>
                            {detail.relatedMods.length === 0 ? (
                                <p className="encyclopedia-empty-text">Related mods are not specified.</p>
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
                            <SectionTitle>Imported properties</SectionTitle>
                            {detail.importedProperties.length === 0 ? (
                                <p className="encyclopedia-empty-text">No imported properties.</p>
                            ) : (
                                <div className="encyclopedia-properties-table-wrap">
                                    <table className="encyclopedia-properties-table">
                                        <thead>
                                            <tr>
                                                <th>Key</th>
                                                <th>Value</th>
                                                <th>Type</th>
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
                                <div className="encyclopedia-primary-image-placeholder">Image not available</div>
                            )}
                        </section>

                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Infobox</SectionTitle>
                            {detail.infobox.length === 0 ? (
                                <p className="encyclopedia-empty-text">Infobox fields are empty.</p>
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
                            <SectionTitle>Metadata</SectionTitle>
                            <div className="encyclopedia-meta-list">
                                <p><strong>Slug:</strong> {detail.slug}</p>
                                <p><strong>Type:</strong> {detail.entityType || 'OTHER'}</p>
                                <p><strong>Subtype:</strong> {detail.subtype || '—'}</p>
                                <p><strong>Game version:</strong> {detail.sourceGameVersion || '—'}</p>
                                <p><strong>Published:</strong> {formatDate(detail.publishedAt)}</p>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}


