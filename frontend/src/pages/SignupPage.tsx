import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

// Renders the registration form and handles new user creation.
function SignupPage() {
    // State for form inputs and for displaying potential errors.
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // Hook for programmatic navigation.
    const navigate = useNavigate();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null); // Reset error state on new submission.

        try {
            // Use our centralized API utility to create a new user.
            await api.post('/users', { username, password });

            // On successful signup, redirect the user to the login page.
            alert('Signup successful! Please log in.'); // Provide user feedback.
            navigate('/login');

        } catch (err) {
            // Display any errors from the API (e.g., "Username already registered").
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
    };

    return (
        <div className="auth-page">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Sign Up</h2>
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
                <button type="submit">Sign Up</button>
                <p>
                Already have an account? <Link to="/login">Log In</Link>
                </p>
            </form>
        </div>
    );
}

export default SignupPage;