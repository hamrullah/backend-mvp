// app/api/admin/route.js
export async function GET() {
  return new Response(JSON.stringify({ message: "Halo Admin 👋" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
