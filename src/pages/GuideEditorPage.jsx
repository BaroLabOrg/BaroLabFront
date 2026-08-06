import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import guideInstructions from '../../GUIDE_INSTRUCTIONS.md?raw';
import { createGuide, getGuideById, updateGuide } from '../api/modGuides';
import { getMod } from '../api/mods';
import { getSubmarine } from '../api/submarines';
import { getEncyclopediaDetail } from '../api/encyclopedia';
import GuideMarkdown from '../components/guides/GuideMarkdown';
import InternalLinkPicker from '../components/guides/InternalLinkPicker';
import { escapeMarkdownLinkLabel } from '../utils/internalGuideLinks';
import './ModGuideEditor.css';
import './ModGuidePage.css';

const TARGET_TYPES = new Set(['MOD', 'SUBMARINE', 'ENCYCLOPEDIA']);

function guideValue(guide, camel, snake) {
    return guide?.[camel] ?? guide?.[snake];
}

async function loadTarget(type, id) {
    if (type === 'MOD') {
        const mod = await getMod(id);
        return { type, id, title: mod.title, imageUrl: mod.main_image || mod.mainImage, href: `/mod/${id}` };
    }
    if (type === 'SUBMARINE') {
        const submarine = await getSubmarine(id);
        return {
            type,
            id,
            title: submarine.title,
            imageUrl: submarine.main_image || submarine.mainImage,
            href: `/submarines/${id}`,
        };
    }
    const article = await getEncyclopediaDetail(id);
    return {
        type,
        id,
        title: article.title,
        imageUrl: article.primaryImage?.publicUrl
            || article.primary_image?.public_url
            || article.primaryImageUrl
            || article.primary_image_url,
        href: `/encyclopedia/${id}`,
    };
}

export default function GuideEditorPage() {
    const { guideId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(guideId);
    const requestedType = String(searchParams.get('targetType') || '').toUpperCase();
    const requestedId = searchParams.get('targetId') || '';

    const [target, setTarget] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);
    const [showLinkPicker, setShowLinkPicker] = useState(false);
    const textareaRef = useRef(null);
    const selectionRef = useRef({ start: 0, end: 0, text: '' });

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError('');
            try {
                if (isEditMode) {
                    const guide = await getGuideById(guideId);
                    const type = guideValue(guide, 'targetType', 'target_type');
                    const id = guideValue(guide, 'targetId', 'target_id');
                    const loadedTarget = await loadTarget(type, id);
                    if (!cancelled) {
                        setTitle(guide.title || '');
                        setDescription(guide.description || '');
                        setTarget(loadedTarget);
                    }
                } else {
                    if (!TARGET_TYPES.has(requestedType) || !requestedId) {
                        navigate('/guides/new', { replace: true });
                        return;
                    }
                    const loadedTarget = await loadTarget(requestedType, requestedId);
                    if (!cancelled) setTarget(loadedTarget);
                }
            } catch (err) {
                if (!cancelled) setError(err?.message || 'Failed to load guide subject.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [guideId, isEditMode, navigate, requestedId, requestedType]);

    const handleSave = async () => {
        if (!title.trim() || title.trim().length < 3) {
            setError('Guide title must be at least 3 characters.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const saved = isEditMode
                ? await updateGuide(guideId, title, description)
                : await createGuide({ targetType: target.type, targetId: target.id, title, description });
            navigate(`/guides/${saved.id || guideId}`);
        } catch (err) {
            setError(err?.message || 'Failed to save guide.');
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
        const label = escapeMarkdownLinkLabel(text) || escapeMarkdownLinkLabel(referenceTitle) || 'BaroLab reference';
        const markdown = `[${label}](${href})`;
        setDescription((current) => `${current.slice(0, start)}${markdown}${current.slice(end)}`);
        setShowLinkPicker(false);
        window.requestAnimationFrame(() => {
            const cursor = start + markdown.length;
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(cursor, cursor);
        });
    };

    if (loading) return <div className="admin-editor-loading">Loading guide subject...</div>;
    if (!target) return <div className="admin-editor-error">{error || 'Guide subject not found.'}</div>;

    return (
        <div className="admin-guide-editor">
            {showInstructions && (
                <div className="instructions-modal-overlay" onClick={() => setShowInstructions(false)}>
                    <div className="instructions-modal-content" onClick={(event) => event.stopPropagation()}>
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
                    <div className="guide-editor-target">
                        {target.imageUrl && <img src={target.imageUrl} alt="" referrerPolicy="no-referrer" />}
                        <div>
                            <span>{isEditMode ? 'Editing guide for' : 'Creating guide for'} {target.type.toLowerCase()}</span>
                            <h2>{target.title}</h2>
                        </div>
                    </div>
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
                    placeholder="Guide title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                />
                <button type="button" className="btn-internal-link" onClick={handleOpenLinkPicker}>
                    + Add internal link
                </button>
            </div>
            <div className="editor-panes">
                <div className="editor-pane source-pane">
                    <div className="pane-header">Markdown Source</div>
                    <textarea
                        ref={textareaRef}
                        className="markdown-textarea"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Write your guide here using Markdown..."
                    />
                </div>
                <div className="editor-pane preview-pane">
                    <div className="pane-header">Live Preview</div>
                    <div className="guide-markdown-body preview-content">
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
