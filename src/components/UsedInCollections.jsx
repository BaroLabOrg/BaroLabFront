import './UsedInCollections.css';

const MOCK_COLLECTIONS = [
    // TODO: replace with real data when collections endpoint is available
];

export default function UsedInCollections({ collections = MOCK_COLLECTIONS }) {
    return (
        <section className="collections-section glass-card">
            <div className="collections-header">
                <span className="collections-accent-bar" />
                <h3 className="collections-title">Этот мод используют в сборках</h3>
            </div>

            {collections.length === 0 ? (
                <div className="collections-empty">
                    <span className="collections-empty-icon">📦</span>
                    <p>Пока нет данных</p>
                </div>
            ) : (
                <div className="collections-scroll">
                    {collections.map((col, i) => (
                        <div key={i} className="collection-card">
                            <div className="collection-img-placeholder">
                                {col.image ? (
                                    <img src={col.image} alt={col.title} />
                                ) : (
                                    <span>📦</span>
                                )}
                            </div>
                            <span className="collection-name">{col.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
