import { auth } from "@/components/auth/utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Check if we're likely offline (simple heuristic)
function isLikelyOffline(): boolean {
  return !navigator.onLine;
}

const request = async (endpoint: string, options: RequestInit = {}) => {
  const url = new URL(endpoint, API_BASE_URL).href;

  const headers: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  const isPublicRoute = endpoint === "/auth/token" || endpoint === "/auth/register";

  if (!isPublicRoute) {
    const token = auth.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = { ...options, headers };
  
  // If we're likely offline and this is a read operation, throw immediately
  // This allows offline-aware wrappers to catch and use IndexedDB
  if (isLikelyOffline() && options.method === undefined) {
    throw new Error('Offline - using cached data');
  }
  
  let response: Response;
  
  try {
    response = await fetch(url, config);
  } catch (fetchError) {
    // Network error - likely offline or backend down
    if (!isPublicRoute) {
      // For authenticated routes, throw to trigger offline fallback
      throw new Error('Network unavailable - using offline mode');
    }
    // For public routes (login/register), show the actual error
    throw fetchError;
  }

  if (!response.ok && response.status === 401 && !isPublicRoute) {
    console.log("Access token expired. Attempting to refresh...");
    try {
      const refreshResponse = await fetch(new URL("/auth/token/refresh", API_BASE_URL).href, {
        method: "POST",
        credentials: "include",
      });

      if (!refreshResponse.ok) {
        throw new Error("Session expired. Please log in again.");
      }

      const { access_token: newAccessToken } = await refreshResponse.json();
      console.log("Token refreshed successfully.");
      auth.setToken(newAccessToken);

      headers["Authorization"] = `Bearer ${newAccessToken}`;
      const retryConfig = { ...config, headers };
      console.log("Retrying original request...");
      response = await fetch(url, retryConfig);
    } catch (refreshError) {
      console.error("Refresh failed:", refreshError);
      auth.logout();
      window.location.href = "/login?sessionExpired=true";
      return new Promise(() => {});
    }
  }

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    } catch (e) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }

  if (response.status === 204) return null;
  return response.json();
};

export const api = {
  get: (endpoint: string) => request(endpoint),
  post: (endpoint: string, body: unknown) =>
    request(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  put: (endpoint: string, body: unknown) =>
    request(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  patch: (endpoint: string, body: unknown) =>
    request(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  delete: (endpoint: string) => request(endpoint, { method: "DELETE" }),
  login: (formData: URLSearchParams) =>
    request("/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    }),
};