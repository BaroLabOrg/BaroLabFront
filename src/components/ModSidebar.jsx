import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as tagsApi from '../api/tags';
import TagChips from './TagChips';
import './ModSidebar.css';

export default function ModSidebar({ mod, tags = [], onAddTag, onRemoveTag, isAuthenticated, isAdmin }) {
    const authorName = mod.author_username || mod.authorUsername || 'Unknown';
    const authorSteamId = mod.author_steam_id || mod.authorSteamId || null;
    const steamProfileUrl = authorSteamId ? `https://steamcommunity.com/profiles/${authorSteamId}` : null;
    const [allTags, setAllTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            tagsApi
                .getTags({ page: 0, size: 100, sortBy: 'name', direction: 'asc' })
                .then((data) => setAllTags(Array.isArray(data.items) ? data.items : []))
                .catch((err) => console.error('Failed to load tags:', err));
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
                <h4 className="mod-sidebar-heading">Tags</h4>
                <TagChips 
                    tags={tags} 
                    onRemove={isAdmin ? onRemoveTag : undefined} 
                    showRemoveButton={isAdmin} 
                />
                
                {isAuthenticated && (
                    <div className="mod-sidebar-add-tag">
                        {!isAddingTag ? (
                            <button 
                                className="btn btn-secondary btn-sm mod-tag-add-btn" 
                                onClick={() => setIsAddingTag(true)}
                            >
                                + Add tag
                            </button>
                        ) : (
                            <div className="mod-sidebar-tag-select-container fade-in">
                                <select 
                                    className="input mod-tag-select" 
                                    value={selectedTag} 
                                    onChange={(e) => setSelectedTag(e.target.value)}
                                >
                                    <option value="" disabled>Select tag</option>
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
                                        Add
                                    </button>
                                    <button 
                                        className="btn btn-ghost btn-sm" 
                                        onClick={() => {
                                            setIsAddingTag(false);
                                            setSelectedTag('');
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {mod.required_mods && mod.required_mods.length > 0 && (
                <div className="mod-sidebar-card glass-card">
                    <h4 className="mod-sidebar-heading">Required mods</h4>
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
                <h4 className="mod-sidebar-heading">Author</h4>
                <div className="mod-creator-card">
                    <div className="mod-creator-avatar">👤</div>
                    <div className="mod-creator-info">
                        {steamProfileUrl ? (
                            <a
                                className="mod-creator-name mod-creator-link"
                                href={steamProfileUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {authorName}
                            </a>
                        ) : (
                            <span className="mod-creator-name">{authorName}</span>
                        )}
                        <span className="mod-creator-role">{authorSteamId ? 'Steam Workshop author' : 'BaroLab author'}</span>
                    </div>
                </div>
            </div>

            {mod.mods_above && mod.mods_above.length > 0 && (
                <div className="mod-sidebar-card glass-card">
                    <h4 className="mod-sidebar-heading">Load above</h4>
                    <ul className="mod-deps-list">
                        {mod.mods_above.map((modId, i) => (
                            <li key={i} className="mod-dep-item">
                                <div className="mod-similar-avatar">
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

