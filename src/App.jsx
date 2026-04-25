import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ModsListPage = lazy(() => import('./pages/ModsListPage'));
const ModPage = lazy(() => import('./pages/ModPage'));
const SubmarinesListPage = lazy(() => import('./pages/SubmarinesListPage'));
const SubmarinePage = lazy(() => import('./pages/SubmarinePage'));
const ModGuidePage = lazy(() => import('./pages/ModGuidePage'));
const GuidesListPage = lazy(() => import('./pages/GuidesListPage'));
const ModGuideEditor = lazy(() => import('./pages/ModGuideEditor'));
const TagsPage = lazy(() => import('./pages/TagsPage'));
const LoadOrderPage = lazy(() => import('./pages/LoadOrderPage'));
const EncyclopediaListPage = lazy(() => import('./pages/EncyclopediaListPage'));
const EncyclopediaDetailPage = lazy(() => import('./pages/EncyclopediaDetailPage'));
const EncyclopediaEditorPage = lazy(() => import('./pages/EncyclopediaEditorPage'));

function RouteFallback() {
    return (
        <div className="page">
            <main className="container">
                <p>Loading page...</p>
            </main>
        </div>
    );
}

export default function App() {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <Navbar />
            <Suspense fallback={<RouteFallback />}>
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

                    {/* Home */}
                    <Route
                        path="/"
                        element={<HomePage />}
                    />

                    {/* Mods */}
                    <Route
                        path="/mods"
                        element={<ModsListPage />}
                    />
                    <Route
                        path="/submarines"
                        element={<SubmarinesListPage />}
                    />
                    <Route
                        path="/submarines/:externalId"
                        element={<SubmarinePage />}
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
                        path="/load-order"
                        element={<LoadOrderPage />}
                    />
                    <Route
                        path="/encyclopedia"
                        element={<EncyclopediaListPage />}
                    />
                    <Route
                        path="/encyclopedia/:slug"
                        element={<EncyclopediaDetailPage />}
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
                    <Route
                        path="/admin/encyclopedia/new"
                        element={(
                            <ProtectedRoute adminOnly>
                                <EncyclopediaEditorPage />
                            </ProtectedRoute>
                        )}
                    />
                    <Route
                        path="/admin/encyclopedia/:id/edit"
                        element={(
                            <ProtectedRoute adminOnly>
                                <EncyclopediaEditorPage />
                            </ProtectedRoute>
                        )}
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to={isAuthenticated ? '/mods' : '/login'} replace />} />
                </Routes>
            </Suspense>
        </>
    );
}
