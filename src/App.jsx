import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';

import AdminPage from './pages/AdminPage';
import ModsListPage from './pages/ModsListPage';
import ModPage from './pages/ModPage';
import ModGuidePage from './pages/ModGuidePage';
import GuidesListPage from './pages/GuidesListPage';
import ModGuideEditor from './pages/ModGuideEditor';
import TagsPage from './pages/TagsPage';

export default function App() {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <Navbar />
            <Routes>
                {/* Public */}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/mods" replace /> : <LoginPage />}
                />
                <Route
                    path="/sign-up"
                    element={isAuthenticated ? <Navigate to="/mods" replace /> : <SignUpPage />}
                />

                {/* Protected / Public Mix */}
                <Route
                    path="/"
                    element={<Navigate to="/mods" replace />}
                />

                {/* Mods */}
                <Route
                    path="/mods"
                    element={<ModsListPage />}
                />
                <Route
                    path="/guides"
                    element={<GuidesListPage />}
                />
                <Route
                    path="/tags"
                    element={<TagsPage />}
                />
                <Route
                    path="/mod/:externalId"
                    element={<ModPage />}
                />
                <Route
                    path="/mod/:id/guides/:guideId"
                    element={<ModGuidePage />}
                />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute adminOnly>
                            <AdminPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/mod/:id/guides/new"
                    element={
                        <ProtectedRoute>
                            <ModGuideEditor />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/mod/:id/guides/:guideId/edit"
                    element={
                        <ProtectedRoute>
                            <ModGuideEditor />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to={isAuthenticated ? '/mods' : '/login'} replace />} />
            </Routes>
        </>
    );
}
