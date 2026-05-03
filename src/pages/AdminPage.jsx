import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';
import * as guideApi from '../api/modGuides';
import * as submarineApi from '../api/submarines';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { Link } from 'react-router-dom';
import SteamSyncTab from './SteamSyncTab';
import './AdminPage.css';

const ROLES = ['USER', 'SUPERUSER', 'ADMIN', 'SUPER_ADMIN'];
const USER_STATUS_OPTIONS = ['ALL', 'ACTIVE', 'BLOCKED'];
const CONTENT_STATUS_OPTIONS = ['ALL', 'ACTIVE', 'BLOCKED'];

export default function AdminPage() {
    const { isAdmin, isSuperAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'users' : 'mods');

    return (
        <div className="page">
            <div className="container">
                <div className="admin-header">
                    <h1 className="page-title">⚙ Admin Panel</h1>
                    <p className="page-subtitle">Manage users, mods, guides, and submarines</p>
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
                    <button
                        className={`admin-tab ${activeTab === 'submarines' ? 'active' : ''}`}
                        onClick={() => setActiveTab('submarines')}
                    >
                        🚢 Submarines
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
                    {activeTab === 'submarines' && <SubmarinesTab />}
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
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [roleFilter, setRoleFilter] = useState('ALL');

    useEffect(() => {
        loadUsers(page);
    }, [page, searchQuery, statusFilter, roleFilter]);

    const loadUsers = async (targetPage) => {
        setLoading(true);
        setError('');
        try {
            const data = await api.getUsers({
                q: searchQuery,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                role: roleFilter === 'ALL' ? undefined : roleFilter,
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
            <div className="admin-toolbar glass-card">
                <div className="admin-toolbar-main">
                    <input
                        className="admin-search-input"
                        type="search"
                        placeholder="Search by login, email, role or status"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(0);
                        }}
                    />
                    <p className="admin-toolbar-hint">Search works across the full database and returns a new paginated result.</p>
                </div>
                <div className="admin-toolbar-filters">
                    <select className="admin-filter-select" value={statusFilter} onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(0);
                    }}>
                        {USER_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status === 'ALL' ? 'All statuses' : status}</option>
                        ))}
                    </select>
                    <select className="admin-filter-select" value={roleFilter} onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setPage(0);
                    }}>
                        <option value="ALL">All roles</option>
                        {ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="admin-stat">Total matched users: <strong>{totalUsers}</strong> · Loaded on current page: <strong>{users.length}</strong></div>
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
                {users.length === 0 && <div className="admin-empty-state">No users match the current filters.</div>}
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

    // search inputs (draft — не отправляются пока не нажата кнопка)
    const [searchDraft, setSearchDraft] = useState('');
    const [statusDraft, setStatusDraft] = useState('ALL');
    const [authorDraft, setAuthorDraft] = useState('');

    // applied params — по ним делается реальный запрос
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedStatus, setAppliedStatus] = useState('ALL');
    const [appliedAuthor, setAppliedAuthor] = useState('');

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
    }, [page, appliedSearch, appliedStatus, appliedAuthor]);

    const loadMods = async (targetPage) => {
        setLoading(true);
        setError('');
        try {
            const data = await api.getMods({
                q: appliedSearch || undefined,
                status: appliedStatus === 'ALL' ? undefined : appliedStatus,
                author: appliedAuthor || undefined,
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

    const handleSearch = () => {
        setAppliedSearch(searchDraft);
        setAppliedStatus(statusDraft);
        setAppliedAuthor(authorDraft);
        setPage(0);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleClearSearch = () => {
        setSearchDraft('');
        setStatusDraft('ALL');
        setAuthorDraft('');
        setAppliedSearch('');
        setAppliedStatus('ALL');
        setAppliedAuthor('');
        setPage(0);
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
            <div className="admin-toolbar glass-card">
                <div className="admin-toolbar-main">
                    <div className="admin-search-row">
                        <input
                            className="admin-search-input"
                            type="search"
                            placeholder="Search by title, description, ID, rating or popularity"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                        <button className="btn btn-primary btn-sm" onClick={handleSearch} disabled={loading}>
                            Search
                        </button>
                        {(appliedSearch || appliedStatus !== 'ALL' || appliedAuthor) && (
                            <button className="btn btn-outline btn-sm" onClick={handleClearSearch}>
                                Clear
                            </button>
                        )}
                    </div>
                    <p className="admin-toolbar-hint">Search works across the full database and rebuilds pagination.</p>
                </div>
                <div className="admin-toolbar-filters">
                    <input
                        className="admin-filter-input"
                        type="text"
                        placeholder="Author"
                        value={authorDraft}
                        onChange={(e) => setAuthorDraft(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    <select className="admin-filter-select" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                        {CONTENT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status === 'ALL' ? 'All statuses' : status}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="admin-stat">Total matched mods: <strong>{totalMods}</strong> · On this page: <strong>{mods.length}</strong></div>
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
                {mods.length === 0 && <div className="admin-empty-state">No mods match the current filters.</div>}
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
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [authorFilter, setAuthorFilter] = useState('');

    useEffect(() => {
        loadGuides(page);
    }, [page, searchQuery, statusFilter, authorFilter]);

    const loadGuides = async (targetPage) => {
        setLoading(true);
        setError('');
        try {
            const data = await guideApi.getAllGuides({
                q: searchQuery,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                author: authorFilter,
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
            <div className="admin-toolbar glass-card">
                <div className="admin-toolbar-main">
                    <input
                        className="admin-search-input"
                        type="search"
                        placeholder="Search by title, description, mod ID or author"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(0);
                        }}
                    />
                    <p className="admin-toolbar-hint">Search works across the full database and returns a new paginated result.</p>
                </div>
                <div className="admin-toolbar-filters">
                    <input
                        className="admin-filter-input"
                        type="text"
                        placeholder="Author"
                        value={authorFilter}
                        onChange={(e) => {
                            setAuthorFilter(e.target.value);
                            setPage(0);
                        }}
                    />
                    <select className="admin-filter-select" value={statusFilter} onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(0);
                    }}>
                        {CONTENT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status === 'ALL' ? 'All statuses' : status}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="admin-stat">Total matched guides: <strong>{totalGuides}</strong> · Loaded on current page: <strong>{guides.length}</strong></div>
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
                {guides.length === 0 && <div className="admin-empty-state">No guides match the current filters.</div>}
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
/*              SUBMARINES TAB                */
/* ═══════════════════════════════════════════ */
function SubmarinesTab() {
    const PAGE_SIZE = 12;
    const [submarines, setSubmarines] = useState([]);
    const [page, setPage] = useState(0);
    const [totalSubmarines, setTotalSubmarines] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    // draft — не отправляются пока не нажата кнопка
    const [searchDraft, setSearchDraft] = useState('');
    const [statusDraft, setStatusDraft] = useState('ALL');
    const [classDraft, setClassDraft] = useState('ALL');
    const [authorDraft, setAuthorDraft] = useState('');

    // applied — по ним делается реальный запрос
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedStatus, setAppliedStatus] = useState('ALL');
    const [appliedClass, setAppliedClass] = useState('ALL');
    const [appliedAuthor, setAppliedAuthor] = useState('');

    useEffect(() => {
        loadSubmarines(page);
    }, [page, appliedSearch, appliedStatus, appliedClass, appliedAuthor]);

    const loadSubmarines = async (targetPage) => {
        setLoading(true);
        setError('');
        try {
            const data = await submarineApi.getSubmarines({
                q: appliedSearch || undefined,
                status: appliedStatus === 'ALL' ? undefined : appliedStatus,
                submarineClass: appliedClass === 'ALL' ? undefined : appliedClass,
                author: appliedAuthor || undefined,
                page: targetPage,
                size: PAGE_SIZE,
                sortBy: 'createdAt',
                direction: 'desc',
            });
            setSubmarines(data.items);
            setTotalSubmarines(data.total);
            setTotalPages(data.total_pages);
            setHasNext(data.has_next);
            setHasPrevious(data.has_previous);
        } catch (err) {
            setError(api.mapPaginationError(err, 'Failed to load submarines'));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setAppliedSearch(searchDraft);
        setAppliedStatus(statusDraft);
        setAppliedClass(classDraft);
        setAppliedAuthor(authorDraft);
        setPage(0);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleClearSearch = () => {
        setSearchDraft('');
        setStatusDraft('ALL');
        setClassDraft('ALL');
        setAuthorDraft('');
        setAppliedSearch('');
        setAppliedStatus('ALL');
        setAppliedClass('ALL');
        setAppliedAuthor('');
        setPage(0);
    };

    const handleActivate = async (externalId) => {
        setActionLoading(externalId);
        try {
            const updated = await submarineApi.activateSubmarine(externalId);
            setSubmarines(submarines.map((s) => ((s.externalId ?? s.external_id) === externalId ? updated : s)));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBlock = async (externalId) => {
        setActionLoading(externalId);
        try {
            const updated = await submarineApi.blockSubmarine(externalId);
            setSubmarines(submarines.map((s) => ((s.externalId ?? s.external_id) === externalId ? updated : s)));
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
            <div className="admin-toolbar glass-card">
                <div className="admin-toolbar-main">
                    <div className="admin-search-row">
                        <input
                            className="admin-search-input"
                            type="search"
                            placeholder="Search by title, description, ID, class, tier, price or author"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                        <button className="btn btn-primary btn-sm" onClick={handleSearch} disabled={loading}>
                            Search
                        </button>
                        {(appliedSearch || appliedStatus !== 'ALL' || appliedClass !== 'ALL' || appliedAuthor) && (
                            <button className="btn btn-outline btn-sm" onClick={handleClearSearch}>
                                Clear
                            </button>
                        )}
                    </div>
                    <p className="admin-toolbar-hint">Search works across the full database and rebuilds pagination.</p>
                </div>
                <div className="admin-toolbar-filters">
                    <input
                        className="admin-filter-input"
                        type="text"
                        placeholder="Author"
                        value={authorDraft}
                        onChange={(e) => setAuthorDraft(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    <select className="admin-filter-select" value={classDraft} onChange={(e) => setClassDraft(e.target.value)}>
                        <option value="ALL">All classes</option>
                        {submarineApi.SUBMARINE_CLASS_VALUES.map((sc) => (
                            <option key={sc} value={sc}>{sc}</option>
                        ))}
                    </select>
                    <select className="admin-filter-select" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                        {CONTENT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status === 'ALL' ? 'All statuses' : status}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="admin-stat">Total matched submarines: <strong>{totalSubmarines}</strong> · On this page: <strong>{submarines.length}</strong></div>
            <div className="admin-list">
                {submarines.map((submarine) => {
                    const externalId = submarine.externalId ?? submarine.external_id;
                    const createdAt = submarine.createdAt || submarine.created_at;
                    const updatedAt = submarine.updatedAt || submarine.updated_at;
                    const isBlocked = submarine.blocked === true
                        || String(submarine.status || '').toUpperCase() === 'BLOCKED';
                    const status = isBlocked
                        ? 'BLOCKED'
                        : submarine.active === true || String(submarine.status || '').toUpperCase() === 'ACTIVE'
                            ? 'ACTIVE'
                            : submarine.status || 'UNKNOWN';

                    return (
                        <div key={submarine.id || externalId} className="admin-item-group">
                            <div className="admin-item glass-card">
                                <div className="admin-item-info">
                                    <div className="admin-item-main">
                                        <span className="admin-item-name">
                                            {submarine.title || `Submarine #${externalId}`}
                                        </span>
                                        <span className="admin-item-sub">
                                            {submarine.description?.slice(0, 100)}
                                            {submarine.description?.length > 100 ? '...' : ''}
                                        </span>
                                        <span className="admin-item-meta">
                                            🧭 {submarine.submarineClass || submarine.submarine_class || '—'}
                                            &nbsp;|&nbsp; Tier {submarine.tier ?? '—'}
                                            &nbsp;|&nbsp; 👤 {submarine.authorUsername || submarine.author_username || '—'}
                                        </span>
                                        <span className="admin-item-date">
                                            🕒 {formatDate(createdAt)}
                                            {updatedAt && updatedAt !== createdAt
                                                ? ` (updated ${formatDate(updatedAt)})`
                                                : ''}
                                        </span>
                                    </div>
                                    <div className="admin-item-badges">
                                        <StatusBadge status={status} />
                                    </div>
                                </div>
                                <div className="admin-item-actions">
                                    {isBlocked ? (
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleActivate(externalId)}
                                            disabled={actionLoading === externalId}
                                        >
                                            Activate
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleBlock(externalId)}
                                            disabled={actionLoading === externalId}
                                        >
                                            Block
                                        </button>
                                    )}
                                    <Link className="btn btn-outline btn-sm" to={`/submarines/${externalId}`}>
                                        Open
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {submarines.length === 0 && <div className="admin-empty-state">No submarines match the current filters.</div>}
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
