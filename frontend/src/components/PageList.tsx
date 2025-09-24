import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../lib/api';
import type { Page } from '../types';

// Displays a list of all pages belonging to the authenticated user.
function PageList() {
    // State to hold the array of pages fetched from the API.
    const [pages, setPages] = useState<Page[]>([]);
    // State to handle loading and error UI feedback.
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetches the user's pages when the component mounts.
        const fetchPages = async () => {
        try {
            setError(null);
            setIsLoading(true);
            const data = await api.get('/pages') as Page[];
            setPages(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch pages');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
        };
        fetchPages();
    }, []); // The empty dependency array ensures this runs only once.

    if (isLoading) {
        return <div>Loading pages...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return (
        <div className="page-list-container">
            <div className="page-list-header">
                <h1>My Pages</h1>
                <Link to="/pages/new" className="button-style">
                + New Page
                </Link>
            </div>

            {pages.length > 0 ? (
                <ul className="page-list">
                {pages.map(page => (
                    <li key={page.id}>
                        <Link to={`/pages/${page.id}`}>{page.title}</Link>
                    </li>
                ))}
                </ul>
            ) : (
                <p>You haven't created any pages yet. Click "New Page" to start!</p>
            )}
        </div>
    );
}

export default PageList;