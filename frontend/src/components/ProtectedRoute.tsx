import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/components/auth/context/useAuth';

// This component acts as a gatekeeper for routes that require authentication.
function ProtectedRoute() {
    const { token } = useAuth();

    // If the user is not authenticated (no token), redirect them to the login page.
    // The `replace` prop prevents the user from navigating back to the protected route.
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If the user is authenticated, render the nested child route via the <Outlet />.
    return <Outlet />;
}

export default ProtectedRoute;