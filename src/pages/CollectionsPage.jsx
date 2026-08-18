import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteCollection, getMyCollections } from '../api/modCollections';
import useDocumentMeta from '../hooks/useDocumentMeta';
import StatusBadge from '../components/StatusBadge';
import '../components/collection/collection.css';
import './CollectionsPage.css';

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function modCount(collection) {
    const count = collection.items.length;
    return `${count} ${count === 1 ? 'mod' : 'mods'}`;
}

export default function CollectionsPage() {
    useDocumentMeta({
        title: 'My collections — BaroLab',
        description: 'Barotrauma mod collections you built, with their load order and conflicts.',
    });

    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const mine = await getMyCollections();
                if (!cancelled) setCollections(mine);
            } catch (loadError) {
                if (!cancelled) setError(loadError?.message || 'Could not load your collections.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleDelete = async (collection) => {
        const confirmed = window.confirm(`Delete "${collection.title}"? The link stops working for everyone.`);
        if (!confirmed) return;

        setDeletingId(collection.id);
        setError('');
        try {
            await deleteCollection(collection.id);
            setCollections((current) => current.filter((entry) => entry.id !== collection.id));
        } catch (deleteError) {
            setError(deleteError?.message || 'Could not delete the collection.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="page">
            <div className="container collections-page">
                <header className="collections-header glass-card">
                    <div>
                        <h1 className="page-title">My collections</h1>
                        <p className="page-subtitle">
                            Each one keeps its own load order and can be shared by link.
                        </p>
                    </div>
                    <Link className="btn btn-primary" to="/collections/new">New collection</Link>
                </header>

                {error && <p className="collection-note is-error">{error}</p>}

                {loading ? (
                    <p className="collection-note">Loading…</p>
                ) : collections.length === 0 ? (
                    <section className="glass-card collections-empty">
                        <h2>Nothing here yet</h2>
                        <p className="collection-note">
                            Build one from the mods on the site and BaroLab works out the order the game needs.
                        </p>
                        <Link className="btn btn-primary" to="/collections/new">Build a collection</Link>
                    </section>
                ) : (
                    <ul className="collections-list">
                        {collections.map((collection) => (
                            <li key={collection.id} className="glass-card collection-row">
                                <div className="collection-row-copy">
                                    <Link to={`/collections/${collection.slug}`} className="collection-row-title">
                                        {collection.title}
                                    </Link>
                                    <div className="collection-row-meta">
                                        <span>{modCount(collection)}</span>
                                        {collection.gameVersion && <span>for {collection.gameVersion}</span>}
                                        {collection.updatedAt && <span>edited {formatDate(collection.updatedAt)}</span>}
                                        {collection.status !== 'ACTIVE' && <StatusBadge status={collection.status} />}
                                    </div>
                                </div>
                                <div className="collection-row-actions">
                                    <Link className="btn btn-outline btn-sm" to={`/collections/${collection.slug}/edit`}>
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleDelete(collection)}
                                        disabled={deletingId === collection.id}
                                    >
                                        {deletingId === collection.id ? 'Deleting…' : 'Delete'}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
