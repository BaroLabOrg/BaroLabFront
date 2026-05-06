import { createContext, useContext, useState, useEffect } from 'react';

const ServerErrorContext = createContext(null);

export function ServerErrorProvider({ children }) {
    const [serverDown, setServerDown] = useState(false);

    useEffect(() => {
        const handler = () => setServerDown(true);
        window.addEventListener('server:unavailable', handler);
        return () => window.removeEventListener('server:unavailable', handler);
    }, []);

    const reset = () => setServerDown(false);

    return (
        <ServerErrorContext.Provider value={{ serverDown, reset }}>
            {children}
        </ServerErrorContext.Provider>
    );
}

export function useServerError() {
    const ctx = useContext(ServerErrorContext);
    if (!ctx) throw new Error('useServerError must be used within ServerErrorProvider');
    return ctx;
}
