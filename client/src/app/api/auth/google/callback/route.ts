import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code") || "";
  const state = searchParams.get("state") || "";

  // Forward the browser's cookies (including oauth_state) to Express
  const cookieHeader = req.headers.get("cookie") || "";

  const url = new URL("/api/auth/google/callback", API_URL);
  url.searchParams.set("code", code);
  url.searchParams.set("state", state);

  const res = await fetch(url.toString(), {
    redirect: "manual",
    headers: { cookie: cookieHeader },
  });

  const location = res.headers.get("location");
  if (!location) {
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", req.url));
  }

  const response = NextResponse.redirect(location);

  // Forward Set-Cookie headers (auth_token, clear oauth_state) from Express to the browser
  const setCookies = res.headers.getSetCookie();
  for (const cookie of setCookies) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
}
