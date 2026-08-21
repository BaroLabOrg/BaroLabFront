import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    collectionExportFilename,
    exportCollectionXml,
    getCollection,
    getCollectionAnalysis,
    resolveCollection,
} from '../api/modCollections';
import { useAuth } from '../context/AuthContext';
import useDocumentMeta from '../hooks/useDocumentMeta';
import CollectionProblems from '../components/collection/CollectionProblems';
import MissingMods from '../components/collection/MissingMods';
import OrderedModList from '../components/collection/OrderedModList';
import StatusBadge from '../components/StatusBadge';
import './CollectionPage.css';

function saveXmlFile(slug, xml) {
    if (typeof URL?.createObjectURL !== 'function') return false;

    const url = URL.createObjectURL(new Blob([xml], { type: 'application/xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = collectionExportFilename(slug);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
}

export default function CollectionPage() {
    const { slug } = useParams();
    const { user } = useAuth();

    const [collection, setCollection] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [resolving, setResolving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [showXml, setShowXml] = useState(false);

    useDocumentMeta({
        title: collection ? `${collection.title} — BaroLab` : 'Collection — BaroLab',
        description: collection?.description
            || 'A Barotrauma mod collection with the load order the game needs.',
    });

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const [loaded, computed] = await Promise.all([
                    getCollection(slug),
                    getCollectionAnalysis(slug),
                ]);
                if (cancelled) return;
                setCollection(loaded);
                setAnalysis(computed);
            } catch (loadError) {
                if (!cancelled) setError(loadError?.message || 'Could not load this collection.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [slug]);

    const isOwner = Boolean(user && collection?.ownerId && user.id === collection.ownerId);

    const orderedEntries = useMemo(() => {
        if (!analysis || !collection) return [];
        const nameById = new Map(collection.items.map((item) => [item.workshopId, item.name]));
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
    }, [analysis, collection]);

    const handleResolve = async () => {
        setResolving(true);
        setActionError('');
        try {
            const computed = await resolveCollection(collection.id);
            setAnalysis(computed);
            setCollection(await getCollection(slug));
        } catch (resolveError) {
            setActionError(resolveError?.message || 'Could not store the order.');
        } finally {
            setResolving(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        setActionError('');
        try {
            const xml = await exportCollectionXml(slug);
            if (!saveXmlFile(slug, xml)) {
                setShowXml(true);
            }
        } catch (exportError) {
            setActionError(exportError?.message || 'Could not build the file.');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container"><p className="collection-note">Loading the collection…</p></div>
            </div>
        );
    }

    if (error || !collection) {
        return (
            <div className="page">
                <div className="container">
                    <section className="glass-card collection-page-message">
                        <h1 className="page-title">Collection not available</h1>
                        <p className="collection-note is-error">{error || 'It is not here.'}</p>
                        <Link className="btn btn-outline" to="/mods">Browse mods</Link>
                    </section>
                </div>
            </div>
        );
    }

    const unknownCount = analysis?.unknownWorkshopIds.length || 0;

    return (
        <div className="page">
            <div className="container collection-page">
                <header className="collection-page-header glass-card">
                    <div className="collection-page-heading">
                        <h1 className="page-title">{collection.title}</h1>
                        <div className="collection-page-meta">
                            <span>{collection.items.length} mods</span>
                            {/* Лодка не среди модов, но она -- причина, по которой
                                эта сборка вообще собрана, и назвать её надо первым делом */}
                            {collection.submarineExternalId && (
                                <span>
                                    built for{' '}
                                    <Link to={`/submarines/${collection.submarineExternalId}`}>
                                        {collection.submarineName
                                            || `Submarine #${collection.submarineExternalId}`}
                                    </Link>
                                </span>
                            )}
                            {collection.gameVersion && <span>for {collection.gameVersion}</span>}
                            {collection.status !== 'ACTIVE' && <StatusBadge status={collection.status} />}
                        </div>
                        {collection.description && (
                            <p className="collection-page-description">{collection.description}</p>
                        )}
                    </div>

                    <div className="collection-page-actions">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleExport}
                            disabled={exporting}
                        >
                            {exporting ? 'Building…' : 'Download for the game'}
                        </button>
                        {isOwner && (
                            <>
                                <Link className="btn btn-outline" to={`/collections/${slug}/edit`}>Edit</Link>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={handleResolve}
                                    disabled={resolving}
                                >
                                    {resolving ? 'Working…' : 'Store this order'}
                                </button>
                            </>
                        )}
                    </div>
                </header>

                {actionError && <p className="collection-note is-error">{actionError}</p>}

                <section className="glass-card collection-panel">
                    <h2 className="collection-panel-title">Load order</h2>
                    <OrderedModList entries={orderedEntries} emptyLabel="This collection has no mods in it." />

                    {unknownCount > 0 && (
                        <p className="collection-note is-warning collection-page-warning">
                            {unknownCount} {unknownCount === 1 ? 'mod is' : 'mods are'} not in the graph yet,
                            so {unknownCount === 1 ? 'it is' : 'they are'} left out of the downloaded file —
                            add {unknownCount === 1 ? 'it' : 'them'} in the game by hand.
                        </p>
                    )}

                    <div className="collection-page-file">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowXml((current) => !current)}
                        >
                            {showXml ? 'Hide the file' : 'Show the file'}
                        </button>
                        <p className="collection-note">
                            Replace the <code>&lt;contentpackages&gt;</code> block in <code>config_player.xml</code>
                            {' '}with this. On Windows that file sits in
                            {' '}<code>%LOCALAPPDATA%\Daedalic Entertainment GmbH\Barotrauma</code>.
                        </p>
                        {showXml && (
                            <pre className="collection-page-xml">{analysis?.contentPackagesXml}</pre>
                        )}
                    </div>
                </section>

                <div className="collection-page-grid">
                    <section className="glass-card collection-panel">
                        <h2 className="collection-panel-title">
                            Missing
                            {analysis?.missing.length ? (
                                <span className="collection-panel-count">{analysis.missing.length}</span>
                            ) : null}
                        </h2>
                        <MissingMods missing={analysis?.missing || []} />
                    </section>

                    <section className="glass-card collection-panel">
                        <h2 className="collection-panel-title">
                            Problems
                            {analysis?.problems.length ? (
                                <span className="collection-panel-count">{analysis.problems.length}</span>
                            ) : null}
                        </h2>
                        <CollectionProblems problems={analysis?.problems || []} />
                    </section>
                </div>
            </div>
        </div>
    );
}
