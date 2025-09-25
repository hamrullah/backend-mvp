// app/api/user/profile/route.js
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" }});
  }

  // kembalikan info user sederhana
  return new Response(JSON.stringify({ id: token.id, email: token.email, role: token.role }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
