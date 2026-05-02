import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const roleLabel = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? user.role : '';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner container">
                <NavLink to="/" className="navbar-logo">
                    <span className="logo-icon">◉</span>
                    <span className="logo-text">BaroLab</span>
                </NavLink>

                <div className="navbar-links">
                    <NavLink to="/mods" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Mods
                    </NavLink>
                    <NavLink to="/submarines" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Submarines
                    </NavLink>
                    <NavLink to="/guides" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Guides
                    </NavLink>
                    <NavLink to="/tags" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Tags
                    </NavLink>
                    <NavLink to="/load-order" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Load Order
                    </NavLink>
                    <NavLink to="/encyclopedia" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Encyclopedia
                    </NavLink>
                    {isAdmin && (
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => `nav-link nav-link-admin ${isActive ? 'active' : ''}`}
                        >
                            ⚙ Admin
                        </NavLink>
                    )}
                </div>

                <div className="navbar-user">
                    {user ? (
                        <>
                            {user.username && <span className="user-name-badge">@{user.username}</span>}
                            {roleLabel && <span className="user-role-badge">{roleLabel}</span>}
                            <button className="btn btn-ghost btn-sm navbar-logout" onClick={handleLogout}>
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="btn btn-ghost btn-sm navbar-auth-link">
                                Log in
                            </NavLink>
                            <NavLink to="/sign-up" className="btn btn-primary btn-sm">
                                Sign up
                            </NavLink>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
