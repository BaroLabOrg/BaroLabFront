import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';
import StatusBadge from '../components/StatusBadge';
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
                    <p className="page-subtitle">Управление пользователями, постами и комментариями</p>
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
                        className={`admin-tab ${activeTab === 'comments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('comments')}
                    >
                        💬 Комментарии
                    </button>
                </div>

                <div className="admin-content fade-in">
                    {activeTab === 'users' && isSuperAdmin && <UsersTab />}
                    {activeTab === 'posts' && <PostsTab />}
                    {activeTab === 'comments' && <CommentsTab />}
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

    if (loading) return <LoadingSpinner />;

    return (
        <div className="admin-tab-content">
            {error && <div className="auth-error">{error}</div>}
            <div className="admin-stat">Всего постов: <strong>{posts.length}</strong></div>
            <div className="admin-list">
                {posts.map((post) => (
                    <div key={post.id} className="admin-item glass-card">
                        <div className="admin-item-info">
                            <div className="admin-item-main">
                                <span className="admin-item-name">{post.title}</span>
                                <span className="admin-item-sub">
                                    {post.content?.slice(0, 80)}{post.content?.length > 80 ? '...' : ''}
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
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*              COMMENTS TAB                  */
/* ═══════════════════════════════════════════ */
function CommentsTab() {
    const [postIdInput, setPostIdInput] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [currentPostId, setCurrentPostId] = useState(null);

    // Also load posts for a quick selector
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);

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
            setPostsLoading(false);
        }
    };

    const loadComments = async (pid) => {
        const id = pid || postIdInput;
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const data = await api.getComments(id);
            setComments(data);
            setCurrentPostId(id);
        } catch (err) {
            setError(err.message);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (commentId) => {
        setActionLoading(commentId);
        try {
            const updated = await api.activateComment(currentPostId, commentId);
            setComments(comments.map((c) => (c.id === commentId ? updated : c)));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBlock = async (commentId) => {
        setActionLoading(commentId);
        try {
            const updated = await api.blockComment(currentPostId, commentId);
            setComments(comments.map((c) => (c.id === commentId ? updated : c)));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="admin-tab-content">
            {error && <div className="auth-error">{error}</div>}

            <div className="comments-search">
                <p className="comments-search-label">Выберите пост для просмотра комментариев:</p>
                {!postsLoading && posts.length > 0 && (
                    <div className="post-selector">
                        {posts.map((p) => (
                            <button
                                key={p.id}
                                className={`post-selector-item ${currentPostId === p.id ? 'active' : ''}`}
                                onClick={() => {
                                    setPostIdInput(p.id);
                                    loadComments(p.id);
                                }}
                            >
                                <span className="post-selector-title">{p.title}</span>
                                <StatusBadge status={p.status} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading && <LoadingSpinner />}

            {!loading && currentPostId && (
                <>
                    <div className="admin-stat">Комментариев: <strong>{comments.length}</strong></div>
                    <div className="admin-list">
                        {comments.map((c) => (
                            <div key={c.id} className="admin-item glass-card">
                                <div className="admin-item-info">
                                    <div className="admin-item-main">
                                        <span className="admin-item-sub">{c.body}</span>
                                    </div>
                                    <div className="admin-item-badges">
                                        <StatusBadge status={c.status} />
                                    </div>
                                </div>
                                <div className="admin-item-actions">
                                    {c.status === 'BLOCKED' ? (
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleActivate(c.id)}
                                            disabled={actionLoading === c.id}
                                        >
                                            Активировать
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleBlock(c.id)}
                                            disabled={actionLoading === c.id}
                                        >
                                            Заблокировать
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {comments.length === 0 && (
                            <p className="no-comments" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                У этого поста нет комментариев
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

/* ─── Shared ─── */
function LoadingSpinner() {
    return (
        <div className="loading-state" style={{ minHeight: '20vh' }}>
            <div className="loading-spinner" />
        </div>
    );
}

