import { Link, useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

export default function NotFoundPage() {
    const navigate = useNavigate();

    const handleGoBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="page not-found-page">
            <div className="container not-found-container">
                <div className="not-found-terminal glass-card">
                    {/* Terminal header */}
                    <div className="not-found-terminal-header">
                        <span className="not-found-terminal-title">NAVIGATION ERROR</span>
                        <span className="not-found-terminal-minimize">—  □  ✕</span>
                    </div>

                    {/* Terminal body */}
                    <div className="not-found-terminal-body">
                        <div className="not-found-glitch-wrapper">
                            <h1 className="not-found-code" data-text="404">404</h1>
                        </div>

                        <div className="not-found-message">
                            <p className="not-found-title">
                                <span className="not-found-icon">⚠</span>
                                ROUTE NOT FOUND
                            </p>
                            <p className="not-found-description">
                                The navigation system could not locate the requested coordinates.
                                The path may have been destroyed, never existed, or is beyond our sonar range.
                            </p>
                        </div>

                        <div className="not-found-log">
                            <div className="not-found-log-line">
                                <span className="not-found-log-timestamp">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                                <span className="not-found-log-level not-found-log-level--error">ERROR</span>
                                <span className="not-found-log-text">Navigation module: Route resolution failed</span>
                            </div>
                            <div className="not-found-log-line">
                                <span className="not-found-log-timestamp">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                                <span className="not-found-log-level not-found-log-level--warn">WARN</span>
                                <span className="not-found-log-text">Attempting to recalibrate navigation systems...</span>
                            </div>
                            <div className="not-found-log-line">
                                <span className="not-found-log-timestamp">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                                <span className="not-found-log-level not-found-log-level--info">INFO</span>
                                <span className="not-found-log-text">Manual navigation required</span>
                            </div>
                        </div>

                        <div className="not-found-actions">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleGoBack}
                            >
                                ← Go Back
                            </button>
                            <Link to="/" className="btn btn-outline">
                                🏠 Return to Base
                            </Link>
                            <Link to="/mods" className="btn btn-ghost">
                                Browse Mods →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Ambient decoration */}
                <div className="not-found-ambient" aria-hidden="true">
                    <div className="not-found-scan-line" />
                    <div className="not-found-particles">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="not-found-particle"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3}s`,
                                    animationDuration: `${3 + Math.random() * 4}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
