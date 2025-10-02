// Centralized utility for making API calls to the backend.
// This abstracts away the details of fetch, headers, and authentication.

// Use the VITE_API_BASE_URL from the .env file, with a fallback for local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// A private helper function to handle the core fetch logic.
const request = async (endpoint: string, options: RequestInit = {}, noAuth: boolean = false) => {
     // Use the URL constructor for robust URL joining, preventing double slashes.
    const url = new URL(endpoint, API_BASE_URL).href;
    
    // Default headers for all requests.
    const headers: Record<string, string> = {};

    if (options.body) {
        headers['Content-Type'] = 'application/json';
    }

    // Add the Authorization header if a token exists and the route is not public.
    if (!noAuth) {
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const config: RequestInit = {
        ...options,
        headers: { ...headers, ...options.headers },
    };

    const response = await fetch(url, config);

    // If the response is not OK, parse the error detail from the backend.
    if (!response.ok) {
        try {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Request failed with status ${response.status}`);
        } catch (e) {
            // Fallback for non-JSON error responses.
            throw new Error(`Request failed with status ${response.status}`);
        }
    }
  
    // Handle 204 No Content responses which have no body, returning null.
    if (response.status === 204) {
        return null;
    }
    
    // For successful responses, parse and return the JSON body.
    return response.json();
};

// Public API object that components will use.
export const api = {
    get: (endpoint: string) => {
        return request(endpoint, { method: 'GET' });
    },

    post: (endpoint: string, body: unknown) => {
        return request(endpoint, { 
            method: 'POST',
            body: JSON.stringify(body) 
        });
    },

    put: (endpoint: string, body: unknown) => {
        return request(endpoint, { 
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    delete: (endpoint: string) => {
        return request(endpoint, { method: 'DELETE' });
    },
    
    // The special login method now reuses the generic `request` helper.
    login: (formData: URLSearchParams) => {
        return request(
            '/token',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            },
            true
        );
    },
};