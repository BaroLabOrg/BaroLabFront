import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getEncyclopediaDetail } from '../api/encyclopedia';
import { useAuth } from '../context/AuthContext';
import EventActionTree from '../components/EventActionTree';
import { PropertyFieldList } from '../components/PropertyValue';
import { groupProperties, splitImportedProperties } from '../utils/importedProperties';
import { humanizeIdentifier } from '../utils/text';
import './EncyclopediaDetailPage.css';

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
    const [showRawProperties, setShowRawProperties] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadDetail = async () => {
            setLoading(true);
            setError('');
            setShowRawProperties(false);
            try {
                const response = await getEncyclopediaDetail(slug);
                if (!cancelled) {
                    setDetail(response ? ensureDetailCollections(response) : null);
                }
            } catch (err) {
                if (!cancelled) {
                    setDetail(null);
                    setError(err?.message || 'Failed to load encyclopedia article');
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

    const { visible: visibleProperties, hidden: hiddenProperties } = useMemo(
        () => splitImportedProperties(detail?.importedProperties),
        [detail?.importedProperties],
    );

    const isRandomEvent = detail?.entityType === 'RANDOM_EVENT';

    // A random event's whole content is its `actions` tree; it gets its own
    // section below, so keep it out of the generic property list.
    const eventActions = useMemo(() => {
        if (!isRandomEvent) return null;
        const property = visibleProperties.find((entry) => entry.propertyKey === 'actions');
        const value = property?.displayData ?? null;
        return Array.isArray(value) && value.length > 0 ? value : null;
    }, [isRandomEvent, visibleProperties]);

    const propertyGroups = useMemo(
        () => groupProperties(
            eventActions
                ? visibleProperties.filter((entry) => entry.propertyKey !== 'actions')
                : visibleProperties,
        ),
        [visibleProperties, eventActions],
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
    const hasCraftRecipe = Boolean(detail.crafting?.hasRecipe ?? detail.crafting?.has_recipe ?? craftingRecipes.length > 0);
    const hasArmament = Boolean(detail.armament);

    return (
        <div className="page encyclopedia-detail-page">
            <div className="container encyclopedia-detail-container">
                <Link to="/encyclopedia" className="back-link">← Back to encyclopedia</Link>

                <section className="encyclopedia-detail-hero glass-card">
                    <div className="encyclopedia-detail-hero-main">
                        <h1>{detail.title}</h1>
                        <p className="encyclopedia-detail-subtitle">
                            {detail.entityType || 'OTHER'}
                            {detail.entitySource ? ` · ${detail.entitySource === 'MOD' ? 'Mod' : 'Vanilla'}` : ''}
                            {detail.primaryCategory ? ` · ${detail.primaryCategory}` : ''}
                            {detail.secondaryCategory ? ` / ${detail.secondaryCategory}` : ''}
                        </p>
                        <p className="encyclopedia-detail-summary">
                            {detail.summary || detail.shortDescription || 'Description is not available yet.'}
                        </p>
                    </div>
                    {isAdmin && (
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

                        {hasCraftRecipe && (
                            <section className="encyclopedia-detail-section glass-card">
                                <SectionTitle>Crafting</SectionTitle>
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
                            </section>
                        )}

                        {hasArmament && (
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

                        {eventActions && (
                            <section className="encyclopedia-detail-section glass-card">
                                <SectionTitle>Event script</SectionTitle>
                                <EventActionTree nodes={eventActions} />
                            </section>
                        )}

                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Imported properties</SectionTitle>
                            {detail.importedProperties.length === 0 ? (
                                <p className="encyclopedia-empty-text">No imported properties.</p>
                            ) : (
                                <>
                                    {propertyGroups.length === 0 ? (
                                        <p className="encyclopedia-empty-text">No notable properties to show.</p>
                                    ) : (
                                        <div className="encyclopedia-properties-groups">
                                            {propertyGroups.map((group) => (
                                                <div className="encyclopedia-properties-group" key={group.name}>
                                                    <p className="encyclopedia-properties-group-title">
                                                        {humanizeIdentifier(group.name)}
                                                    </p>
                                                    <PropertyFieldList
                                                        entries={group.items.map((property) => [
                                                            property.propertyKey,
                                                            property.valueType === 'JSON' && property.displayData !== undefined
                                                                ? property.displayData
                                                                : property.propertyValue,
                                                        ])}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(hiddenProperties.length > 0 || Boolean(eventActions)) && (
                                        <button
                                            type="button"
                                            className="encyclopedia-properties-toggle"
                                            onClick={() => setShowRawProperties((prev) => !prev)}
                                        >
                                            {showRawProperties ? 'Hide' : 'Show'} raw imported data ({detail.importedProperties.length})
                                        </button>
                                    )}

                                    {showRawProperties && (
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
                                </>
                            )}
                        </section>
                    </main>

                    <aside className="encyclopedia-detail-sidebar">
                        {/* Random events never ship an icon or infobox-worthy
                            stats, so an empty placeholder there is just noise. */}
                        {!isRandomEvent && (
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
                        )}

                        {!(isRandomEvent && detail.infobox.length === 0) && (
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
                        )}

                        <section className="encyclopedia-detail-section glass-card">
                            <SectionTitle>Metadata</SectionTitle>
                            <div className="encyclopedia-meta-list">
                                <p><strong>Slug:</strong> {detail.slug}</p>
                                <p><strong>Type:</strong> {detail.entityType || 'OTHER'}</p>
                                <p><strong>Source:</strong> {detail.entitySource === 'MOD' ? 'Mod' : 'Vanilla'}</p>
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
