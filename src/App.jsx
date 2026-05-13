import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useServerError } from './context/ServerErrorContext';
import { QuestProvider, useQuest } from './context/QuestContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ItemInspectModal from './components/quest/ItemInspectModal';
import QuestTerminal from './components/quest/QuestTerminal';

// Guard: /promise is only accessible when all 3 items are collected (stage >= 3)
function QuestRoute({ children }) {
    const { stage } = useQuest();
    if (stage < 3) return <Navigate to="/" replace />;
    return children;
}

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
const VanillaDataPage = lazy(() => import('./pages/VanillaDataPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ForbiddenPage = lazy(() => import('./pages/ForbiddenPage'));
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage'));
const PromisePage = lazy(() => import('./pages/PromisePage'));

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
    const { serverDown } = useServerError();

    // If server is completely down, show error page instead of routes
    if (serverDown) {
        return (
            <Suspense fallback={<RouteFallback />}>
                <ServerErrorPage />
            </Suspense>
        );
    }

    return (
        <QuestProvider>
            <Navbar />
            {/* Global quest modals — rendered outside Routes so they persist across navigation */}
            <ItemInspectModal />
            <QuestTerminal />
            <Suspense fallback={<RouteFallback />}>
                <Routes>
                    {/* Secret quest ending — only accessible with all 3 items collected */}
                    <Route path="/promise" element={<QuestRoute><PromisePage /></QuestRoute>} />

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
                        path="/vanilla"
                        element={<VanillaDataPage />}
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

                    {/* About */}
                    <Route path="/about" element={<AboutPage />} />

                    {/* Error pages — for preview/testing */}
                    <Route path="/403" element={<ForbiddenPage />} />
                    <Route path="/500" element={<ServerErrorPage />} />

                    {/* Fallback — 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </QuestProvider>
    );
}
