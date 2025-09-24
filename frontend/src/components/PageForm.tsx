import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

// Provides a form for creating a new page.
function PageForm() {
    // State for the controlled form inputs.
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    // State to manage UI feedback during form submission.
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const navigate = useNavigate();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
        // Use the API utility to create the page.
        await api.post('/pages', { title, content });

        // On success, navigate back to the homepage.
        navigate('/');

        } catch (err) {
        // Set error state to display a message to the user.
        setError(err instanceof Error ? err.message : 'Failed to create page');
        console.error(err);
        } finally {
        // Ensure the submitting state is reset regardless of outcome.
        setIsSubmitting(false);
        }
    };

    return (
        <div className="page-form-container">
            <form onSubmit={handleSubmit} className="page-form">
                <div className="page-form-header">
                    <h2>Create New Page</h2>
                    <Link to="/" className="button-style-secondary">Cancel</Link>
                </div>
                
                {error && <p className="error-message">{error}</p>}

                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        disabled={isSubmitting} // Disable input while submitting.
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="content">Content (Markdown)</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={15}
                        required
                        disabled={isSubmitting} // Disable input while submitting.
                    />
                </div>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Page'}
                </button>
            </form>
        </div>
    );
}

export default PageForm;