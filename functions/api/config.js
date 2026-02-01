// Serves public Supabase config from Cloudflare Pages env vars.
// Set SUPABASE_URL and SUPABASE_ANON_KEY in Pages > Settings > Environment variables.
export async function onRequestGet(context) {
  return Response.json({
    supabaseUrl: context.env.SUPABASE_URL,
    supabaseAnonKey: context.env.SUPABASE_ANON_KEY,
  }, {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
