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
            setError(err.message || 'Sign-up error');
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
            setError(err.message || 'Google sign-up error');
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
                <div className="auth-card glass-card">
                    <div className="auth-header">
                        <span className="auth-logo">◆</span>
                        <h1 className="auth-title">Create account</h1>
                        <p className="auth-subtitle">Join the BaroLab community</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="auth-error">{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Login</label>
                            <input
                                id="signup-login"
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                placeholder="Choose a login"
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
                            <label className="form-label">Username (nickname)</label>
                            <input
                                id="signup-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Display name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                id="signup-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                required
                            />
                        </div>

                        <button
                            id="signup-button"
                            type="submit"
                            className="btn btn-primary auth-submit"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Sign up'}
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
                            text="signup_with"
                            shape="rectangular"
                            locale="en"
                        />
                    </div>

                    <div className="auth-footer">
                        <span>Already have an account?</span>
                        <Link to="/login">Log in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
