// Centralized utility for making API calls to the backend.
// This abstracts away the details of fetch, headers, and authentication.

// Use the VITE_API_BASE_URL from the .env file, with a fallback for local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// A private helper function to handle the core fetch logic.
const request = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    
    // Default headers for all requests.
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    // Add the Authorization header if a token exists.
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge default options with any custom options passed in.
    const config: RequestInit = {
        ...options,
        headers: { ...headers, ...options.headers },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // If the response is not OK, parse the error detail from the backend.
    if (!response.ok) {
        // Handle cases where the response body might not be JSON.
        try {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Request failed with status ${response.status}`);
        } catch (e) {
            throw new Error(`Request failed with status ${response.status}`);
        }
    }
  
    // If the response is OK, parse and return the JSON body.
    // Handle 204 No Content responses which have no body.
    if (response.status === 204) {
        return null;
    }
    return response.json();
};

// Public API object that components will use.
export const api = {
    get: (endpoint: string) => {
        return request(endpoint, { method: 'GET' });
    },

    post: (endpoint: string, body: unknown) => {
        return request(endpoint, { method: 'POST', body: JSON.stringify(body) });
    },

    put: (endpoint: string, body: unknown) => {
        return request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
    },

    delete: (endpoint: string) => {
        return request(endpoint, { method: 'DELETE' });
    },
    
    // Special method for the token endpoint which uses form data
    async login(formData: URLSearchParams) {
        // We don't use the main `request` helper here because the content type and body are different.
        const response = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
        }

        return response.json();
    },
};