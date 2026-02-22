/**
 * Authenticated fetch wrapper.
 *
 * - Reads the JWT from localStorage and injects it as a Bearer token.
 * - On a 401 response, clears stored auth data and redirects to /login.
 * - Passes all other options through to the native fetch API.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  // DEV BYPASS: skip real API calls when using the dev token
  if (token === "dev-bypass-token") {
    return new Response(JSON.stringify({ analyses: [], total: 0, page: 1, limit: 10 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Default to JSON content type for requests with a body
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const message = retryAfter
      ? `Rate limited. Please try again in ${retryAfter} seconds.`
      : "Too many requests. Please slow down.";
    throw new Error(message);
  }

  return response;
}
