import './GuidesSection.css';

const MOCK_GUIDES = [
    // TODO: replace with real data when guides endpoint is available
];

export default function GuidesSection({ guides = MOCK_GUIDES }) {
    return (
        <section className="guides-section glass-card">
            <div className="guides-header">
                <span className="guides-accent-bar" />
                <h3 className="guides-title">К этому моду существуют такие руководства</h3>
            </div>

            {guides.length === 0 ? (
                <div className="guides-empty">
                    <span className="guides-empty-icon">📖</span>
                    <p>Пока нет данных</p>
                </div>
            ) : (
                <ul className="guides-list">
                    {guides.map((guide, i) => (
                        <li key={i} className="guide-item">
                            <span className="guide-icon">📄</span>
                            <div className="guide-info">
                                <span className="guide-name">{guide.title}</span>
                                <span className="guide-meta">
                                    {guide.author} · {guide.date}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
