import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [ssoError, setSsoError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login: doLogin, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSsoError('');
        setLoading(true);
        try {
            await doLogin(login, password);
            navigate('/mods');
        } catch (err) {
            if (err.status === 403) {
                setSsoError('Этот аккаунт привязан к Google. Пожалуйста, используйте вход через Google.');
            } else {
                setError(err.message || 'Ошибка входа');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setSsoError('');
        setLoading(true);
        try {
            await loginWithGoogle(credentialResponse.credential);
            navigate('/mods');
        } catch (err) {
            setError(err.message || 'Ошибка входа через Google');
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
                        <h1 className="auth-title">С возвращением</h1>
                        <p className="auth-subtitle">Войдите в свой аккаунт BaroLab</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="auth-error">{error}</div>}
                        {ssoError && <div className="auth-sso-error">{ssoError}</div>}

                        <div className="form-group">
                            <label className="form-label">Логин</label>
                            <input
                                id="login-input"
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                placeholder="Введите логин"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Пароль</label>
                            <input
                                id="password-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Введите пароль"
                                required
                            />
                        </div>

                        <button
                            id="login-button"
                            type="submit"
                            className="btn btn-primary auth-submit"
                            disabled={loading}
                        >
                            {loading ? 'Вход...' : 'Войти'}
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
                            text="signin_with"
                            shape="rectangular"
                            locale="ru"
                        />
                    </div>

                    <div className="auth-footer">
                        <span>Нет аккаунта?</span>
                        <Link to="/sign-up">Создать аккаунт</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
