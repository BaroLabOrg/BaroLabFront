import { useState } from 'react';
import { convertLoadOrder } from '../api/loadOrder';
import './LoadOrderPage.css';

const INITIAL_REQUEST_TEXT = `{
  "mods": []
}`;

function getErrorTitle(status) {
    if (status === 400) {
        return 'Validation failed (400)';
    }

    if (status === 422) {
        return 'Dependency graph contains cycle (422)';
    }

    return 'Request failed';
}

export default function LoadOrderPage() {
    const [requestText, setRequestText] = useState(INITIAL_REQUEST_TEXT);
    const [xmlResult, setXmlResult] = useState('');
    const [requestError, setRequestError] = useState('');
    const [responseError, setResponseError] = useState('');
    const [responseStatus, setResponseStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setRequestError('');
        setResponseError('');
        setResponseStatus(null);
        setXmlResult('');

        let payload;
        try {
            payload = JSON.parse(requestText);
        } catch {
            setRequestError('Request body must be valid JSON.');
            return;
        }

        setLoading(true);
        try {
            const xml = await convertLoadOrder(payload);
            setXmlResult(xml);
        } catch (error) {
            setResponseStatus(error?.status ?? null);
            setResponseError(error?.message || 'Failed to convert load order.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container load-order-page">
                <section className="load-order-header glass-card">
                    <h1 className="page-title">Load Order Sorter</h1>
                    <p className="page-subtitle">
                        Paste a JSON payload matching <code>LoadOrderConvertRequest</code> and get sorted XML from
                        <code> /api/load-order/convert</code>.
                    </p>
                </section>

                <section className="load-order-form-card glass-card">
                    <form onSubmit={handleSubmit}>
                        <label className="load-order-label" htmlFor="load-order-json">
                            Request JSON
                        </label>
                        <textarea
                            id="load-order-json"
                            className="load-order-textarea"
                            value={requestText}
                            onChange={(event) => setRequestText(event.target.value)}
                            spellCheck={false}
                            rows={16}
                            placeholder="Paste LoadOrderConvertRequest JSON here"
                            disabled={loading}
                        />

                        {requestError && <div className="auth-error">{requestError}</div>}

                        <div className="load-order-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Converting...' : 'Convert to XML'}
                            </button>
                        </div>
                    </form>
                </section>

                {responseError && (
                    <section className="load-order-error-card glass-card">
                        <h2>{getErrorTitle(responseStatus)}</h2>
                        <p>{responseError}</p>
                    </section>
                )}

                {xmlResult && (
                    <section className="load-order-result-card glass-card">
                        <h2>XML Result</h2>
                        <pre className="load-order-result">{xmlResult}</pre>
                    </section>
                )}
            </div>
        </div>
    );
}
