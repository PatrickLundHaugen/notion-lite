import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

// Renders the login form and handles the user authentication process.
function LoginPage() {
    // State for form inputs and for displaying potential errors.
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // Hooks for authentication context and programmatic navigation.
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null); // Reset error state on new submission.

        // The backend's /token endpoint expects form data, not JSON.
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        try {
            // Use the dedicated API utility for logging in.
            const data = await api.login(formData);
            
            // On success, update the global auth state with the new token.
            login(data.access_token); 
            
            // Redirect the user to the homepage.
            navigate('/');

        } catch (err) {
            // Display any errors from the API to the user.
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    return (
        <div className="auth-page">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Log In</h2>
                {/* Display the error message if it exists. */}
                {error && <p className="error-message">{error}</p>}
                <div>
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
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
                    />
                </div>
                <button type="submit">Log In</button>
                <p>
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </form>
        </div>
    );
}

export default LoginPage;