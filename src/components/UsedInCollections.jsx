import ContentGlyph from './ContentGlyph';
import './UsedInCollections.css';

const MOCK_COLLECTIONS = [
    // TODO: replace with real data when collections endpoint is available
];

export default function UsedInCollections({ collections = MOCK_COLLECTIONS }) {
    return (
        <section className="collections-section" aria-labelledby="collections-heading">
            <div className="collections-header">
                <h3 id="collections-heading" className="collections-title">Used in collections</h3>
                {collections.length > 0 && (
                    <span className="collections-count">{collections.length}</span>
                )}
            </div>

            {collections.length === 0 ? (
                <div className="collections-empty">
                    <span className="collections-empty-icon">
                        <ContentGlyph name="collection" />
                    </span>
                    <div className="collections-empty-copy">
                        <strong>No collections yet</strong>
                        <p>Collections that include this mod will appear here.</p>
                    </div>
                </div>
            ) : (
                <div className="collections-scroll">
                    {collections.map((collection, index) => (
                        <div key={collection.id ?? collection.title ?? index} className="collection-card">
                            <div className="collection-img-placeholder">
                                {collection.image ? (
                                    <img src={collection.image} alt={collection.title} />
                                ) : (
                                    <ContentGlyph name="collection" />
                                )}
                            </div>
                            <span className="collection-name">{collection.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
