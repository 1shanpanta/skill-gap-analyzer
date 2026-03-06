import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function GET() {
  const res = await fetch(`${API_URL}/api/auth/google`, {
    redirect: "manual",
  });

  const location = res.headers.get("location");
  if (!location) {
    return NextResponse.json({ error: "OAuth redirect failed" }, { status: 500 });
  }

  const response = NextResponse.redirect(location);

  // Forward Set-Cookie headers (oauth_state) from Express to the browser
  const setCookies = res.headers.getSetCookie();
  for (const cookie of setCookies) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
}
