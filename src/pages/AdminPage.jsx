import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';
import * as guideApi from '../api/modGuides';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { Link } from 'react-router-dom';
import SteamSyncTab from './SteamSyncTab';
import './AdminPage.css';

const ROLES = ['USER', 'SUPERUSER', 'ADMIN', 'SUPER_ADMIN'];

export default function AdminPage() {
    const { isAdmin, isSuperAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'users' : 'mods');

    return (
        <div className="page">
            <div className="container">
                <div className="admin-header">
                    <h1 className="page-title">⚙ Admin Panel</h1>
                    <p className="page-subtitle">Manage users, mods, and guides</p>
                </div>

                <div className="admin-tabs">
                    {isSuperAdmin && (
                        <button
                            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            👥 Users
                        </button>
                    )}

                    <button
                        className={`admin-tab ${activeTab === 'mods' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mods')}
                    >
                        🎮 Mods
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'guides' ? 'active' : ''}`}
                        onClick={() => setActiveTab('guides')}
                    >
                        📚 Guides
                    </button>
                    {isAdmin && (
                        <button
                            className={`admin-tab ${activeTab === 'steam-sync' ? 'active' : ''}`}
                            onClick={() => setActiveTab('steam-sync')}
                        >
                            🚢 Steam Sync
                        </button>
                    )}
                </div>

                <div className="admin-content fade-in">
                    {activeTab === 'users' && isSuperAdmin && <UsersTab />}

                    {activeTab === 'mods' && <ModsTab />}
                    {activeTab === 'guides' && <GuidesTab />}
                    {activeTab === 'steam-sync' && isAdmin && <SteamSyncTab />}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*                USERS TAB                   */
/* ═══════════════════════════════════════════ */
function UsersTab() {
    const PAGE_SIZE = 12;
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadUsers(page);
    }, [page]);

    const loadUsers = async (targetPage) => {
        setLoading(true);
        setError('');
        try {
            const data = await api.getUsers({
                page: targetPage,
                size: PAGE_SIZE,
                sortBy: 'createdAt',
                direction: 'desc',
            });
            setUsers(data.items);
            setTotalUsers(data.total);
            setTotalPages(data.total_pages);
            setHasNext(data.has_next);
            setHasPrevious(data.has_previous);
        } catch (err) {
            setError(api.mapPaginationError(err, 'Failed to load users'));
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
            <div className="admin-stat">Total users: <strong>{totalUsers}</strong></div>
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
                                    Activate
                                </button>
                            ) : (
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleBlock(user.id)}
                                    disabled={actionLoading === user.id}
                                >
                                    Block
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <Pagination
                page={page}
                totalPages={totalPages}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                disabled={loading || actionLoading !== null}
                onPageChange={setPage}
            />
        </div>
    );
}


