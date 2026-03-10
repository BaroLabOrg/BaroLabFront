import { Link } from 'react-router-dom';
import TagChips from './TagChips';
import './ModSidebar.css';

// Only using MOCK_TAGS untill tags feature is fully implemented
const MOCK_TAGS = ['Server Booster', 'Writer', 'Color|Issue', 'she/her', 'Gameplay'];

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
            {mod.required_mods && mod.required_mods.length > 0 && (
                <div className="mod-sidebar-card glass-card">
                    <h4 className="mod-sidebar-heading">НЕОБХОДИМЫЕ ПРОДУКТЫ</h4>
                    <ul className="mod-deps-list">
                        {mod.required_mods.map((depId, i) => (
                            <li key={i} className="mod-dep-item">
                                <Link to={`/mod/${depId}`} className="mod-dep-name">Mod ID: {depId}</Link>
                                <span className={`mod-dep-badge required`}>
                                    ✔ required
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

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

            {/* Mods Above */}
            {mod.mods_above && mod.mods_above.length > 0 && (
                <div className="mod-sidebar-card glass-card">
                    <h4 className="mod-sidebar-heading">МОДЫ ДОЛЖНЫ БЫТЬ ВЫШЕ</h4>
                    <ul className="mod-deps-list">
                        {mod.mods_above.map((modId, i) => (
                            <li key={i} className="mod-dep-item" style={{ alignItems: 'center' }}>
                                <div className="mod-similar-avatar" style={{ width: '24px', height: '24px', flexShrink: 0, marginRight: '8px' }}>🔧</div>
                                <Link to={`/mod/${modId}`} className="mod-dep-name">Mod ID: {modId}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </aside>
    );
}
