import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import type { Page } from '../types';
import { api } from '../lib/api';

// Displays, edits, and deletes a single page.
function PageDetail() {
    // State for the page data and UI feedback (loading, errors).
    const [page, setPage] = useState<Page | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for managing the edit mode and form inputs.
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hooks for routing and navigation.
    const { pageId } = useParams<{ pageId: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        // Fetches the specific page's data when the component mounts or pageId changes.
        const fetchPage = async () => {
            if (!pageId) return;
            try {
                setError(null);
                setIsLoading(true);
                const data = await api.get(`/pages/${pageId}`) as Page;
                setPage(data);
                // Pre-fill the edit form fields with the fetched data.
                setEditTitle(data.title);
                setEditContent(data.content);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch page');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPage();
    }, [pageId]);

    const handleUpdate = async (event: FormEvent) => {
        event.preventDefault();
        if (!pageId) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const updatedPage = await api.put(`/pages/${pageId}`, {
                title: editTitle,
                content: editContent,
            }) as Page;
            setPage(updatedPage); // Update the view with the newly saved data.
            setIsEditing(false);  // Exit edit mode on success.
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async () => {
        if (!pageId) return;
        if (!window.confirm('Are you sure you want to delete this page?')) return;

        try {
            await api.delete(`/pages/${pageId}`);
            navigate('/'); // Navigate home on successful deletion.
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete page');
            console.error(err);
        }
    };

    const handleCancelEdit = () => {
        // Revert any changes made in the form and exit edit mode.
        if (page) {
            setEditTitle(page.title);
            setEditContent(page.content);
        }
        setIsEditing(false);
    };
    
    if (isLoading) return <div>Loading page...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;
    if (!page) return <div>Page not found.</div>; // Handle case where page is null after loading.

    return (
        <div className="page-detail-container">
            <div className="page-actions">
                <Link to="/">&larr; Back to list</Link>
                <div>
                    {isEditing ? (
                        <button onClick={handleCancelEdit} disabled={isSubmitting}>Cancel</button>
                    ) : (
                        <button onClick={() => setIsEditing(true)}>Edit</button>
                    )}
                    <button onClick={handleDelete} className="delete-button">Delete</button>
                </div>
            </div>
            
            {error && <p className="error-message form-error">{error}</p>}

            {isEditing ? (
                <form onSubmit={handleUpdate} className="page-form">
                    <div className="form-group">
                        <label htmlFor="edit-title">Title</label>
                        <input
                        id="edit-title"
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-content">Content</label>
                        <textarea
                        id="edit-content"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={20}
                        disabled={isSubmitting}
                        />
                    </div>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            ) : (
                <article className="page-view">
                    <h1>{page.title}</h1>
                    <div className="page-content">
                        <ReactMarkdown>{page.content}</ReactMarkdown>
                    </div>
                </article>
            )}
        </div>
    );
}

export default PageDetail;