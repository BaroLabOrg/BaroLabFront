import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner container">
                <NavLink to="/mods" className="navbar-logo">
                    <span className="logo-icon">◊</span>
                    <span className="logo-text">BaroLab</span>
                </NavLink>

                <div className="navbar-links">
                    <NavLink to="/mods" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Моды
                    </NavLink>
                    <NavLink to="/submarines" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Подлодки
                    </NavLink>
                    <NavLink to="/guides" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Руководства
                    </NavLink>
                    <NavLink to="/tags" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Теги
                    </NavLink>
                    <NavLink to="/encyclopedia" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Энциклопедия
                    </NavLink>
                    {isAdmin && (
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => `nav-link nav-link-admin ${isActive ? 'active' : ''}`}
                        >
                            ⚙ Админ
                        </NavLink>
                    )}
                </div>

                <div className="navbar-user">
                    {user ? (
                        <>
                            {user.username && <span className="user-name-badge" style={{ marginRight: 8 }}>@{user.username}</span>}
                            <span className="user-role-badge">{user.role}</span>
                            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                                Выйти
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="btn btn-ghost btn-sm" style={{ marginRight: 8 }}>
                                Войти
                            </NavLink>
                            <NavLink to="/sign-up" className="btn btn-primary btn-sm">
                                Регистрация
                            </NavLink>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

