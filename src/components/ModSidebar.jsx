import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as tagsApi from '../api/tags';
import TagChips from './TagChips';
import './ModSidebar.css';

export default function ModSidebar({ mod, tags = [], onAddTag, onRemoveTag, isAuthenticated, isAdmin }) {
    const authorName = mod.author_username || 'Unknown';
    const [allTags, setAllTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            tagsApi.getTags().then(data => setAllTags(data || [])).catch(err => console.error("Failed to load tags:", err));
        }
    }, [isAuthenticated]);

    const handleAddClick = () => {
        if (selectedTag) {
            onAddTag(selectedTag);
            setSelectedTag('');
            setIsAddingTag(false);
        }
    };

    return (
        <aside className="mod-sidebar">
            <div className="mod-sidebar-card glass-card">
                <h4 className="mod-sidebar-heading">Теги</h4>
                <TagChips 
                    tags={tags} 
                    onRemove={isAdmin ? onRemoveTag : undefined} 
                    showRemoveButton={isAdmin} 
                />
                
                {isAuthenticated && (
                    <div className="mod-sidebar-add-tag">
                        {!isAddingTag ? (
                            <button 
                                className="btn btn-outline btn-sm mod-tag-add-btn" 
                                onClick={() => setIsAddingTag(true)}
                            >
                                + Добавить тег
                            </button>
                        ) : (
                            <div className="mod-sidebar-tag-select-container fade-in">
                                <select 
                                    className="input mod-tag-select" 
                                    value={selectedTag} 
                                    onChange={(e) => setSelectedTag(e.target.value)}
                                >
                                    <option value="" disabled>Выберите тег</option>
                                    {allTags.filter(t => !tags.some(ext => ext.id === t.id)).map(tag => (
                                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                                    ))}
                                </select>
                                <div className="mod-tag-actions">
                                    <button 
                                        className="btn btn-primary btn-sm" 
                                        onClick={handleAddClick}
                                        disabled={!selectedTag}
                                    >
                                        Добавить
                                    </button>
                                    <button 
                                        className="btn btn-ghost btn-sm" 
                                        onClick={() => {
                                            setIsAddingTag(false);
                                            setSelectedTag('');
                                        }}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {mod.required_mods && mod.required_mods.length > 0 && (
                <div className="mod-sidebar-card glass-card">
                    <h4 className="mod-sidebar-heading">Необходимые моды</h4>
                    <ul className="mod-deps-list">
                        {mod.required_mods.map((depId, i) => (
                            <li key={i} className="mod-dep-item">
                                <Link to={`/mod/${depId}`} className="mod-dep-name">
                                    Mod ID: {depId}
                                </Link>
                                <span className="mod-dep-badge required">required</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mod-sidebar-card glass-card">
                <h4 className="mod-sidebar-heading">Создатель</h4>
                <div className="mod-creator-card">
                    <div className="mod-creator-avatar">👤</div>
                    <div className="mod-creator-info">
                        <span className="mod-creator-name">{authorName}</span>
                        <span className="mod-creator-role">Автор</span>
                    </div>
                </div>
            </div>

            {mod.mods_above && mod.mods_above.length > 0 && (
                <div className="mod-sidebar-card glass-card">
                    <h4 className="mod-sidebar-heading">Загружать выше</h4>
                    <ul className="mod-deps-list">
                        {mod.mods_above.map((modId, i) => (
                            <li key={i} className="mod-dep-item" style={{ alignItems: 'center' }}>
                                <div
                                    className="mod-similar-avatar"
                                    style={{ width: '24px', height: '24px', flexShrink: 0, marginRight: '8px' }}
                                >
                                    🔧
                                </div>
                                <Link to={`/mod/${modId}`} className="mod-dep-name">
                                    Mod ID: {modId}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </aside>
    );
}

