import { Link } from 'react-router-dom';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './GuideFlow.css';

const TARGETS = [
    {
        type: 'MOD',
        icon: '🔧',
        title: 'Mod',
        description: 'Use the complete mods catalog, including its search, tags and pagination.',
        to: '/mods?guideTarget=1',
    },
    {
        type: 'SUBMARINE',
        icon: '🚢',
        title: 'Submarine',
        description: 'Find a submarine with the existing advanced filters and pagination.',
        to: '/submarines?guideTarget=1',
    },
    {
        type: 'ENCYCLOPEDIA',
        icon: '📖',
        title: 'Encyclopedia subject',
        description: 'Choose a published encyclopedia subject without changing its article.',
        to: '/encyclopedia?guideTarget=1',
    },
];

export default function GuideCreatePage() {
    useDocumentMeta({
        title: 'Create guide — BaroLab',
        description: 'Choose what your BaroLab guide is about.',
    });

    return (
        <div className="page">
            <main className="container guide-flow-page">
                <header className="guide-flow-header glass-card">
                    <span className="guide-flow-step">Step 1 of 2</span>
                    <h1>What is your guide about?</h1>
                    <p>Choose a content type first. Search and filters will appear on the next screen.</p>
                </header>
                <section className="guide-target-type-grid" aria-label="Guide subject type">
                    {TARGETS.map((target) => (
                        <Link key={target.type} to={target.to} className="guide-target-type-card glass-card">
                            <span className="guide-target-type-icon" aria-hidden="true">{target.icon}</span>
                            <strong>{target.title}</strong>
                            <span>{target.description}</span>
                            <em>Choose {target.title.toLowerCase()} →</em>
                        </Link>
                    ))}
                </section>
                <Link to="/guides" className="btn btn-ghost">← Back to guides</Link>
            </main>
        </div>
    );
}
