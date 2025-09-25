// app/api/register/route.js
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req) {
  try {
    const { email, password, role } = await req.json();
    if (!email || !password) return new Response(JSON.stringify({ error: "Email & password wajib" }), { status: 400 });

    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length) return new Response(JSON.stringify({ error: "Email sudah terdaftar" }), { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const res = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at",
      [email, hashed, role || "user"]
    );

    return new Response(JSON.stringify({ message: "User dibuat", user: res.rows[0] }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
