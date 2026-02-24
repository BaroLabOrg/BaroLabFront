import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import PostsPage from './pages/PostsPage';
import PostDetailPage from './pages/PostDetailPage';
import AdminPage from './pages/AdminPage';
import ModsListPage from './pages/ModsListPage';
import ModPage from './pages/ModPage';

export default function App() {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <Navbar />
            <Routes>
                {/* Public */}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
                />
                <Route
                    path="/sign-up"
                    element={isAuthenticated ? <Navigate to="/" replace /> : <SignUpPage />}
                />

                {/* Protected / Public Mix */}
                <Route
                    path="/"
                    element={<PostsPage />}
                />
                <Route
                    path="/post/:postId"
                    element={<PostDetailPage />}
                />

                {/* Mods */}
                <Route
                    path="/mods"
                    element={<ModsListPage />}
                />
                <Route
                    path="/mod/:externalId"
                    element={<ModPage />}
                />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute adminOnly>
                            <AdminPage />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
            </Routes>
        </>
    );
}
