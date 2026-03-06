import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';
import * as guideApi from '../api/modGuides';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import './AdminPage.css';

const ROLES = ['USER', 'SUPERUSER', 'ADMIN', 'SUPER_ADMIN'];

export default function AdminPage() {
    const { isSuperAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'users' : 'posts');

    return (
        <div className="page">
            <div className="container">
                <div className="admin-header">
                    <h1 className="page-title">⚙ Панель администратора</h1>
                    <p className="page-subtitle">Управление пользователями, постами, модами и их руководствами</p>
                </div>

                <div className="admin-tabs">
                    {isSuperAdmin && (
                        <button
                            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            👥 Пользователи
                        </button>
                    )}
                    <button
                        className={`admin-tab ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        📝 Посты
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'mods' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mods')}
                    >
                        🎮 Моды
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'guides' ? 'active' : ''}`}
                        onClick={() => setActiveTab('guides')}
                    >
                        📚 Руководства
                    </button>
                </div>

                <div className="admin-content fade-in">
                    {activeTab === 'users' && isSuperAdmin && <UsersTab />}
                    {activeTab === 'posts' && <PostsTab />}
                    {activeTab === 'mods' && <ModsTab />}
                    {activeTab === 'guides' && <GuidesTab />}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*                USERS TAB                   */
/* ═══════════════════════════════════════════ */
function UsersTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (userId) => {
        setActionLoading(userId);
        try {
            const updated = await api.activateUser(userId);
            setUsers(users.map((u) => (u.id === userId ? updated : u)));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBlock = async (userId) => {
        setActionLoading(userId);
        try {
            const updated = await api.blockUser(userId);
            setUsers(users.map((u) => (u.id === userId ? updated : u)));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = async (userId, role) => {
        setActionLoading(userId);
        try {
            const updated = await api.updateUserRole(userId, role);
            setUsers(users.map((u) => (u.id === userId ? updated : u)));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="admin-tab-content">
            {error && <div className="auth-error">{error}</div>}
            <div className="admin-stat">Всего пользователей: <strong>{users.length}</strong></div>
            <div className="admin-list">
                {users.map((user) => (
                    <div key={user.id} className="admin-item glass-card">
                        <div className="admin-item-info">
                            <div className="admin-item-main">
                                <span className="admin-item-name">{user.login}</span>
                                <span className="admin-item-email">{user.email}</span>
                            </div>
                            <div className="admin-item-badges">
                                <StatusBadge status={user.status} />
                                <span className="role-badge">{user.role}</span>
                            </div>
                        </div>
                        <div className="admin-item-actions">
                            <select
                                className="role-select"
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                disabled={actionLoading === user.id}
                            >
                                {ROLES.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            {user.status === 'BLOCKED' ? (
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleActivate(user.id)}
                                    disabled={actionLoading === user.id}
                                >
                                    Активировать
                                </button>
                            ) : (
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleBlock(user.id)}
                                    disabled={actionLoading === user.id}
                                >
                                    Заблокировать
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*                POSTS TAB                   */
/* ═══════════════════════════════════════════ */
function PostsTab() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const [selectedId, setSelectedId] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [commentActionLoading, setCommentActionLoading] = useState(null);

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

    const handleActivate = async (postId) => {
        setActionLoading(postId);
        try {
            const updated = await api.activatePost(postId);
            setPosts(posts.map((p) => (p.id === postId ? updated : p)));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBlock = async (postId) => {
        setActionLoading(postId);
        try {
            const updated = await api.blockPost(postId);
            setPosts(posts.map((p) => (p.id === postId ? updated : p)));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleComments = async (postId) => {
        if (selectedId === postId && commentsOpen) {
            setCommentsOpen(false);
            setSelectedId(null);
            setComments([]);
            return;
        }

        setSelectedId(postId);
        setCommentsOpen(true);
        setCommentsLoading(true);
        setComments([]);
        setError('');

        try {
            const data = await api.getComments(postId);
            const sortedData = data.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
            setComments(sortedData);
        } catch (err) {
            setError(err.message);
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleCommentActivate = async (commentId) => {
        setCommentActionLoading(commentId);
        try {
            const updated = await api.activateComment(selectedId, commentId);
            setComments(comments.map((c) => (c.id === commentId ? updated : c)));
        } catch (err) {
            setError(err.message);
        } finally {
            setCommentActionLoading(null);
        }
    };

    const handleCommentBlock = async (commentId) => {
        setCommentActionLoading(commentId);
        try {
            const updated = await api.blockComment(selectedId, commentId);
            setComments(comments.map((c) => (c.id === commentId ? updated : c)));
        } catch (err) {
            setError(err.message);
        } finally {
            setCommentActionLoading(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="admin-tab-content">
            {error && <div className="auth-error">{error}</div>}
            <div className="admin-stat">Всего постов: <strong>{posts.length}</strong></div>
            <div className="admin-list">
                {posts.map((post) => {
                    const isOpen = selectedId === post.id && commentsOpen;
                    return (
                        <div key={post.id} className="admin-item-group">
                            <div className={`admin-item glass-card ${isOpen ? 'expanded' : ''}`}>
                                <div className="admin-item-info">
                                    <div className="admin-item-main">
                                        <span className="admin-item-name">{post.title}</span>
                                        <span className="admin-item-sub">
                                            {post.content?.slice(0, 80)}{post.content?.length > 80 ? '...' : ''}
                                        </span>
                                        <span className="admin-item-date">
                                            🕒 {formatDate(post.createdAt || post.created_at)}
                                            {(post.updatedAt || post.updated_at) && (post.updatedAt || post.updated_at) !== (post.createdAt || post.created_at) ?
                                                ` (обн. ${formatDate(post.updatedAt || post.updated_at)})` : ''}
                                        </span>
                                    </div>
                                    <div className="admin-item-badges">
                                        <StatusBadge status={post.status} />
                                        <span className="post-rating-badge">{post.rating}</span>
                                    </div>
                                </div>
                                <div className="admin-item-actions">
                                    {post.status === 'BLOCKED' ? (
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleActivate(post.id)}
                                            disabled={actionLoading === post.id}
                                        >
                                            Активировать
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleBlock(post.id)}
                                            disabled={actionLoading === post.id}
                                        >
                                            Заблокировать
                                        </button>
                                    )}
                                    <button
                                        className={`btn btn-outline btn-sm ${isOpen ? 'active' : ''}`}
                                        onClick={() => toggleComments(post.id)}
                                    >
                                        {isOpen ? '▲ Скрыть комм.' : '▼ Комментарии'}
                                    </button>
                                </div>
                            </div>

                            {isOpen && (
                                <div className="comments-ladder">
                                    {commentsLoading && <LoadingSpinner />}
                                    {!commentsLoading && comments.length === 0 && (
                                        <p className="no-comments">Нет комментариев</p>
                                    )}
                                    {!commentsLoading && comments.map((c) => (
                                        <div key={c.id} className="admin-comment-item glass-card">
                                            <div className="admin-item-info">
                                                <div className="admin-item-main">
                                                    <span className="comment-admin-author">
                                                        👤 {c.author_username}
                                                    </span>
                                                    <span className="admin-item-sub">{c.body}</span>
                                                    <span className="admin-item-date">
                                                        🕒 {formatDate(c.createdAt || c.created_at)}
                                                        {(c.updatedAt || c.updated_at) && (c.updatedAt || c.updated_at) !== (c.createdAt || c.created_at) ?
                                                            ` (обн. ${formatDate(c.updatedAt || c.updated_at)})` : ''}
                                                    </span>
                                                </div>
                                                <div className="admin-item-badges">
                                                    <StatusBadge status={c.status} />
                                                </div>
                                            </div>
                                            <div className="admin-item-actions">
                                                {c.status === 'BLOCKED' ? (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleCommentActivate(c.id)}
                                                        disabled={commentActionLoading === c.id}
                                                    >
                                                        Активировать
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleCommentBlock(c.id)}
                                                        disabled={commentActionLoading === c.id}
                                                    >
                                                        Заблокировать
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*                 MODS TAB                   */
/* ═══════════════════════════════════════════ */
function ModsTab() {
    const [mods, setMods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const [selectedId, setSelectedId] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [commentActionLoading, setCommentActionLoading] = useState(null);

    useEffect(() => {
        loadMods();
    }, []);

    const loadMods = async () => {
        try {
            const data = await api.getMods();
            setMods(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (externalId) => {
        setActionLoading(externalId);
        try {
            const updated = await api.activateMod(externalId);
            setMods(mods.map((m) => (m.external_id === externalId ? updated : m)));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBlock = async (externalId) => {
        setActionLoading(externalId);
        try {
            const updated = await api.blockMod(externalId);
            setMods(mods.map((m) => (m.external_id === externalId ? updated : m)));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleComments = async (externalId) => {
        if (selectedId === externalId && commentsOpen) {
            setCommentsOpen(false);
            setSelectedId(null);
            setComments([]);
            return;
        }

        setSelectedId(externalId);
        setCommentsOpen(true);
        setCommentsLoading(true);
        setComments([]);
        setError('');

        try {
            const data = await api.getModComments(externalId);
            const sortedData = data.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
            setComments(sortedData);
        } catch (err) {
            setError(err.message);
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleCommentActivate = async (commentId) => {
        setCommentActionLoading(commentId);
        try {
            const updated = await api.activateModComment(selectedId, commentId);
            setComments(comments.map((c) => (c.id === commentId ? updated : c)));
        } catch (err) {
            setError(err.message);
        } finally {
            setCommentActionLoading(null);
        }
    };

    const handleCommentBlock = async (commentId) => {
        setCommentActionLoading(commentId);
        try {
            const updated = await api.blockModComment(selectedId, commentId);
            setComments(comments.map((c) => (c.id === commentId ? updated : c)));
        } catch (err) {
            setError(err.message);
        } finally {
            setCommentActionLoading(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="admin-tab-content">
            {error && <div className="auth-error">{error}</div>}
            <div className="admin-stat">Всего модов: <strong>{mods.length}</strong></div>
            <div className="admin-list">
                {mods.map((mod) => {
                    const isOpen = selectedId === mod.external_id && commentsOpen;
                    return (
                        <div key={mod.external_id} className="admin-item-group">
                            <div className={`admin-item glass-card ${isOpen ? 'expanded' : ''}`}>
                                <div className="admin-item-info">
                                    <div className="admin-item-main">
                                        <span className="admin-item-name">{mod.title}</span>
                                        <span className="admin-item-sub">
                                            {mod.content?.slice(0, 80)}{mod.content?.length > 80 ? '...' : ''}
                                        </span>
                                        <span className="admin-item-meta">
                                            🔥 Популярность: {mod.popularity} &nbsp;|&nbsp; 👤 {mod.author_username}
                                        </span>
                                        <span className="admin-item-date">
                                            🕒 {formatDate(mod.createdAt || mod.created_at)}
                                            {(mod.updatedAt || mod.updated_at) && (mod.updatedAt || mod.updated_at) !== (mod.createdAt || mod.created_at) ?
                                                ` (обн. ${formatDate(mod.updatedAt || mod.updated_at)})` : ''}
                                        </span>
                                    </div>
                                    <div className="admin-item-badges">
                                        <StatusBadge status={mod.status} />
                                        <span className="post-rating-badge">{mod.rating}</span>
                                    </div>
                                </div>
                                <div className="admin-item-actions">
                                    {mod.status === 'BLOCKED' ? (
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleActivate(mod.external_id)}
                                            disabled={actionLoading === mod.external_id}
                                        >
                                            Активировать
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleBlock(mod.external_id)}
                                            disabled={actionLoading === mod.external_id}
                                        >
                                            Заблокировать
                                        </button>
                                    )}
                                    <button
                                        className={`btn btn-outline btn-sm ${isOpen ? 'active' : ''}`}
                                        onClick={() => toggleComments(mod.external_id)}
                                    >
                                        {isOpen ? '▲ Скрыть комм.' : '▼ Комментарии'}
                                    </button>
                                </div>
                            </div>

                            {isOpen && (
                                <div className="comments-ladder">
                                    {commentsLoading && <LoadingSpinner />}
                                    {!commentsLoading && comments.length === 0 && (
                                        <p className="no-comments">Нет комментариев</p>
                                    )}
                                    {!commentsLoading && comments.map((c) => (
                                        <div key={c.id} className="admin-comment-item glass-card">
                                            <div className="admin-item-info">
                                                <div className="admin-item-main">
                                                    <span className="comment-admin-author">
                                                        👤 {c.author_username}
                                                    </span>
                                                    <span className="admin-item-sub">{c.body}</span>
                                                    <span className="admin-item-date">
                                                        🕒 {formatDate(c.createdAt || c.created_at)}
                                                        {(c.updatedAt || c.updated_at) && (c.updatedAt || c.updated_at) !== (c.createdAt || c.created_at) ?
                                                            ` (обн. ${formatDate(c.updatedAt || c.updated_at)})` : ''}
                                                    </span>
                                                </div>
                                                <div className="admin-item-badges">
                                                    <StatusBadge status={c.status} />
                                                </div>
                                            </div>
                                            <div className="admin-item-actions">
                                                {c.status === 'BLOCKED' ? (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleCommentActivate(c.id)}
                                                        disabled={commentActionLoading === c.id}
                                                    >
                                                        Активировать
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleCommentBlock(c.id)}
                                                        disabled={commentActionLoading === c.id}
                                                    >
                                                        Заблокировать
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*                GUIDES TAB                  */
/* ═══════════════════════════════════════════ */
function GuidesTab() {
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadGuides();
    }, []);

    const loadGuides = async () => {
        try {
            const data = await guideApi.getAllGuides();
            const sortedData = data.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
            setGuides(sortedData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (guideId) => {
        setActionLoading(guideId);
        try {
            const updated = await guideApi.activateGuide(guideId);
            setGuides(guides.map((g) => (g.id === guideId ? updated : g)));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBlock = async (guideId) => {
        setActionLoading(guideId);
        try {
            const updated = await guideApi.blockGuide(guideId);
            setGuides(guides.map((g) => (g.id === guideId ? updated : g)));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="admin-tab-content">
            {error && <div className="auth-error">{error}</div>}
            <div className="admin-stat">Всего руководств: <strong>{guides.length}</strong></div>
            <div className="admin-list">
                {guides.map((guide) => (
                    <div key={guide.id} className="admin-item-group">
                        <div className="admin-item glass-card">
                            <div className="admin-item-info">
                                <div className="admin-item-main">
                                    <span className="admin-item-name">{guide.title}</span>
                                    <span className="admin-item-sub">
                                        {guide.content?.slice(0, 80)}{guide.content?.length > 80 ? '...' : ''}
                                    </span>
                                    <span className="admin-item-meta">
                                        🔗 <Link to={`/mod/${guide.modId || guide.mod_id}/guides/${guide.id}/edit`} className="auth-link">К моду ID {guide.modId || guide.mod_id}</Link> &nbsp;|&nbsp; 👤 {guide.author?.username || guide.author?.login}
                                    </span>
                                    <span className="admin-item-date">
                                        🕒 {formatDate(guide.createdAt || guide.created_at)}
                                        {(guide.updatedAt || guide.updated_at) && (guide.updatedAt || guide.updated_at) !== (guide.createdAt || guide.created_at) ?
                                            ` (обн. ${formatDate(guide.updatedAt || guide.updated_at)})` : ''}
                                    </span>
                                </div>
                                <div className="admin-item-badges">
                                    <StatusBadge status={guide.status} />
                                </div>
                            </div>
                            <div className="admin-item-actions">
                                {guide.status === 'BLOCKED' ? (
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleActivate(guide.id)}
                                        disabled={actionLoading === guide.id}
                                    >
                                        Активировать
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleBlock(guide.id)}
                                        disabled={actionLoading === guide.id}
                                    >
                                        Заблокировать
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Shared ─── */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function LoadingSpinner() {
    return (
        <div className="loading-state" style={{ minHeight: '20vh' }}>
            <div className="loading-spinner" />
        </div>
    );
}
