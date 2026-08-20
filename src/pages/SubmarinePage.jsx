import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as tagsApi from '../api/tags';
import * as submarinesApi from '../api/submarines';
import { useAuth } from '../context/AuthContext';
import TagChips from '../components/TagChips';
import RelatedGuidesSection from '../components/RelatedGuidesSection';
import ContentGlyph from '../components/ContentGlyph';
import WorkshopAuthorCard from '../components/WorkshopAuthorCard';
import SteamDescription from '../components/SteamDescription';
import { steamBbcodeToExcerpt } from '../utils/steamBbcode';
import './SubmarinePage.css';

const TAGS_PAGE_SIZE = 100;
const LazySubmarineGallery = lazy(() => import('../components/SubmarineGallery'));

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

function formatNumber(value, fractionDigits = 0) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return '—';
    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
}

/** Экипаж пишем, только если известны обе границы. */
function crewDisplay(submarine) {
    if (submarine.recommendedCrewDisplay) return submarine.recommendedCrewDisplay;
    const { recommendedCrewMin: min, recommendedCrewMax: max } = submarine;
    if (!isKnown(min) || !isKnown(max)) return null;
    return `${min} - ${max}`;
}

/**
 * Подзаголовок из того, что известно.
 *
 * Пустой класс и пустой тир раньше давали «— · Tier —» под каждым названием;
 * лучше не писать ничего, чем писать два прочерка.
 */
function heroSubtitle(submarine) {
    const parts = [];
    if (submarine.submarineClass) parts.push(submarine.submarineClass);
    if (isKnown(submarine.tier)) parts.push(`Tier ${submarine.tier}`);
    if (submarine.fabricationType) parts.push(submarine.fabricationType);
    return parts.length ? parts.join(' · ') : 'Community submarine';
}

function isKnown(value) {
    return value !== undefined && value !== null && !Number.isNaN(Number(value));
}

/**
 * Одна графа характеристик, и только если её есть чем заполнить.
 *
 * Раньше неизвестное показывалось прочерком, а единица измерения оставалась:
 * «— mk», «— km/h». Числа в базе тогда были нулями у всех лодок до одной, так
 * что на прочерк никто и не смотрел; теперь пустое действительно значит «файл
 * этой лодки ещё никто не читал», и висящая рядом единица только мешает.
 */
function metric(label, value, unit = '') {
    if (!isKnown(value)) return null;
    const shown = typeof value === 'number' ? formatNumber(value, Number.isInteger(value) ? 0 : 1) : value;
    return (
        <div className="submarine-metric" key={label}>
            <span>{label}</span>
            <strong>{unit ? `${shown} ${unit}` : shown}</strong>
        </div>
    );
}

/** Секция с характеристиками исчезает целиком, когда показывать нечего. */
function MetricSection({ title, metrics, empty }) {
    const shown = metrics.filter(Boolean);
    if (shown.length === 0) {
        return empty ? (
            <section className="submarine-section">
                <h2>{title}</h2>
                <p className="submarine-metrics-empty">{empty}</p>
            </section>
        ) : null;
    }
    return (
        <section className="submarine-section">
            <h2>{title}</h2>
            <div className="submarine-metrics-grid">{shown}</div>
        </section>
    );
}

/**
 * Моды, с которыми построена лодка.
 *
 * Списка два, и разделение важнее самих списков: лодка почти никогда не
 * *требует* мод -- ненайденный идентификатор просто не появится, и лодка
 * поплывёт без него. Жёстким требование делает только слово автора, поэтому
 * второй список назван «построена с», а не «нужно скачать».
 */
