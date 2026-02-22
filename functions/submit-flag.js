// SHA-256 hashes of valid flags, keyed by day number
const FLAG_HASHES = {
  0: '225840fef30125024efb75a3dee9d054dc23deb7f5cee632a75252337f795e18',
  1: '32c1012bb9a9c6b1dcd21bf9e6e78a05aaa201eda110e958908f5cdecd9b9317',
  2: '0d91a360ae0f4a3e11c28f6db96ff10dc29a7e0e5f8bafaa6a14472b6961a826',
  3: 'a0440a763fbd9cc4de34e9245f9ec0840449afd3cfdd9493b988fd4c636c3d8d',
  4: '54ab235edd9d3c53a882665d54308b0eb90d078f027797a9cee8424fea98143d',
  5: '5629ebc1e04418970d237dd69df2ad81797cdc35087357879d3ed8a433bc0e4e',
  6: '78b10c3f6c1040d28782d9761ab28cf0cb3f240d8c4eb03e8e8ca8b65109a23b',
  7: '85a040e670c7fa404628d5ea8fe7d5fbf582f9dcd501eebc4e3025fc41c28f0b',
  8: '57d08d666f9ccf05e1ec23ef83719b85c27e28c72500bd57ca3eaa9f487f1224',
  9: '42107fc241bc8ec3883f137bc3840cae4b1280bdecd677be98fd32d7c2e6c008',
  10: '066bc9777974a3af3d9deb1beaf96d43e6b4d184253cb58eaac83c333a531a44',
  11: '49e0035adeb7fdd1d36c4e8183bc38897da95415e5f19418af277607e4d73e24',
  12: '1463a749773ed54b90300bdeaa97241e537dc84d8f9b3898decaf966122665b2',
  13: 'df2ea19e39166c0ea3fa48ddec702215e2a077245c65301c5904a36cb4daa580',
  14: 'a96e749b5fa79392ee39c9648dd5dcf054aee9a24ee6437e010bf806f8d32019',
  15: '0a99d9a2b405e9512ad171339b454415739bea73de610cb6bddf9b95890de1a2',
  16: '339b5b9e257354a8cd87302b6905c91cf7c1974d5a95c518f1a957365049e959',
  17: '07461bed4d8f32c1e60d7a34f36f7e1650595440ba819d73248e2e7caed857c5',
  18: '452c45b3d82f478ca254e331bc1e59083a8a9a5cce38bb51086eba18886ae3d7',
  19: '074dbad7c7bdaf664992daafd340d3937ae9a3d9a081b38a85c530245cfa4ee0',
  20: 'd343163ded2d0585daea10cb6226d56e06812537969b4c004e40d19483af5293',
  21: 'caef9c654e06a53987e52e1eba02a38ecb543cd10c88d27287460d6c470edd84',
  22: '601d72ebe7744ffc429562eb05f585a1b72f65ffef0c3d01cb836b25991221be',
  23: 'e888e89997e46deb71c4a61205a2fa03dba6ccda40fd7ce6bf9a2848bf264165',
  24: '3f50ffc39ffdfc130953c5c70a31033ef4ecb34641758b03933f2931f5a758d7',
  25: '5f3ed1402387d339eabcea9fe4b8d8745e5b74db497ad1669e45bea59bc7df20',
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