/*                 MODS TAB                   */
/* ═══════════════════════════════════════════ */
function ModsTab() {
    const PAGE_SIZE = 10;
    const COMMENT_PAGE_SIZE = 8;
    const [mods, setMods] = useState([]);
    const [page, setPage] = useState(0);
    const [totalMods, setTotalMods] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const [selectedId, setSelectedId] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentPage, setCommentPage] = useState(0);
    const [commentTotalPages, setCommentTotalPages] = useState(0);
    const [commentHasNext, setCommentHasNext] = useState(false);
    const [commentHasPrevious, setCommentHasPrevious] = useState(false);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [commentActionLoading, setCommentActionLoading] = useState(null);

    useEffect(() => {
        loadMods(page);
    }, [page]);

    const loadMods = async (targetPage) => {
        setLoading(true);
        setError('');
        try {
            const data = await api.getMods({
                page: targetPage,
                size: PAGE_SIZE,
                sortBy: 'createdAt',
                direction: 'desc',
            });
            setMods(data.items);
            setTotalMods(data.total);
            setTotalPages(data.total_pages);
            setHasNext(data.has_next);
            setHasPrevious(data.has_previous);
        } catch (err) {
            setError(api.mapPaginationError(err, 'Failed to load mods'));
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

    const loadComments = async (externalId, targetPage = 0) => {
        setCommentsLoading(true);
        setComments([]);
        setError('');

        try {
            const data = await api.getComments(externalId, {
                page: targetPage,
                size: COMMENT_PAGE_SIZE,
                sortBy: 'createdAt',
                direction: 'desc',
            });
            setComments(data.items);
            setCommentPage(data.page);
            setCommentTotalPages(data.total_pages);
            setCommentHasNext(data.has_next);
            setCommentHasPrevious(data.has_previous);
        } catch (err) {
            setError(api.mapPaginationError(err, 'Failed to load comments'));
        } finally {
            setCommentsLoading(false);
        }
    };

    const toggleComments = async (externalId) => {
        if (selectedId === externalId && commentsOpen) {
            setCommentsOpen(false);
            setSelectedId(null);
            setComments([]);
            setCommentPage(0);
            setCommentTotalPages(0);
            setCommentHasNext(false);
            setCommentHasPrevious(false);
            return;
        }

        setSelectedId(externalId);
        setCommentsOpen(true);
        await loadComments(externalId, 0);
    };

    const handleCommentPageChange = async (nextPage) => {
        if (!selectedId) return;
        await loadComments(selectedId, nextPage);
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
            <div className="admin-stat">Total mods: <strong>{totalMods}</strong></div>
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
                                            {mod.description?.slice(0, 80)}{mod.description?.length > 80 ? '...' : ''}
                                        </span>
                                        <span className="admin-item-meta">
                                            🔥 Popularity: {mod.popularity} &nbsp;|&nbsp; 👤 {mod.author_username}
                                        </span>
                                        <span className="admin-item-date">
                                            🕒 {formatDate(mod.createdAt || mod.created_at)}
                                            {(mod.updatedAt || mod.updated_at) && (mod.updatedAt || mod.updated_at) !== (mod.createdAt || mod.created_at) ?
                                                ` (updated ${formatDate(mod.updatedAt || mod.updated_at)})` : ''}
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
                                            Activate
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleBlock(mod.external_id)}
                                            disabled={actionLoading === mod.external_id}
                                        >
                                            Block
                                        </button>
                                    )}
                                    <button
                                        className={`btn btn-outline btn-sm ${isOpen ? 'active' : ''}`}
                                        onClick={() => toggleComments(mod.external_id)}
                                    >
                                        {isOpen ? '▲ Hide comments' : '▼ Comments'}
                                    </button>
                                </div>
                            </div>

                            {isOpen && (
                                <div className="comments-ladder">
                                    {commentsLoading && <LoadingSpinner />}
                                    {!commentsLoading && comments.length === 0 && (
                                        <p className="no-comments">No comments</p>
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
                                                            ` (updated ${formatDate(c.updatedAt || c.updated_at)})` : ''}
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
                                                        Activate
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleCommentBlock(c.id)}
                                                        disabled={commentActionLoading === c.id}
                                                    >
                                                        Block
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <Pagination
                                        page={commentPage}
                                        totalPages={commentTotalPages}
                                        hasNext={commentHasNext}
                                        hasPrevious={commentHasPrevious}
                                        disabled={commentsLoading || commentActionLoading !== null}
                                        onPageChange={handleCommentPageChange}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <Pagination
                page={page}
                totalPages={totalPages}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                disabled={loading || actionLoading !== null}
                onPageChange={setPage}
            />
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/*                GUIDES TAB                  */
/* ═══════════════════════════════════════════ */
function GuidesTab() {
    const PAGE_SIZE = 12;
    const [guides, setGuides] = useState([]);
    const [page, setPage] = useState(0);
    const [totalGuides, setTotalGuides] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        loadGuides(page);
    }, [page]);

    const loadGuides = async (targetPage) => {
        setLoading(true);
        setError('');
        try {
            const data = await guideApi.getAllGuides({
                page: targetPage,
                size: PAGE_SIZE,
                sortBy: 'createdAt',
                direction: 'desc',
            });
            setGuides(data.items);
            setTotalGuides(data.total);
            setTotalPages(data.total_pages);
            setHasNext(data.has_next);
            setHasPrevious(data.has_previous);
        } catch (err) {
            setError(api.mapPaginationError(err, 'Failed to load guides'));
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
            <div className="admin-stat">Total guides: <strong>{totalGuides}</strong></div>
            <div className="admin-list">
                {guides.map((guide) => (
                    <div key={guide.id} className="admin-item-group">
                        <div className="admin-item glass-card">
                            <div className="admin-item-info">
                                <div className="admin-item-main">
                                    <span className="admin-item-name">{guide.title}</span>
                                    <span className="admin-item-sub">
                                        {guide.description?.slice(0, 80)}{guide.description?.length > 80 ? '...' : ''}
                                    </span>
                                    <span className="admin-item-meta">
                                        🔗 <Link to={`/mod/${guide.modId || guide.mod_id}/guides/${guide.id}/edit`} className="auth-link">To mod ID {guide.modId || guide.mod_id}</Link> &nbsp;|&nbsp; 👤 {guide.author?.username || guide.author?.login}
                                    </span>
                                    <span className="admin-item-date">
                                        🕒 {formatDate(guide.createdAt || guide.created_at)}
                                        {(guide.updatedAt || guide.updated_at) && (guide.updatedAt || guide.updated_at) !== (guide.createdAt || guide.created_at) ?
                                            ` (updated ${formatDate(guide.updatedAt || guide.updated_at)})` : ''}
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
                                        Activate
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleBlock(guide.id)}
                                        disabled={actionLoading === guide.id}
                                    >
                                        Block
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <Pagination
                page={page}
                totalPages={totalPages}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                disabled={loading || actionLoading !== null}
                onPageChange={setPage}
            />
        </div>
    );
}

/* ─── Shared ─── */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', {
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
