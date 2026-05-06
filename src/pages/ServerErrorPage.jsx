import { Link, useNavigate } from 'react-router-dom';
import './ErrorPage.css';

export default function ServerErrorPage() {
    const navigate = useNavigate();

    const handleRetry = () => {
        window.location.reload();
    };

    const handleGoBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="page error-page">
            <div className="container error-container">
                <div className="error-terminal error-terminal--server glass-card">
                    {/* Terminal header */}
                    <div className="error-terminal-header">
                        <span className="error-terminal-title">SYSTEM DIAGNOSTICS</span>
                        <span className="error-terminal-minimize">—  □  ✕</span>
                    </div>

                    {/* Terminal body */}
                    <div className="error-terminal-body">
                        <div className="error-code-wrapper">
                            <h1 className="error-code error-code--server">500</h1>
                        </div>

                        <div className="error-message">
                            <p className="error-title error-title--server">
                                <span className="error-icon error-icon--pulse">⚡</span>
                                REACTOR OFFLINE
                            </p>
                            <p className="error-description">
                                Critical system failure detected. The station's main server has
                                encountered an unrecoverable error. Engineering crew has been
                                notified. Please stand by or attempt manual restart.
                            </p>
                        </div>

                        <div className="error-log">
                            <div className="error-log-line">
                                <span className="error-log-timestamp">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                                <span className="error-log-level error-log-level--error">CRIT</span>
                                <span className="error-log-text">Server process terminated unexpectedly</span>
                            </div>
                            <div className="error-log-line">
                                <span className="error-log-timestamp">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                                <span className="error-log-level error-log-level--error">ERROR</span>
                                <span className="error-log-text">Internal server error: status 500</span>
                            </div>
                            <div className="error-log-line">
                                <span className="error-log-timestamp">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                                <span className="error-log-level error-log-level--warn">WARN</span>
                                <span className="error-log-text">Attempting automatic recovery sequence...</span>
                            </div>
                            <div className="error-log-line">
                                <span className="error-log-timestamp">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                                <span className="error-log-level error-log-level--info">INFO</span>
                                <span className="error-log-text">Manual restart recommended</span>
                            </div>
                        </div>

                        <div className="error-actions">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleRetry}
                            >
                                ↺ Retry
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={handleGoBack}
                            >
                                ← Go Back
                            </button>
                            <Link to="/" className="btn btn-ghost">
                                🏠 Return to Base
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
