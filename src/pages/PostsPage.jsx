import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/api';
import PostCard from '../components/PostCard';
import './PostsPage.css';

export default function PostsPage() {
    const { isAuthenticated } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Create post state
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await api.getPosts();
            const activePosts = data.filter(p => p.status === 'ACTIVE');
            setPosts(activePosts);
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
            const newPost = await api.createPost(title, description);
            setPosts([newPost, ...posts]);
            setTitle('');
            setDescription('');
            setShowForm(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
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
                <div className="posts-header-box glass-card shine">
                    <h1 className="posts-title">📝 Лента Постов</h1>
                    <p className="posts-subtitle">
                        Все публикации сообщества
                    </p>
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
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
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
