import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import guideInstructions from '../../GUIDE_INSTRUCTIONS.md?raw';
import { getModGuideById, createModGuide, updateModGuide } from '../api/modGuides';
import { getMod } from '../api/mods';
import './ModGuideEditor.css';
import './ModGuidePage.css'; // Reuse markdown styles for preview

export default function ModGuideEditor() {
    const { id, guideId } = useParams();
    const navigate = useNavigate();

    const isEditMode = !!guideId;

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mod, setMod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch Mod context
                const modData = await getMod(id);
                setMod(modData);

                // Fetch existing Guide if any
                if (isEditMode) {
                    try {
                        const guideData = await getModGuideById(id, guideId);
                        if (guideData) {
                            setTitle(guideData.title);
                            setContent(guideData.content);
                        }
                    } catch (guideErr) {
                        // Ignore 404s (guide doesn't exist yet)
                        if (!guideErr.message.includes('404') && !guideErr.message.toLowerCase().includes('not found')) {
                            console.error('Error fetching guide:', guideErr);
                        }
                    }
                }
            } catch (err) {
                setError('Failed to load mod data or guide.');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, guideId, isEditMode]);

    const handleSave = async () => {
        if (!title || title.trim().length < 3) {
            setError('Название руководства должно содержать минимум 3 символа.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            if (isEditMode) {
                await updateModGuide(id, guideId, title, content);
            } else {
                await createModGuide(id, title, content);
            }
            navigate(`/mod/${id}`);
        } catch (err) {
            setError(err.message || 'Failed to save guide.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="admin-editor-loading">Loading editor...</div>;
    if (!mod) return <div className="admin-editor-error">Mod not found.</div>;

    return (
        <div className="admin-guide-editor">
            {showInstructions && (
                <div className="instructions-modal-overlay" onClick={() => setShowInstructions(false)}>
                    <div className="instructions-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="instructions-modal-header">
                            <h3>Как писать руководства?</h3>
                            <button onClick={() => setShowInstructions(false)}>Закрыть</button>
                        </div>
                        <div className="instructions-modal-body guide-markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {guideInstructions}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}
            <div className="editor-header">
                <div className="editor-header-left">
                    <h2>{isEditMode ? 'Editing Guide for:' : 'Creating Guide for:'} {mod.title}</h2>
                    {error && <div className="editor-error-msg">{error}</div>}
                </div>
                <div className="editor-header-right">
                    <button className="btn-help" onClick={() => setShowInstructions(true)}>Как писать руководства?</button>
                    <button className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Guide'}
                    </button>
                </div>
            </div>

            <div className="editor-toolbar">
                <input
                    type="text"
                    className="guide-title-input"
                    placeholder="Guide Title (e.g., Ultimate SOMA Scavenger Guide)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            <div className="editor-panes">
                {/* Left Pane: Raw Markdown Input */}
                <div className="editor-pane source-pane">
                    <div className="pane-header">Markdown Source</div>
                    <textarea
                        className="markdown-textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your guide here using Markdown..."
                    />
                </div>

                {/* Right Pane: Live Preview */}
                <div className="editor-pane preview-pane">
                    <div className="pane-header">Live Preview</div>
                    <div className="guide-markdown-body preview-content">
                        {/* We use the same classes as viewing so it looks identical */}
                        {title && <h1>{title}</h1>}
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
}
