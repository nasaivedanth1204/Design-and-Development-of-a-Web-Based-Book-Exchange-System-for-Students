// Small wrapper around fetch for talking to the Express REST API.
// In development Vite proxies /api to http://localhost:4000 (see vite.config.js).
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details ?? {};
  }
}

async function request(path, { method = 'GET', body, query } = {}) {
  let url = `${API_BASE}/api${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') params.set(key, value);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const options = { method, headers: { Accept: 'application/json' } };
  if (body instanceof FormData) {
    options.body = body; // browser sets the multipart boundary itself
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running (npm run dev)?', 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const fallback = response.status >= 500
      ? 'The server ran into a problem. Please try again.'
      : `Request failed (${response.status}).`;
    throw new ApiError(data?.error ?? fallback, response.status, data?.details);
  }
  return data;
}

export const api = {
  meta: () => request('/meta'),

  listBooks: (filters) => request('/books', { query: filters }),
  getBook: (id) => request(`/books/${id}`),
  ownerBooks: (ownerId) => request(`/books/owner/${encodeURIComponent(ownerId)}`),
  createBook: (formData) => request('/books', { method: 'POST', body: formData }),
  updateBook: (id, formData) => request(`/books/${id}`, { method: 'PUT', body: formData }),
  deleteBook: (id, actorId) => request(`/books/${id}`, { method: 'DELETE', query: { actorId } }),

  createRequest: (payload) => request('/requests', { method: 'POST', body: payload }),
  incomingRequests: (ownerId) => request(`/requests/incoming/${encodeURIComponent(ownerId)}`),
  outgoingRequests: (requesterId) => request(`/requests/outgoing/${encodeURIComponent(requesterId)}`),
  updateRequestStatus: (id, status, actorId) =>
    request(`/requests/${id}/status`, { method: 'PATCH', body: { status, actorId } }),
};
