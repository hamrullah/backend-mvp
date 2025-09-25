// app/api/login/route.js
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

export async function POST(req) {
  try {
    const { email, password, useCookie } = await req.json();
    if (!email || !password) return new Response(JSON.stringify({ error: "Email & password wajib" }), { status: 400 });

    const result = await pool.query("SELECT id, email, password, role FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: EXPIRES_IN });

    if (useCookie) {
      const serialized = cookie.serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60,
        path: "/",
      });
      return new Response(JSON.stringify({ message: "Login sukses (cookie)" }), {
        status: 200,
        headers: { "Set-Cookie": serialized, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ token }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
