/**
 * API client wrapper with auth handling and error management.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler;
}

export async function apiCall<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const url = path.startsWith('/') ? path : `/${path}`;
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      onUnauthorized?.();
      return { success: false, error: 'Authentication required' };
    }

    const json = await response.json();
    return json as ApiResponse<T>;
  } catch (error) {
    console.error('[API] Request failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function apiGet<T = any>(path: string): Promise<ApiResponse<T>> {
  return apiCall<T>(path);
}

export async function apiPost<T = any>(path: string, body: any): Promise<ApiResponse<T>> {
  return apiCall<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiPut<T = any>(path: string, body: any): Promise<ApiResponse<T>> {
  return apiCall<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T = any>(path: string): Promise<ApiResponse<T>> {
  return apiCall<T>(path, { method: 'DELETE' });
}
