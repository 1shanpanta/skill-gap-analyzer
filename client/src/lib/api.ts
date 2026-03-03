/**
 * Authenticated fetch wrapper.
 *
 * - Uses httpOnly cookie for auth (sent automatically with credentials: 'include').
 * - On a 401 response, redirects to /login.
 * - Passes all other options through to the native fetch API.
 * - Adds a 30s timeout via AbortController.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  // Default to JSON content type for requests with a body
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // 30s client-side timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(input, {
      ...init,
      headers,
      credentials: "include",
      signal: init?.signal ?? controller.signal,
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        // Clear any legacy localStorage auth data
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/login";
      }
    }

    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
