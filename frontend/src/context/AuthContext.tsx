import { createContext, useState, useContext, type ReactNode, useEffect } from 'react';

// Defines the shape of the data and functions that the context will provide.
interface AuthContextType {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
}

// Create the context with an initial value of undefined.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode; // Represents the child components that this provider will wrap.
}

// The AuthProvider component makes the auth state available to its children.
export function AuthProvider({ children }: AuthProviderProps) {
    // Initialize state by reading the token from localStorage for session persistence.
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));

    // An effect that syncs the token state with localStorage whenever it changes.
    useEffect(() => {
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }, [token]);

    // Function to update the token state upon successful login.
    const login = (newToken: string) => {
        setToken(newToken);
    };

    // Function to clear the token state upon logout.
    const logout = () => {
        setToken(null);
    };

    // The value object that will be passed down to consuming components.
    const value = { token, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook for consuming the AuthContext easily in other components.
export function useAuth() {
    const context = useContext(AuthContext);
    // This error ensures the hook is used within a component tree wrapped by AuthProvider.
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}