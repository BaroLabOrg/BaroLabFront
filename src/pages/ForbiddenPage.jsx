import { Link, useNavigate } from 'react-router-dom';
import './ErrorPage.css';

export default function ForbiddenPage() {
    const navigate = useNavigate();

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
                <div className="error-terminal error-terminal--forbidden glass-card">
                    {/* Terminal header */}
                    <div className="error-terminal-header">
                        <span className="error-terminal-title">ACCESS CONTROL SYSTEM</span>
                        <span className="error-terminal-minimize">—  □  ✕</span>
                    </div>

                    {/* Terminal body */}
                    <div className="error-terminal-body">
                        <div className="error-code-wrapper">
                            <h1 className="error-code error-code--forbidden">403</h1>
                        </div>

                        <div className="error-message">
                            <p className="error-title error-title--forbidden">
                                <span className="error-icon">🔒</span>
                                ACCESS DENIED
                            </p>
                            <p className="error-description">
                                Clearance level insufficient. This section is restricted to
                                authorized personnel only. Your credentials do not grant access
                                to this compartment.
                            </p>
                        </div>

                        <div className="error-log">
                            <div className="error-log-line">
                                <span className="error-log-timestamp">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                                <span className="error-log-level error-log-level--error">ERROR</span>
                                <span className="error-log-text">Access control: Insufficient clearance level</span>
                            </div>
                            <div className="error-log-line">
                                <span className="error-log-timestamp">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                                <span className="error-log-level error-log-level--warn">WARN</span>
                                <span className="error-log-text">Unauthorized access attempt logged</span>
                            </div>
                            <div className="error-log-line">
                                <span className="error-log-timestamp">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                                <span className="error-log-level error-log-level--info">INFO</span>
                                <span className="error-log-text">Contact station commander for elevated access</span>
                            </div>
                        </div>

                        <div className="error-actions">
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
                            <Link to="/login" className="btn btn-ghost">
                                🔑 Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
