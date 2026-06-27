// Start the GitHub OAuth flow: set a CSRF state cookie and redirect to GitHub.
import { buildCookie } from '../_lib/session.js';

const STATE_COOKIE = 'aok_oauth_state';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const state = crypto.randomUUID();
  const redirectUri = `${url.origin}/auth/callback`;

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', 'read:user');
  authorize.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': buildCookie(STATE_COOKIE, state, { maxAge: 600 }),
    },
  });
}
