import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    analyseCollection,
    createCollection,
    getCollection,
    updateCollection,
} from '../api/modCollections';
import { getMod } from '../api/mods';
import { useAuth } from '../context/AuthContext';
import useDocumentMeta from '../hooks/useDocumentMeta';
import CollectionProblems from '../components/collection/CollectionProblems';
import MissingMods from '../components/collection/MissingMods';
import ModPicker from '../components/collection/ModPicker';
import OrderedModList from '../components/collection/OrderedModList';
import SelectedMods from '../components/collection/SelectedMods';
import './CollectionBuilderPage.css';

const ANALYSE_DELAY_MS = 400;

function moveWithin(mods, workshopId, delta) {
    const index = mods.findIndex((mod) => mod.workshopId === workshopId);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= mods.length) return mods;

    const next = [...mods];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
}

export default function CollectionBuilderPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const editing = Boolean(slug);

    useDocumentMeta({
        title: editing ? 'Edit collection — BaroLab' : 'New collection — BaroLab',
        description: 'Build a Barotrauma mod collection and get the load order the game needs.',
    });

    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(editing);
    const [loadError, setLoadError] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [gameVersion, setGameVersion] = useState('');
    const [mods, setMods] = useState([]);

    const [analysis, setAnalysis] = useState(null);
    const [analysing, setAnalysing] = useState(false);
    const [analysisError, setAnalysisError] = useState('');

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const workshopIds = useMemo(() => mods.map((mod) => mod.workshopId), [mods]);
    const idsKey = workshopIds.join(',');

    useEffect(() => {
        if (!editing) return undefined;
        let cancelled = false;

        (async () => {
            setLoading(true);
            setLoadError('');
            try {
                const loaded = await getCollection(slug);
                if (cancelled) return;
                setCollection(loaded);
                setTitle(loaded.title);
                setDescription(loaded.description);
                setGameVersion(loaded.gameVersion);
                setMods(loaded.items.map((item) => ({
                    workshopId: item.workshopId,
                    name: item.name || `Mod #${item.workshopId}`,
                })));
            } catch (error) {
                if (!cancelled) setLoadError(error?.message || 'Could not load this collection.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [editing, slug]);

    // Analysis changes nothing on the server, so it can follow the list as it
    // is edited. Storing the order stays an explicit action.
    useEffect(() => {
        const ids = idsKey ? idsKey.split(',').map(Number) : [];
        if (ids.length === 0) {
            setAnalysis(null);
            setAnalysisError('');
            return undefined;
        }

        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setAnalysing(true);
            setAnalysisError('');
            try {
                const result = await analyseCollection(ids);
                if (!cancelled) setAnalysis(result);
            } catch (error) {
                if (!cancelled) {
                    setAnalysis(null);
                    setAnalysisError(error?.message || 'Could not analyse this list.');
                }
            } finally {
                if (!cancelled) setAnalysing(false);
            }
        }, ANALYSE_DELAY_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [idsKey]);

    const [addingMissingId, setAddingMissingId] = useState(null);
    const [missingErrors, setMissingErrors] = useState({});

    const addMod = (mod) => {
        setMods((current) => (current.some((entry) => entry.workshopId === mod.workshopId)
            ? current
            : [...current, mod]));
        setSaveError('');
    };

    /**
     * The graph names packages the site itself may not carry as mods -- a
     * content mod its author tagged as a submarine ends up in the submarine
     * section, and the API then refuses it. Better to say so on the row than
     * to fail the save minutes later.
     */
    const addMissing = async (entry) => {
        setAddingMissingId(entry.externalId);
        try {
            await getMod(entry.externalId);
            addMod({
                workshopId: entry.externalId,
                name: entry.name || `Mod #${entry.externalId}`,
            });
            setMissingErrors((current) => {
                const next = { ...current };
                delete next[entry.externalId];
                return next;
            });
        } catch {
            setMissingErrors((current) => ({
                ...current,
                [entry.externalId]: 'The site does not carry this one as a mod, so it cannot go into a collection.',
            }));
        } finally {
            setAddingMissingId(null);
        }
    };

    const orderedEntries = useMemo(() => {
        if (!analysis) return [];
        const nameById = new Map(mods.map((mod) => [mod.workshopId, mod.name]));
        const placed = analysis.order.map((entry) => ({
            ...entry,
            name: entry.name || nameById.get(entry.externalId) || '',
        }));
        const unplaced = analysis.unknownWorkshopIds.map((id, index) => ({
            externalId: id,
            name: nameById.get(id) || `Mod #${id}`,
            position: placed.length + index + 1,
            reason: '',
            placed: false,
        }));
        return [...placed, ...unplaced];
    }, [analysis, mods]);

    const handleSave = async (event) => {
        event.preventDefault();
        setSaveError('');

        if (!title.trim()) {
            setSaveError('Give the collection a title.');
            return;
        }
        if (workshopIds.length === 0) {
            setSaveError('Add at least one mod or submarine.');
            return;
        }

        setSaving(true);
        try {
            const payload = { title, description, gameVersion, workshopIds };
            const saved = editing
                ? await updateCollection(collection.id, payload)
                : await createCollection(payload);
            navigate(`/collections/${saved.slug}`);
        } catch (error) {
            setSaveError(error?.message || 'Could not save the collection.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <p className="collection-note">Loading the collection…</p>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="page">
                <div className="container">
                    <section className="glass-card collection-builder-message">
                        <h1 className="page-title">Collection not available</h1>
                        <p className="collection-note is-error">{loadError}</p>
                        <Link className="btn btn-outline" to="/collections">My collections</Link>
                    </section>
                </div>
            </div>
        );
    }

    if (editing && collection && user && collection.ownerId && collection.ownerId !== user.id) {
        return (
            <div className="page">
                <div className="container">
                    <section className="glass-card collection-builder-message">
                        <h1 className="page-title">This collection is not yours</h1>
                        <p className="collection-note">Only its author can change it. You can still read it.</p>
                        <Link className="btn btn-outline" to={`/collections/${collection.slug}`}>
                            Open the collection
                        </Link>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container collection-builder">
                <header className="collection-builder-header glass-card">
                    <div>
                        <h1 className="page-title">{editing ? 'Edit collection' : 'New collection'}</h1>
                        <p className="page-subtitle">
                            Pick the mods you play with. The order to load them in is worked out from what
                            they actually change in the game.
                        </p>
                    </div>
                    <div className="collection-builder-actions">
                        <Link className="btn btn-outline" to={editing ? `/collections/${slug}` : '/collections'}>
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            form="collection-form"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create collection'}
                        </button>
                    </div>
                </header>

                <form id="collection-form" className="collection-builder-form glass-card" onSubmit={handleSave}>
                    <label className="collection-builder-field">
                        <span className="collection-field-label">Title</span>
                        <input
                            type="text"
                            value={title}
                            maxLength={200}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Medical overhaul run"
                            disabled={saving}
                        />
                    </label>
                    <label className="collection-builder-field">
                        <span className="collection-field-label">Game version (optional)</span>
                        <input
                            type="text"
                            value={gameVersion}
                            onChange={(event) => setGameVersion(event.target.value)}
                            placeholder="1.13.4.0"
                            disabled={saving}
                        />
                    </label>
                    <label className="collection-builder-field is-wide">
                        <span className="collection-field-label">Description (optional)</span>
                        <textarea
                            rows={3}
                            value={description}
                            maxLength={4000}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="What this setup is for, and anything a player should know before installing it."
                            disabled={saving}
                        />
                    </label>
                    {saveError && <p className="collection-note is-error collection-builder-error">{saveError}</p>}
                </form>

                <div className="collection-builder-grid">
                    <section className="glass-card collection-panel">
                        <h2 className="collection-panel-title">Add mods and submarines</h2>
                        <ModPicker selectedIds={workshopIds} onAdd={addMod} disabled={saving} />
                    </section>

                    <section className="glass-card collection-panel">
                        <h2 className="collection-panel-title">
                            In this collection
                            <span className="collection-panel-count">{mods.length}</span>
                        </h2>
                        <SelectedMods
                            mods={mods}
                            unknownIds={analysis?.unknownWorkshopIds || []}
                            onRemove={(id) => setMods((current) => current.filter((mod) => mod.workshopId !== id))}
                            onMove={(id, delta) => setMods((current) => moveWithin(current, id, delta))}
                            disabled={saving}
                        />
                    </section>

                    <section className="glass-card collection-panel is-wide">
                        <h2 className="collection-panel-title">
                            Load order
                            {analysing && <span className="collection-panel-state">working…</span>}
                        </h2>
                        {analysisError ? (
                            <p className="collection-note is-error">{analysisError}</p>
                        ) : (
                            <OrderedModList entries={orderedEntries} />
                        )}
                    </section>

                    <section className="glass-card collection-panel">
                        <h2 className="collection-panel-title">
                            Missing
                            {analysis?.missing.length ? (
                                <span className="collection-panel-count">{analysis.missing.length}</span>
                            ) : null}
                        </h2>
                        <MissingMods
                            missing={analysis?.missing || []}
                            onAdd={addMissing}
                            addingId={addingMissingId}
                            errors={missingErrors}
                            emptyLabel={analysis ? 'Nothing is missing.' : 'Add something to see what it needs.'}
                        />
                    </section>

                    <section className="glass-card collection-panel">
                        <h2 className="collection-panel-title">
                            Problems
                            {analysis?.problems.length ? (
                                <span className="collection-panel-count">{analysis.problems.length}</span>
                            ) : null}
                        </h2>
                        <CollectionProblems
                            problems={analysis?.problems || []}
                            emptyLabel={analysis ? 'Nothing to report.' : 'Add mods to have them checked.'}
                        />
                    </section>
                </div>
            </div>
        </div>
    );
}
