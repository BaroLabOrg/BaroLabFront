import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';
import { convertLoadOrderToXml, LoadOrderConvertError } from '../api/loadOrder';
import PostCard from '../components/PostCard';
import './PostsPage.css';

const EXAMPLE_LOAD_ORDER_JSON = JSON.stringify(
    {
        name: 'My mod pack',
        mods: [
            {
                id: '2559634234',
                name: 'Lua For Barotrauma',
                category: 'lua',
                loadAfter: [],
                requires: [],
            },
        ],
    },
    null,
    2
);

function formatErrorBody(body) {
    if (body === null || body === undefined) {
        return 'null';
    }

    if (typeof body === 'string') {
        return body;
    }

    return JSON.stringify(body, null, 2);
}

export default function PostsPage() {
    const { isAuthenticated } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [creating, setCreating] = useState(false);

    const [loadOrderJson, setLoadOrderJson] = useState(EXAMPLE_LOAD_ORDER_JSON);
    const [xmlOutput, setXmlOutput] = useState('');
    const [convertError, setConvertError] = useState(null);
    const [isConverting, setIsConverting] = useState(false);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await api.getPosts();
            setPosts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const newPost = await api.createPost(title, content);
            setPosts([newPost, ...posts]);
            setTitle('');
            setContent('');
            setShowForm(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleConvert = async () => {
        setXmlOutput('');
        setConvertError(null);

        let requestPayload;
        try {
            requestPayload = JSON.parse(loadOrderJson);
        } catch (parseError) {
            setConvertError({
                status: 'CLIENT_PARSE_ERROR',
                body: {
                    code: 'INVALID_JSON',
                    message: 'JSON parsing failed. Request was not sent.',
                    details: [
                        {
                            code: 'INVALID_JSON',
                            message:
                                parseError instanceof Error
                                    ? parseError.message
                                    : 'Unknown JSON parse error',
                        },
                    ],
                },
            });
            return;
        }

        setIsConverting(true);
        try {
            const xml = await convertLoadOrderToXml(requestPayload);
            setXmlOutput(xml);
        } catch (requestError) {
            if (requestError instanceof LoadOrderConvertError) {
                setConvertError({
                    status: requestError.status,
                    body: requestError.body,
                });
            } else {
                setConvertError({
                    status: 'NETWORK_ERROR',
                    body: {
                        code: 'REQUEST_FAILED',
                        message:
                            requestError instanceof Error
                                ? requestError.message
                                : 'Unknown request error',
                    },
                });
            }
        } finally {
            setIsConverting(false);
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Загрузка постов...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <section className="load-order-converter glass-card fade-in">
                    <h2 className="converter-title">Load-order Converter (JSON -&gt; XML)</h2>
                    <p className="converter-subtitle">
                        Test UI for public endpoint <code>/api/load-order/convert</code>
                    </p>

                    <div className="form-group">
                        <label className="form-label" htmlFor="load-order-json-input">
                            Request JSON
                        </label>
                        <textarea
                            id="load-order-json-input"
                            className="converter-json-input"
                            value={loadOrderJson}
                            onChange={(e) => setLoadOrderJson(e.target.value)}
                            spellCheck={false}
                        />
                    </div>

                    <button
                        id="convert-load-order"
                        type="button"
                        className="btn btn-primary converter-submit-btn"
                        onClick={handleConvert}
                        disabled={isConverting}
                    >
                        {isConverting ? 'Converting...' : 'Convert to XML'}
                    </button>

                    {isConverting && (
                        <div className="converter-loading" role="status" aria-live="polite">
                            <div className="loading-spinner converter-spinner" />
                            <span>Sending request...</span>
                        </div>
                    )}

                    <div className="converter-results">
                        <section className="converter-result-panel">
                            <h3>XML Output</h3>
                            <pre className={`converter-output ${xmlOutput ? '' : 'empty'}`}>
                                {xmlOutput || 'XML response will appear here.'}
                            </pre>
                        </section>

                        <section className="converter-result-panel converter-error-panel">
                            <h3>Error Output</h3>
                            {convertError ? (
                                <>
                                    <div className="converter-error-status">
                                        Status:{' '}
                                        {typeof convertError.status === 'number'
                                            ? `HTTP ${convertError.status}`
                                            : convertError.status}
                                    </div>
                                    <pre className="converter-output">{formatErrorBody(convertError.body)}</pre>
                                </>
                            ) : (
                                <pre className="converter-output empty">No errors.</pre>
                            )}
                        </section>
                    </div>
                </section>

                <div className="posts-header-box glass-card shine">
                    <h1 className="posts-title">📝 Лента Постов</h1>
                    <p className="posts-subtitle">Все публикации сообщества</p>
                    {isAuthenticated && (
                        <div className="posts-actions" style={{ marginTop: '1.5rem' }}>
                            <button
                                id="create-post-toggle"
                                className="btn btn-primary"
                                onClick={() => setShowForm(!showForm)}
                            >
                                {showForm ? '✕ Закрыть' : '📝 Новый пост'}
                            </button>
                        </div>
                    )}
                </div>

                {isAuthenticated && showForm && (
                    <form className="create-post-form glass-card fade-in" onSubmit={handleCreatePost}>
                        <h3 className="form-title">Создать пост</h3>
                        <div className="form-group">
                            <label className="form-label">Заголовок</label>
                            <input
                                id="post-title-input"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Введите заголовок"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Содержание</label>
                            <textarea
                                id="post-content-input"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Напишите что-нибудь интересное..."
                                required
                                rows="4"
                            />
                        </div>
                        <button
                            id="submit-post"
                            type="submit"
                            className="btn btn-primary"
                            disabled={creating}
                        >
                            {creating ? 'Публикация...' : 'Опубликовать'}
                        </button>
                    </form>
                )}

                {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

                {posts.length === 0 ? (
                    <div className="empty-state fade-in">
                        <span className="empty-icon">📝</span>
                        <p>Постов пока нет. Будьте первым!</p>
                    </div>
                ) : (
                    <div className="posts-grid">
                        {posts.map((post, i) => (
                            <PostCard key={post.id} post={post} style={{ animationDelay: `${i * 0.05}s` }} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
