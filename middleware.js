import { NextResponse } from "next/server";

// Sesuaikan di Vercel Project Settings → Environment Variables
// FRONTEND_ORIGIN=https://frontend-mvp-phi.vercel.app
// FRONTEND_ORIGIN_LOCAL=http://localhost:3001
const WHITELIST = [process.env.FRONTEND_ORIGIN, process.env.FRONTEND_ORIGIN_LOCAL].filter(Boolean);

function pickAllowOrigin(origin) {
  if (origin && WHITELIST.includes(origin)) return origin;
  return process.env.FRONTEND_ORIGIN || "*";
}

export const config = {
  matcher: ["/api/:path*"], // hanya intercept route API
};

export function middleware(req) {
  const origin = req.headers.get("origin");
  const allowOrigin = pickAllowOrigin(origin);

  const headers = new Headers({
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
    "Access-Control-Max-Age": "86400",
  });

  // Jika pakai cookie/session, wajib origin spesifik (bukan "*") + credentials
  if (allowOrigin !== "*") {
    headers.set("Access-Control-Allow-Credentials", "true");
  } else {
    headers.delete("Access-Control-Allow-Credentials");
  }

  // Preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  // Response normal
  const res = NextResponse.next();
  for (const [k, v] of headers.entries()) res.headers.set(k, v);
  return res;
}
