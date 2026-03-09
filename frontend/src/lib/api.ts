/**
 * API Client for ANTU CRM
 * Handles requests to the NestJS backend with authentication
 */

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = sessionStorage.getItem('antu_access_token');
    const tenantId = sessionStorage.getItem('antu_tenant_id');

    const headers = new Headers(options.headers);

    // Only set Content-Type to JSON if not already set and body is present
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (tenantId) {
        headers.set('X-Tenant-ID', tenantId);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // envía cookies httpOnly automáticamente
    });

    // Handle token expiration - try to refresh
    if (response.status === 401 && token) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            // Retry the original request with new token
            const newToken = sessionStorage.getItem('antu_access_token');
            headers.set('Authorization', `Bearer ${newToken}`);
            const retryResponse = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
                credentials: 'include',
            });
            if (!retryResponse.ok) {
                const errorData = await retryResponse.json().catch(() => ({}));
                throw new Error(errorData.message || `API Error: ${retryResponse.status}`);
            }
            return retryResponse.json();
        }
        // Refresh failed, redirect to login
        sessionStorage.clear();
        window.location.href = '/login?reason=session_expired';
        throw new Error('Session expired');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    // Handle empty responses (204 No Content)
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text);
}

async function tryRefreshToken(): Promise<boolean> {
    const refreshToken = sessionStorage.getItem('antu_refresh_token');
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
            credentials: 'include',
        });

        if (!response.ok) return false;

        const data = await response.json();
        sessionStorage.setItem('antu_access_token', data.accessToken);
        sessionStorage.setItem('antu_refresh_token', data.refreshToken);
        return true;
    } catch {
        return false;
    }
}

export const api = {
    get: <T>(endpoint: string, options?: RequestInit) =>
        apiRequest<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        }),
    put: <T>(endpoint: string, body: any, options?: RequestInit) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        }),
    patch: <T>(endpoint: string, body: any, options?: RequestInit) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body),
        }),
    delete: <T>(endpoint: string, options?: RequestInit) =>
        apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
