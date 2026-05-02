import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as tagsApi from '../api/tags';
import * as submarinesApi from '../api/submarines';
import { useAuth } from '../context/AuthContext';
import TagChips from '../components/TagChips';
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

function metric(label, value) {
    return (
        <div className="submarine-metric">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
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

    const submarineTags = Array.isArray(submarine?.tags) ? submarine.tags : [];
    const authorUsername = submarine?.author_username || submarine?.authorUsername || '';
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

    return (
        <div className="page submarine-page">
            <div className="container submarine-page-container">
                <Link to="/submarines" className="back-link">← Back to submarines</Link>

                <section className="submarine-hero glass-card">
                    <div className="submarine-hero-top">
                        <div className="submarine-hero-copy">
                            <h1>{submarine.title}</h1>
                            <p className="submarine-hero-subtitle">
                                {submarine.submarineClass || '—'} · Tier {submarine.tier ?? '—'}
                                {submarine.fabricationType ? ` · ${submarine.fabricationType}` : ''}
                            </p>
                        </div>
                        <div className="submarine-hero-actions">
                            <button
                                className="btn btn-primary submarine-download-btn"
                                onClick={handleSubscribe}
                                disabled={subscribing}
                            >
                                {subscribing ? 'Loading...' : '⬇ Download'}
                            </button>
                            <div className="submarine-hero-popularity" title="Steam Workshop visits">
                                🔗 {submarine.popularity ?? 0} visits
                            </div>
                        </div>
                    </div>
                    <p className="submarine-hero-description">{submarine.description || 'No description.'}</p>
                    {subscribeError && <div className="submarine-subscribe-error">{subscribeError}</div>}
                </section>

                <div className="submarine-layout">
                    <main className="submarine-main">
                        <Suspense fallback={(
                            <section className="submarine-section glass-card">
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

                        <section className="submarine-section glass-card">
                            <h2>Base stats</h2>
                            <div className="submarine-metrics-grid">
                                {metric('Price', `${formatNumber(submarine.price)} mk`)}
                                {metric('Crew', submarine.recommendedCrewDisplay || `${submarine.recommendedCrewMin ?? '—'} - ${submarine.recommendedCrewMax ?? '—'}`)}
                                {metric('Cargo capacity', formatNumber(submarine.cargoCapacity))}
                                {metric('Max speed (horizontal)', `${formatNumber(submarine.maxHorizontalSpeedKph, 1)} km/h`)}
                                {metric('Turret slots', formatNumber(submarine.turretSlotCount))}
                                {metric('Large slots', formatNumber(submarine.largeTurretSlotCount))}
                            </div>
                        </section>

                        <section className="submarine-section glass-card">
                            <h2>Technical parameters</h2>
                            <div className="submarine-metrics-grid">
                                {metric('Length', submarine.lengthMeters !== undefined && submarine.lengthMeters !== null ? `${formatNumber(submarine.lengthMeters, 1)} m` : '—')}
                                {metric('Height', submarine.heightMeters !== undefined && submarine.heightMeters !== null ? `${formatNumber(submarine.heightMeters, 1)} m` : '—')}
                                {metric('Max descent speed', submarine.maxDescentSpeedKph !== undefined && submarine.maxDescentSpeedKph !== null ? `${formatNumber(submarine.maxDescentSpeedKph, 1)} km/h` : '—')}
                                {metric('Reactor', submarine.maxReactorOutputKw !== undefined && submarine.maxReactorOutputKw !== null ? `${formatNumber(submarine.maxReactorOutputKw, 1)} kW` : '—')}
                            </div>
                        </section>

                        <section className="submarine-section glass-card">
                            <h2>Default armament</h2>
                            <div className="submarine-weapons">
                                <div>
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
                                <div>
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
                        </section>
                    </main>

                    <aside className="submarine-sidebar">
                        <section className="submarine-section glass-card">
                            <h2>Metadata</h2>
                            <div className="submarine-meta">
                                <p><strong>External ID:</strong> {submarine.externalId ?? submarine.external_id ?? '—'}</p>
                                <p><strong>Author:</strong> {submarine.authorUsername || submarine.author_username || '—'}</p>
                                <p><strong>Created:</strong> {formatDate(submarine.createdAt || submarine.created_at)}</p>
                                <p><strong>Updated:</strong> {formatDate(submarine.updatedAt || submarine.updated_at)}</p>
                            </div>
                        </section>

                        <section className="submarine-section glass-card">
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

