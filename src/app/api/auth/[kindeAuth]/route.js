import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

const kindeAuthHandler = handleAuth();

export async function GET(request, context) {
  const { pathname } = new URL(request.url);
  const hasAccessToken = request.headers
    .get("cookie")
    ?.split(";")
    .some((cookie) => cookie.trim().startsWith("access_token="));

  // Kinde's setup handler calls getUser(), which throws when no session cookie
  // exists. Its browser client expects 401 for this unauthenticated state.
  if (pathname === "/api/auth/setup" && !hasAccessToken) {
    return Response.json({ error: "Log in with Kinde" }, { status: 401 });
  }

  return kindeAuthHandler(request, context);
}
