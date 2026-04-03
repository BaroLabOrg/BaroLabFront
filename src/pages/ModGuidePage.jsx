import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import { getModGuideById } from '../api/modGuides';
import { getMod } from '../api/mods';
import './ModGuidePage.css';

// --- Custom Markdown Components ---

// Map blockquotes to our custom Quote component
const CustomQuote = ({ children }) => {
    // Basic extraction of author if text is in format: "Quote" - Author
    let text = '';
    let author = 'Unknown';

    // Simplistic parsing for demo purposes
    React.Children.forEach(children, child => {
        if (child.props && child.props.children) {
            const content = child.props.children;
            if (typeof content === 'string') {
                const parts = content.split(' — ');
                if (parts.length > 1) {
                    text = parts[0];
                    author = parts[1];
                } else {
                    text = content;
                }
            } else if (Array.isArray(content)) {
                const textPart = content.find(c => typeof c === 'string');
                if (textPart) {
                    const parts = textPart.split(' — ');
                    if (parts.length > 1) {
                        text = parts[0];
                        author = parts[1];
                    } else {
                        text = content;
                    }
                }
            }
        }
    });

    // If parsing failed, just render children
    if (!text && React.Children.count(children) > 0) {
        return <blockquote className="guide-quote">{children}</blockquote>;
    }

    return (
        <blockquote className="guide-quote">
            <p className="quote-text">"{text}"</p>
            {author && <footer className="quote-author">— {author}</footer>}
        </blockquote>
    );
};

// Custom Table to look like Infobox if it has a specific header
const CustomTable = ({ children, ...props }) => {
    // Check if the table header contains "Infobox"
    let isInfobox = false;

    try {
        const thead = children.find(child => child.type === 'thead');
        if (thead) {
            const tr = thead.props.children;
            const th = tr.props.children[0];
            if (th && typeof th.props.children === 'string' && th.props.children.includes('INFOBOX:')) {
                isInfobox = true;
            }
        }
    } catch (e) {
        // Ignore parsing errors
    }

    if (isInfobox) {
        return <table className="guide-infobox" {...props}>{children}</table>;
    }

    return <table className="guide-table" {...props}>{children}</table>;
};


export default function ModGuidePage() {
    const { id, guideId } = useParams();
    const { user } = useAuth();
    const [guide, setGuide] = useState(null);
    const [mod, setMod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                // Fetch Mod info for header/context
                const modData = await getMod(id);
                setMod(modData);

                // Fetch Guide content
                const guideData = await getModGuideById(id, guideId);
                setGuide(guideData);
            } catch (err) {
                // Ignore 404s for guides (just means it doesn't exist yet)
                if (!err.message.includes('404') && !err.message.toLowerCase().includes('not found')) {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, guideId]);

    if (loading) return <div className="guide-loading">Loading guide...</div>;

    // Error is only for severe errors, not for "guide not found"
    if (error) return <div className="guide-error">Error: {error}</div>;

    if (!mod) return <div className="guide-error">Mod not found.</div>;

    if (!guide) {
        return (
            <div className="guide-container">
                <h1>Guide for {mod.title}</h1>
                <p>No guide exists for this mod yet.</p>
                {user && (
                    <Link to={`/mod/${id}/guides/new`} className="guide-create-btn">
                        Create guide
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="guide-container">
            <header className="guide-header">
                <Link to={`/mod/${id}`} className="guide-back-link">← Back to mod</Link>
                <h1>{guide.title}</h1>
                <div className="guide-meta">
                    <span>For Mod: <Link to={`/mod/${id}`} >{mod.title}</Link></span>
                    {guide.author && <span> • Last updated by {guide.author.username}</span>}
                </div>
            </header>

            <div className="guide-content-wrapper">
                <div className="guide-markdown-body">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            blockquote: CustomQuote,
                            table: CustomTable
                        }}
                    >
                        {guide.description}
                    </ReactMarkdown>
                </div>
            </div>

            <div className="guide-admin-actions">
                {(user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.id === guide.author?.id)) && (
                    <Link to={`/mod/${id}/guides/${guideId}/edit`} className="guide-edit-btn">
                        Edit
                    </Link>
                )}
            </div>
        </div>
    );
}
