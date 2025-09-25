import { NextResponse } from "next/server";

// const ALLOWED = ["http://localhost:3001"];
const ALLOWED = ["https://frontend-mvp-phi.vercel.app", "http://localhost:3001"];

export function middleware(req) {
  const origin = req.headers.get("origin");
  const res = NextResponse.next();

  if (origin && ALLOWED.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }
  return res;
}

export const config = { matcher: ["/api/:path*"] };
