// app/api/admin/route.js
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const payload = verifyToken(token);
    if (payload.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403 });

    return new Response(JSON.stringify({ message: "Halo Admin", user: payload }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Invalid token" }), { status: 403 });
  }
}
