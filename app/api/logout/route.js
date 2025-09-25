// app/api/logout/route.js
import cookie from "cookie";

export async function POST() {
  const serialized = cookie.serialize("token", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 0, path: "/" });
  return new Response(JSON.stringify({ message: "Logged out" }), { status: 200, headers: { "Set-Cookie": serialized, "Content-Type": "application/json" } });
}
