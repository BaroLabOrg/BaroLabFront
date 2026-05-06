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
                setSsoError('This account is linked to Google. Please use Google sign-in.');
            } else {
                setError(err.message || 'Login error');
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
            setError(err.message || 'Google login error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google login failed. Please try again.');
    };

    return (
        <div className="auth-page">
            <div className="auth-bg-glow" />
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Welcome back</h1>
                        <p className="auth-subtitle">Sign in to your BaroLab account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="auth-error">{error}</div>}
                        {ssoError && <div className="auth-sso-error">{ssoError}</div>}

                        <div className="form-group">
                            <label className="form-label">Login</label>
                            <input
                                id="login-input"
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                placeholder="Enter login"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                id="password-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        <button
                            id="login-button"
                            type="submit"
                            className="btn btn-primary auth-submit"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Log in'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>or</span>
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
                            locale="en"
                        />
                    </div>

                    <div className="auth-footer">
                        <span>No account?</span>
                        <Link to="/sign-up">Create account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
