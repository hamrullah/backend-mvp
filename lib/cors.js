export function withCORS(req, res) {
  const origin = req.headers.get("origin")
  const allowed = (process.env.CORS_ORIGIN || "*").split(",").map(s => s.trim())

  if (allowed.includes("*")) {
    res.headers.set("Access-Control-Allow-Origin", "*")
    res.headers.set("Access-Control-Allow-Credentials", "false")
  } else if (origin && allowed.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin)
    res.headers.set("Access-Control-Allow-Credentials", "true")
  }

  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.headers.set("Vary", "Origin")
  return res
}

export function preflight(req) {
  const res = new Response(null, { status: 204 })
  return withCORS(req, res)
}
