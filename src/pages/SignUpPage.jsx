import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css'; /* reuse same auth styles */

export default function SignUpPage() {
    const [login, setLogin] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signUp(login, email, username, password);
            navigate('/mods');
        } catch (err) {
            setError(err.message || 'Ошибка регистрации');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);
        try {
            await loginWithGoogle(credentialResponse.credential);
            navigate('/mods');
        } catch (err) {
            setError(err.message || 'Ошибка регистрации через Google');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Не удалось войти через Google. Попробуйте ещё раз.');
    };

    return (
        <div className="auth-page">
            <div className="auth-bg-glow" />
            <div className="auth-container">
                <div className="auth-card glass-card">
                    <div className="auth-header">
                        <span className="auth-logo">◆</span>
                        <h1 className="auth-title">Создать аккаунт</h1>
                        <p className="auth-subtitle">Присоединяйтесь к сообществу BaroLab</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="auth-error">{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Логин</label>
                            <input
                                id="signup-login"
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                placeholder="Придумайте логин"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                id="signup-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Имя пользователя (никнейм)</label>
                            <input
                                id="signup-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Отображаемое имя"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Пароль</label>
                            <input
                                id="signup-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Минимум 6 символов"
                                required
                            />
                        </div>

                        <button
                            id="signup-button"
                            type="submit"
                            className="btn btn-primary auth-submit"
                            disabled={loading}
                        >
                            {loading ? 'Создание...' : 'Зарегистрироваться'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>или</span>
                    </div>

                    <div className="google-login-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            size="large"
                            width="100%"
                            text="signup_with"
                            shape="rectangular"
                            locale="ru"
                        />
                    </div>

                    <div className="auth-footer">
                        <span>Уже есть аккаунт?</span>
                        <Link to="/login">Войти</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
