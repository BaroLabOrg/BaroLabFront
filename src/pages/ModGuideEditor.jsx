import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import guideInstructions from '../../GUIDE_INSTRUCTIONS.md?raw';
import { getModGuideById, createModGuide, updateModGuide } from '../api/modGuides';
import { getMod } from '../api/mods';
import GuideMarkdown from '../components/guides/GuideMarkdown';
import InternalLinkPicker from '../components/guides/InternalLinkPicker';
import { escapeMarkdownLinkLabel } from '../utils/internalGuideLinks';
import './ModGuideEditor.css';
import './ModGuidePage.css'; // Reuse markdown styles for preview

export default function ModGuideEditor() {
    const { id, guideId } = useParams();
    const navigate = useNavigate();

    const isEditMode = !!guideId;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [mod, setMod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);
    const [showLinkPicker, setShowLinkPicker] = useState(false);
    const textareaRef = useRef(null);
    const selectionRef = useRef({ start: 0, end: 0, text: '' });

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
                            setDescription(guideData.description);
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
            setError('Guide title must be at least 3 characters.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            if (isEditMode) {
                await updateModGuide(id, guideId, title, description);
            } else {
                await createModGuide(id, title, description);
            }
            navigate(`/mod/${id}`);
        } catch (err) {
            setError(err.message || 'Failed to save guide.');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenLinkPicker = () => {
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? description.length;
        const end = textarea?.selectionEnd ?? start;
        selectionRef.current = { start, end, text: description.slice(start, end) };
        setShowLinkPicker(true);
    };

    const handleInsertLink = ({ href, title: referenceTitle }) => {
        const { start, end, text } = selectionRef.current;
        const label = escapeMarkdownLinkLabel(text)
            || escapeMarkdownLinkLabel(referenceTitle)
            || 'BaroLab reference';
        const markdown = `[${label}](${href})`;
        setDescription((current) => `${current.slice(0, start)}${markdown}${current.slice(end)}`);
        setShowLinkPicker(false);
        window.requestAnimationFrame(() => {
            const cursor = start + markdown.length;
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(cursor, cursor);
        });
    };

    if (loading) return <div className="admin-editor-loading">Loading editor...</div>;
    if (!mod) return <div className="admin-editor-error">Mod not found.</div>;

    return (
        <div className="admin-guide-editor">
            {showInstructions && (
                <div className="instructions-modal-overlay" onClick={() => setShowInstructions(false)}>
                    <div className="instructions-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="instructions-modal-header">
                            <h3>How to write guides?</h3>
                            <button onClick={() => setShowInstructions(false)}>Close</button>
                        </div>
                        <div className="instructions-modal-body guide-markdown-body">
                            <GuideMarkdown>{guideInstructions}</GuideMarkdown>
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
                    <button className="btn-help" onClick={() => setShowInstructions(true)}>How to write guides?</button>
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
                <button type="button" className="btn-internal-link" onClick={handleOpenLinkPicker}>
                    + Add internal link
                </button>
            </div>

            <div className="editor-panes">
                {/* Left Pane: Raw Markdown Input */}
                <div className="editor-pane source-pane">
                    <div className="pane-header">Markdown Source</div>
                    <textarea
                        ref={textareaRef}
                        className="markdown-textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Write your guide here using Markdown..."
                    />
                </div>

                {/* Right Pane: Live Preview */}
                <div className="editor-pane preview-pane">
                    <div className="pane-header">Live Preview</div>
                    <div className="guide-markdown-body preview-content">
                        {/* We use the same classes as viewing so it looks identical */}
                        {title && <h1>{title}</h1>}
                        <GuideMarkdown>{description}</GuideMarkdown>
                    </div>
                </div>
            </div>
            <InternalLinkPicker
                open={showLinkPicker}
                onClose={() => setShowLinkPicker(false)}
                onSelect={handleInsertLink}
            />
        </div>
    );
}
