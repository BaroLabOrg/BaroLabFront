import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getModGuides } from '../api/modGuides';
import { useAuth } from '../context/AuthContext';
import './GuidesSection.css';

export default function GuidesSection() {
    const { externalId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);

    const canCreateGuide = user !== null;
    const canEditGuide = (guideAuthorId) => user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.id === guideAuthorId);

    useEffect(() => {
        async function fetchGuides() {
            try {
                if (externalId) {
                    const data = await getModGuides(externalId);
                    setGuides(data || []);
                }
            } catch (err) {
                // Ignore errors if the guide just doesn't exist
                console.error('Failed to fetch guides', err);
            } finally {
                setLoading(false);
            }
        }
        fetchGuides();
    }, [externalId]);

    const handleCreateGuide = () => {
        navigate(`/admin/mod/${externalId}/guides/new`);
    };

    const handleEditGuide = (guideId) => {
        navigate(`/admin/mod/${externalId}/guides/${guideId}/edit`);
    };

    if (loading) {
        return (
            <section className="guides-section glass-card">
                <div className="guides-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="guides-accent-bar" />
                        <h3 className="guides-title" style={{ margin: 0 }}>Связанные руководства</h3>
                    </div>
                </div>
                <div className="guides-empty">
                    <p>Загрузка...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="guides-section glass-card">
            <div className="guides-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="guides-accent-bar" />
                    <h3 className="guides-title" style={{ margin: 0 }}>Связанные руководства</h3>
                </div>
                {canCreateGuide && (
                    <button
                        onClick={handleCreateGuide}
                        style={{
                            background: '#4da6ff',
                            color: '#000',
                            border: 'none',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.85rem'
                        }}
                    >
                        Создать руководство
                    </button>
                )}
            </div>

            {guides.length === 0 ? (
                <div className="guides-empty">
                    <span className="guides-empty-icon">📖</span>
                    <p>Для этого мода пока нет руководств.</p>
                </div>
            ) : (
                <ul className="guides-list">
                    {guides.map((guide) => (
                        <li key={guide.id} className="guide-item" style={{ position: 'relative', marginBottom: '0.5rem' }}>
                            <Link to={`/mod/${externalId}/guides/${guide.id}`} className="guide-link" style={{ display: 'flex', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                <span className="guide-icon">📄</span>
                                <div className="guide-info" style={{ marginLeft: '1rem', flex: 1 }}>
                                    <span className="guide-name" style={{ color: '#4da6ff', fontWeight: 'bold' }}>{guide.title}</span>
                                    <br />
                                    <span className="guide-meta" style={{ fontSize: '0.8rem', color: '#888' }}>
                                        Автор: {guide.author?.username || 'Unknown'} · {guide.createdAt ? new Date(guide.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </Link>
                            {canEditGuide(guide.author?.id) && (
                                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleEditGuide(guide.id);
                                        }}
                                        style={{
                                            background: 'transparent',
                                            color: '#4da6ff',
                                            border: '1px solid #4da6ff',
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        Редактировать
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
