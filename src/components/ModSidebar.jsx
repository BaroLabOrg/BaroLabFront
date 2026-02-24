import { Link } from 'react-router-dom';
import TagChips from './TagChips';
import './ModSidebar.css';

// Mock data — will be replaced by real API data
const MOCK_TAGS = ['Server Booster', 'Writer', 'Color|Issue', 'she/her', 'Gameplay'];
const MOCK_DEPENDENCIES = [
    { name: 'Lua For Barotrauma', required: true },
    { name: 'BaroLib', required: true },
    { name: 'EK Utils', required: false },
];
const MOCK_SIMILAR = [
    { external_id: '1111111111', title: 'HD Textures Pack', tag: 'safe' },
    { external_id: '2222222222', title: 'Realistic Lighting', tag: 'safe' },
    { external_id: '3333333333', title: 'New Creatures Mod', tag: 'nsfw' },
];

export default function ModSidebar({ mod }) {
    const authorName = mod.author_username || 'Unknown';

    return (
        <aside className="mod-sidebar">
            {/* Tags */}
            <div className="mod-sidebar-card glass-card">
                <h4 className="mod-sidebar-heading">ТЕГИ</h4>
                <TagChips tags={MOCK_TAGS} />
            </div>

            {/* Dependencies */}
            <div className="mod-sidebar-card glass-card">
                <h4 className="mod-sidebar-heading">НЕОБХОДИМЫЕ ПРОДУКТЫ</h4>
                <ul className="mod-deps-list">
                    {MOCK_DEPENDENCIES.map((dep, i) => (
                        <li key={i} className="mod-dep-item">
                            <span className="mod-dep-name">{dep.name}</span>
                            <span className={`mod-dep-badge ${dep.required ? 'required' : 'optional'}`}>
                                {dep.required ? '✔ required' : 'optional'}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Creators */}
            <div className="mod-sidebar-card glass-card">
                <h4 className="mod-sidebar-heading">СОЗДАТЕЛИ</h4>
                <div className="mod-creator-card">
                    <div className="mod-creator-avatar">👤</div>
                    <div className="mod-creator-info">
                        <span className="mod-creator-name">{authorName}</span>
                        <span className="mod-creator-role">Автор</span>
                    </div>
                </div>
            </div>

            {/* Similar mods */}
            <div className="mod-sidebar-card glass-card">
                <h4 className="mod-sidebar-heading">ПОХОЖИЕ</h4>
                <div className="mod-similar-list">
                    {MOCK_SIMILAR.map((sim, i) => (
                        <Link
                            key={i}
                            to={`/mod/${sim.external_id}`}
                            className="mod-similar-item"
                        >
                            <div className="mod-similar-avatar">🔧</div>
                            <div className="mod-similar-info">
                                <span className="mod-similar-name">{sim.title}</span>
                                <span className={`mod-similar-tag ${sim.tag}`}>{sim.tag}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    );
}