function ModDependencies({ state }) {
    const { loading, error, known, required, used } = state;

    if (loading) return <p className="submarine-metrics-empty">Reading this submarine's file…</p>;
    if (error) return <p className="submarine-metrics-empty">{error}</p>;
    // Пустые списки у непрочитанной лодки читались бы как «ничего не нужно»
    if (!known) {
        return (
            <p className="submarine-metrics-empty">
                Nobody has read this submarine's own file yet, so its mods are unknown.
            </p>
        );
    }
    if (required.length === 0 && used.length === 0) {
        return <p className="submarine-metrics-empty">Built from base game content only.</p>;
    }

    return (
        <div className="submarine-mod-groups">
            {required.length > 0 && (
                <div className="submarine-mod-group">
                    <h3>The author says these are required</h3>
                    <ul className="submarine-mod-list">
                        {required.map((entry) => (
                            <li key={entry.externalId ?? entry.name} className="submarine-mod is-hard">
                                <ModName entry={entry} />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {used.length > 0 && (
                <div className="submarine-mod-group">
                    <h3>Built with content from</h3>
                    <p className="submarine-mod-note">
                        Missing items simply will not appear — the boat still sails without these.
                    </p>
                    <ul className="submarine-mod-list">
                        {used.map((entry) => (
                            <li key={entry.externalId ?? entry.name} className="submarine-mod">
                                <ModName entry={entry} />
                                {/* Число отделяет «взят один стул» от «построено
                                    вокруг мода» -- решение об установке разное */}
                                {entry.usedContent > 0 && (
                                    <span className="submarine-mod-count">
                                        {entry.usedContent} {entry.usedContent === 1 ? 'item' : 'items'}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function ModName({ entry }) {
    const label = entry.name || (entry.externalId ? `Mod #${entry.externalId}` : 'Unnamed package');
    if (!entry.externalId) return <span className="submarine-mod-name">{label}</span>;
    return (
        <Link className="submarine-mod-name" to={`/mod/${entry.externalId}`}>{label}</Link>
    );
}

function DownloadIcon() {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 3v9m-4-3 4 4 4-4M4 16h12" />
        </svg>
    );
}

export default function SubmarinePage() {
    const { externalId } = useParams();
    const { isAuthenticated, isAdmin, user } = useAuth();
    const [submarine, setSubmarine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [allTags, setAllTags] = useState([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [tagsError, setTagsError] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [tagActionError, setTagActionError] = useState('');
    const [tagMutationLoading, setTagMutationLoading] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [subscribeError, setSubscribeError] = useState('');
    const [mods, setMods] = useState({
        loading: true, error: '', known: false, required: [], used: [],
    });

    useEffect(() => {
        let cancelled = false;

        const loadSubmarine = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await submarinesApi.getSubmarine(externalId);
                if (!cancelled) {
                    setSubmarine(response);
                }
            } catch (err) {
                if (!cancelled) {
                    setSubmarine(null);
                    setError(err?.message || 'Failed to load submarine');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadSubmarine();

        return () => {
            cancelled = true;
        };
    }, [externalId]);

    // Отдельным запросом: список модов считается по графу зависимостей и
    // приходит заметно позже самой карточки, а держать карточку ради него
    // пустой незачем.
    useEffect(() => {
        let cancelled = false;

        setMods({ loading: true, error: '', known: false, required: [], used: [] });
        submarinesApi.getSubmarineMods(externalId)
            .then((response) => {
                if (cancelled) return;
                setMods({ loading: false, error: '', ...response });
            })
            .catch((err) => {
                if (cancelled) return;
                setMods({
                    loading: false,
                    error: err?.message || 'Could not read which mods this submarine uses.',
                    known: false,
                    required: [],
                    used: [],
                });
            });

        return () => {
            cancelled = true;
        };
    }, [externalId]);

    const submarineTags = Array.isArray(submarine?.tags) ? submarine.tags : [];
    const authorUsername = submarine?.author_username || submarine?.authorUsername || '';
    const authorName = authorUsername || 'Unknown author';
    const authorSteamId = submarine?.author_steam_id || submarine?.authorSteamId || '';
    const authorId = submarine?.user_id ?? submarine?.userId;
    const currentUserId = user?.id;
    const normalizedAuthorUsername = String(authorUsername || '').trim().toLowerCase();
    const normalizedCurrentUsername = String(user?.username || '').trim().toLowerCase();
    const isAuthorById = authorId !== undefined
        && authorId !== null
        && currentUserId !== undefined
        && currentUserId !== null
        && String(authorId) === String(currentUserId);
    const isAuthorByUsername = normalizedAuthorUsername
        && normalizedCurrentUsername
        && normalizedAuthorUsername === normalizedCurrentUsername;
    const canManageTags = Boolean(isAuthenticated && submarine && (isAdmin || isAuthorById || isAuthorByUsername));

    useEffect(() => {
        if (!canManageTags) {
            setAllTags([]);
            setSelectedTag('');
            setIsAddingTag(false);
            setTagsError('');
            return;
        }

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
            } catch (err) {
                if (!cancelled) {
                    setAllTags([]);
                    setTagsError(err?.message || 'Failed to load tags');
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
    }, [canManageTags]);

    const currentTagIds = new Set(
        submarineTags
            .map((tag) => String(tag?.id || '').trim())
            .filter(Boolean),
    );

    const selectableTags = allTags.filter((tag) => {
        const tagId = String(tag?.id || '').trim();
        if (!tagId) return false;
        return !currentTagIds.has(tagId);
    });

    const handleAddTag = async () => {
        const tagId = String(selectedTag || '').trim();
        if (!tagId || tagMutationLoading) return;

        setTagMutationLoading(true);
        setTagActionError('');
        try {
            await submarinesApi.addSubmarineTag(externalId, tagId);
            const updated = await submarinesApi.getSubmarine(externalId);
            setSubmarine(updated);
            setSelectedTag('');
            setIsAddingTag(false);
        } catch (err) {
            setTagActionError(err?.message || 'Failed to add tag');
        } finally {
            setTagMutationLoading(false);
        }
    };

    const handleRemoveTag = async (tagId) => {
        const normalizedTagId = String(tagId || '').trim();
        if (!normalizedTagId || tagMutationLoading) return;

        setTagMutationLoading(true);
        setTagActionError('');
        try {
            await submarinesApi.removeSubmarineTag(externalId, normalizedTagId);
            const updated = await submarinesApi.getSubmarine(externalId);
            setSubmarine(updated);
        } catch (err) {
            setTagActionError(err?.message || 'Failed to remove tag');
        } finally {
            setTagMutationLoading(false);
        }
    };

    const handleSubscribe = async () => {
        setSubscribing(true);
        setSubscribeError('');
        try {
            await submarinesApi.subscribeSubmarine(externalId);
        } catch (err) {
            setSubscribeError(err?.message || 'Failed to open Steam Workshop');
        } finally {
            setSubscribing(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Loading submarine...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !submarine) {
        return (
            <div className="page">
                <div className="container">
                    <div className="auth-error">{error}</div>
                    <Link to="/submarines" className="btn btn-ghost submarine-back-btn">
                        ← Back to catalog
                    </Link>
                </div>
            </div>
        );
    }

    const mainImage = submarine.main_image || submarine.mainImage;
    const additionalImages = Array.isArray(submarine.additional_images)
        ? submarine.additional_images
        : Array.isArray(submarine.additionalImages)
            ? submarine.additionalImages
            : [];
    const descriptionExcerpt = steamBbcodeToExcerpt(submarine.description, 240);

    return (
        <div className="page submarine-page">
            <div className="container submarine-page-container">
                <Link to="/submarines" className="back-link">← Back to submarines</Link>

                <header className="submarine-hero">
                    <div className="submarine-hero-top">
                        <div className="submarine-hero-copy">
                            <h1>{submarine.title}</h1>
                            <p className="submarine-hero-subtitle">
                                {heroSubtitle(submarine)}
                            </p>
                        </div>
                        <div className="submarine-hero-actions">
                            {isAuthenticated && (
                                <Link
                                    className="btn btn-outline"
                                    to={`/guides/new/editor?targetType=SUBMARINE&targetId=${encodeURIComponent(externalId)}`}
                                >
                                    Write a guide
                                </Link>
                            )}
                            <button
                                className="submarine-download-btn"
                                onClick={handleSubscribe}
                                disabled={subscribing}
                            >
                                <DownloadIcon />
                                {subscribing ? 'Opening Workshop…' : 'Open in Workshop'}
                            </button>
                            <div className="submarine-hero-popularity" title="Steam Workshop visits">
                                {Number(submarine.popularity ?? 0).toLocaleString()} Workshop visits
                            </div>
                        </div>
                    </div>
                    <p className="submarine-hero-description">
                        {descriptionExcerpt || 'Community submarine for Barotrauma.'}
                    </p>
                    {subscribeError && <div className="submarine-subscribe-error">{subscribeError}</div>}
                </header>

                <div className="submarine-layout">
                    <main className="submarine-main">
                        <Suspense fallback={(
                            <section className="submarine-section">
                                <h2>Gallery</h2>
                                <p className="submarine-gallery-loading">Loading gallery...</p>
                            </section>
                        )}
                        >
                            <LazySubmarineGallery
                                title={submarine.title}
                                main_image={mainImage}
                                additional_images={additionalImages}
                            />
                        </Suspense>

                        <section className="submarine-section submarine-description-section">
                            <h2>Description</h2>
                            <SteamDescription source={submarine.description} variant="submarine" />
                        </section>

                        <MetricSection
                            title="Base stats"
                            empty="Nobody has read this submarine's own file yet, so its stats are unknown."
                            metrics={[
                                metric('Price', submarine.price, 'mk'),
                                metric('Crew', crewDisplay(submarine)),
                                metric('Cargo capacity', submarine.cargoCapacity),
                                // Тяга, а не скорость: скорость -- ответ физического
                                // движка, из файла лодки она не выводится
                                metric('Engine thrust', submarine.engineForce),
                                metric('Turret slots', submarine.turretSlotCount),
                                metric('Large slots', submarine.largeTurretSlotCount),
                            ]}
                        />

                        <MetricSection
                            title="Technical parameters"
                            metrics={[
                                metric('Length', submarine.lengthMeters, 'm'),
                                metric('Height', submarine.heightMeters, 'm'),
                                metric('Max descent speed', submarine.maxDescentSpeedKph, 'km/h'),
                                metric('Reactor', submarine.maxReactorOutputKw, 'kW'),
                            ]}
                        />

                        <section className="submarine-section">
                            <h2>Default armament</h2>
                            <div className="submarine-weapons">
                                <div className="submarine-weapon-group">
                                    <span className="submarine-weapon-icon">
                                        <ContentGlyph name="weapon" size={20} />
                                    </span>
                                    <div className="submarine-weapon-copy">
                                        <h3>Regular turrets</h3>
                                        {submarine.defaultTurretWeapons?.length ? (
                                            <ul>
                                                {submarine.defaultTurretWeapons.map((weapon) => (
                                                    <li key={weapon}>{weapon}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>Not specified</p>
                                        )}
                                    </div>
                                </div>
                                <div className="submarine-weapon-group">
                                    <span className="submarine-weapon-icon submarine-weapon-icon-large">
                                        <ContentGlyph name="weapon" size={22} />
                                    </span>
                                    <div className="submarine-weapon-copy">
                                        <h3>Large turrets</h3>
                                        {submarine.defaultLargeTurretWeapons?.length ? (
                                            <ul>
                                                {submarine.defaultLargeTurretWeapons.map((weapon) => (
                                                    <li key={weapon}>{weapon}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>Not specified</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="submarine-section">
                            <h2>Mods</h2>
                            <ModDependencies state={mods} />
                        </section>

                        <RelatedGuidesSection targetType="SUBMARINE" targetId={externalId} />
                    </main>

                    <aside className="submarine-sidebar">
                        <section className="submarine-section">
                            <h2>Metadata</h2>
                            <div className="submarine-meta">
                                <p><strong>External ID:</strong> {submarine.externalId ?? submarine.external_id ?? '—'}</p>
                                <p><strong>Created:</strong> {formatDate(submarine.createdAt || submarine.created_at)}</p>
                                <p><strong>Updated:</strong> {formatDate(submarine.updatedAt || submarine.updated_at)}</p>
                            </div>
                        </section>

                        <section className="submarine-section submarine-author-section">
                            <h2>Author</h2>
                            <WorkshopAuthorCard
                                authorName={authorName}
                                authorSteamId={authorSteamId}
                                variant="submarine"
                            />
                        </section>

                        <section className="submarine-section">
                            <h2>Tags</h2>
                            <TagChips
                                tags={submarineTags}
                                onRemove={canManageTags ? handleRemoveTag : undefined}
                                showRemoveButton={canManageTags}
                            />
                            {canManageTags && (
                                <div className="submarine-tag-editor">
                                    {!isAddingTag ? (
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            onClick={() => {
                                                setTagActionError('');
                                                setIsAddingTag(true);
                                            }}
                                        >
                                            + Add tag
                                        </button>
                                    ) : (
                                        <div className="submarine-tag-editor-controls">
                                            <label htmlFor="submarine-tag-select">Select tag</label>
                                            <select
                                                id="submarine-tag-select"
                                                aria-label="Select tag"
                                                value={selectedTag}
                                                onChange={(event) => setSelectedTag(event.target.value)}
                                                disabled={tagMutationLoading || tagsLoading || selectableTags.length === 0}
                                            >
                                                <option value="">Select tag</option>
                                                {selectableTags.map((tag) => (
                                                    <option key={tag.id} value={tag.id}>
                                                        {tag.name || tag.slug || tag.id}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="submarine-tag-editor-actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    onClick={handleAddTag}
                                                    disabled={!selectedTag || tagMutationLoading}
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => {
                                                        setTagActionError('');
                                                        setSelectedTag('');
                                                        setIsAddingTag(false);
                                                    }}
                                                    disabled={tagMutationLoading}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {tagsLoading && <p className="submarine-tag-meta">Loading tags...</p>}
                                    {!tagsLoading && isAddingTag && selectableTags.length === 0 && (
                                        <p className="submarine-tag-meta">All available tags are already added.</p>
                                    )}
                                    {tagsError && <p className="submarine-tag-error">{tagsError}</p>}
                                    {tagActionError && <p className="submarine-tag-error">{tagActionError}</p>}
                                </div>
                            )}
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}

