import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

// Renders the login form and handles the user authentication process.
function LoginPage() {
    // State for form inputs and for displaying potential errors.
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Hooks for authentication context and programmatic navigation.
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null); // Reset error state on new submission.
        setIsLoading(true);

        // The backend's /token endpoint expects form data, not JSON.
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const data = await api.login(formData);
            
            // On success, update the global auth state with the new token.
            login(data.access_token); 
            navigate('/');

        } catch (err) {
            // Display any errors from the API to the user.
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Log In</h2>
                {/* Display the error message if it exists. */}
                {error && <p className="error-message">{error}</p>}
                {isLoading && (
                    <p className="loading-message">
                        Waking up the backend service... This may take up to 30 seconds.
                    </p>
                )}
                <div>
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Logging In...' : 'Log In'}
                </button>
                <p>
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </form>
        </div>
    );
}

export default LoginPage;