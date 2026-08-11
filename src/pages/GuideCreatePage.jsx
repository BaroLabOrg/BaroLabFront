import { Link } from 'react-router-dom';
import useDocumentMeta from '../hooks/useDocumentMeta';
import './GuideFlow.css';

const TARGETS = [
    {
        type: 'MOD',
        title: 'Mod',
        description: 'Browse the mod catalog with its existing search, tags and pagination.',
        to: '/mods?guideTarget=1',
    },
    {
        type: 'SUBMARINE',
        title: 'Submarine',
        description: 'Find the exact vessel through class, tier and advanced filters.',
        to: '/submarines?guideTarget=1',
    },
    {
        type: 'ENCYCLOPEDIA',
        title: 'Encyclopedia subject',
        description: 'Attach your guide to a published Barotrauma encyclopedia entry.',
        to: '/encyclopedia?guideTarget=1',
    },
];

function TargetIcon({ type }) {
    if (type === 'MOD') {
        return (
            <svg viewBox="0 0 48 48" aria-hidden="true">
                <path d="m29 8 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z" />
                <path d="M20 27 9 38m2-8 7 7" />
            </svg>
        );
    }
    if (type === 'SUBMARINE') {
        return (
            <svg viewBox="0 0 48 48" aria-hidden="true">
                <path d="M7 27c5-6 12-9 22-9 7 0 11 3 14 9-4 6-9 9-16 9-9 0-15-3-20-9Z" />
                <path d="M21 18v-5h9l4 6M13 27h22M27 22v10" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M7 10h13a4 4 0 0 1 4 4v25a6 6 0 0 0-6-6H7V10Zm34 0H28a4 4 0 0 0-4 4v25a6 6 0 0 1 6-6h11V10Z" />
            <path d="M12 17h7M12 23h7M29 17h7M29 23h7" />
        </svg>
    );
}

export default function GuideCreatePage() {
    useDocumentMeta({
        title: 'Create guide — BaroLab',
        description: 'Choose what your BaroLab guide is about.',
    });

    return (
        <div className="page page--guide-flow">
            <main className="container guide-flow-page">
                <nav className="guide-flow-progress" aria-label="Guide creation progress">
                    <span className="is-current">Choose subject</span>
                    <span aria-hidden="true">→</span>
                    <span>Write guide</span>
                </nav>

                <div className="guide-flow-layout">
                    <header className="guide-flow-header">
                        <h1>What is your guide about?</h1>
                        <p>Select the source material first. We will open the relevant catalog so you can attach the guide to the exact subject.</p>
                        <Link to="/guides" className="guide-flow-back">← Back to guides</Link>
                    </header>

                    <section className="guide-target-list" aria-label="Guide subject type">
                        {TARGETS.map((target) => (
                            <Link key={target.type} to={target.to} className="guide-target-row">
                                <span className="guide-target-icon"><TargetIcon type={target.type} /></span>
                                <span className="guide-target-copy">
                                    <strong>{target.title}</strong>
                                    <span>{target.description}</span>
                                </span>
                                <span className="guide-target-action">Choose <span aria-hidden="true">→</span></span>
                            </Link>
                        ))}
                    </section>
                </div>
            </main>
        </div>
    );
}
