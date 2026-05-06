import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ServerErrorProvider } from './context/ServerErrorContext';
import './index.css';

const googleClientId = '791044957414-tb2r70umf9i8eo4agirdcu1dkktht1lk.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={googleClientId}>
            <BrowserRouter>
                <ServerErrorProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </ServerErrorProvider>
            </BrowserRouter>
        </GoogleOAuthProvider>
    </React.StrictMode>
);
