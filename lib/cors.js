export function buildCorsHeaders(req, { allowCredentials = true } = {}) {
  const origin = req.headers.get("origin");
  const whitelist = [
    process.env.FRONTEND_ORIGIN,
    process.env.FRONTEND_ORIGIN_LOCAL,
  ].filter(Boolean);

  // pilih origin yang match, fallback ke FRONTEND_ORIGIN
  const allowOrigin = whitelist.includes(origin)
    ? origin
    : process.env.FRONTEND_ORIGIN || "*";

  const headers = {
    "Access-Control-Allow-Origin": allowCredentials && allowOrigin === "*"
      ? "" // kredensial tidak boleh pakai "*"
      : allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
    "Access-Control-Max-Age": "86400",
  };

  if (allowCredentials && allowOrigin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  // jika pakai "*", hapus credentials header
  if (allowOrigin === "*") {
    delete headers["Access-Control-Allow-Credentials"];
  }

  return headers;
}
