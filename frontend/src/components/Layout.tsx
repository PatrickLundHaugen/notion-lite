import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Provides the main layout shell for authenticated pages.
// Includes the header with navigation and a main content area.
function Layout() {
    const { logout, token } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear the auth state and redirect the user to the login page.
        logout();
        navigate('/login');
    };

    return (
        <div className="layout">
            <header className="app-header">
                <h1>Notion Lite</h1>
                {/* Conditionally render the logout button only if a user is logged in. */}
                {token && (
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
                )}
            </header>
            <main>
                {/* The <Outlet> component renders the active nested child route. */}
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;