// SHA-256 hashes of valid flags, keyed by day number
const FLAG_HASHES = {
  0: '1c015e563e5e30188378f8516b89cfa5c6c14ba00f9efd5a878a570e383e2e03',
  1: 'd88ee18014da63147665ad1455bada2141eb3ba3bbb11051053a74ab2e3aa5c7',
  2: '8c857417f96462d860c62550a7741cbfcb5f97c2b68ddb09bc5fc8332e43ddab',
  6: '3d9822e477d0414cc8c153847fbb667394143b9301c816e2b9eb0efb8bb737e4',
};

async function hashFlag(flag) {
  const encoder = new TextEncoder();
  const data = encoder.encode(flag);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  const SUPABASE_URL = context.env.SUPABASE_URL;
  const SUPABASE_SECRET_KEY = context.env.SUPABASE_SECRET_KEY;

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { day, flag, elapsed_ms, access_token } = body;

  if (typeof day !== 'number' || day < 0 || day > 25) {
    return Response.json({ error: 'Invalid day' }, { status: 400 });
  }
  if (typeof flag !== 'string' || !flag) {
    return Response.json({ error: 'Missing flag' }, { status: 400 });
  }
  if (typeof elapsed_ms !== 'number' || elapsed_ms <= 0) {
    return Response.json({ error: 'Invalid elapsed_ms' }, { status: 400 });
  }
  if (typeof access_token !== 'string' || !access_token) {
    return Response.json({ error: 'Missing access_token' }, { status: 400 });
  }

  // Verify the flag
  const hash = await hashFlag(flag);
  const expectedHash = FLAG_HASHES[day];
  if (!expectedHash || hash !== expectedHash) {
    return Response.json({ error: 'Invalid flag' }, { status: 400 });
  }

  // Verify the JWT with Supabase to get user ID
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      apikey: SUPABASE_SECRET_KEY,
    },
  });

  if (!userRes.ok) {
    return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const user = await userRes.json();
  const userId = user.id;

  // Call the upsert_submission RPC (secret key in apikey header only, not Authorization)
  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_submission`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SECRET_KEY,
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      p_user_id: userId,
      p_day: day,
      p_elapsed_ms: elapsed_ms,
    }),
  });

  if (!rpcRes.ok) {
    const err = await rpcRes.text();
    console.error('upsert_submission failed:', err);
    return Response.json({ error: 'Failed to record submission' }, { status: 500 });
  }

  const result = await rpcRes.json();
  return Response.json({ recorded: true, ...result });
}
