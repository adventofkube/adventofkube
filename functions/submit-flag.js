// SHA-256 hashes of valid flags, keyed by day number
const FLAG_HASHES = {
  0: '1c015e563e5e30188378f8516b89cfa5c6c14ba00f9efd5a878a570e383e2e03',
  1: 'd88ee18014da63147665ad1455bada2141eb3ba3bbb11051053a74ab2e3aa5c7',
  2: '5b43f80414de6df30a6ae54f681052e5c5e35cb9cfa57cc24f169422fb315003',
  3: 'bc64f86e6a230e279ff0a5e095a48e52d1e234525b748e64f27c1680913cdf12',
  4: 'f42b4a89a4b7f81ddd3d30e30746e6d6fca8a5819c7dd3c4309a0c4adf0b310d',
  5: 'db755eb20ac5651ce8080506b9dab20b81b1af45a52112e67cd13a2c755b0a87',
  6: '3d9822e477d0414cc8c153847fbb667394143b9301c816e2b9eb0efb8bb737e4',
  7: '3d3d1fb274ca5d09414bb2b2f9fcf8a663de10cdaffdd880e91980a3d50b817a',
  8: 'f3488d3f7b71217101c6d22e81016d4c1fabdacb9b4d7dc4b860656b41dbbbfe',
  9: '8cdbc41767786542284d8cb18a5c031ac77e640b1af6dfec3d907dd63d299e47',
  10: '83ef97ed32bdb69b8d2f89797a61f6033a5b9688f320be047c569f6773973d70',
  11: '2c68f141f69bcd0fcbf0234b732caaf2694ebba03fc7497c8756e5f40ae356f9',
  12: 'bbdb1db158f38fdc413c31ab6a98db402954270f7b251ea8e04d870ccf62ddcd',
  13: 'd839e0669baea744e1af3debc51cd808d0138c866552628eda56122c4837acf3',
  14: 'ad8aa6c10a82462066e4955b63d68b9e43fbb2b17210c92a50a5c41bd188251b',
  15: '954ade5782c9db31550644dc20b42df2c28a4fe81823204641ba57bbdedea12b',
  16: '081e574ceacd017e573eaec933617a78f2c0173a372ea550487421b7b71c5eb0',
  17: '781b090a4553f32ffd039bb8543bd078e89a24755e44654c989b21710a50511a',
  18: '1929f40692ebcb36dc53e37adfe10f3959c7bfad1d3c0f152d7b4b40d13ebb7b',
  19: '89984116e4c89d895e53166e1f532b8fb2c9c50cc22beb94b04e96e7a6901e5b',
  20: '81a405a0379643675e9f9cd857f0d26b68f2ae69620635afefcce5d854ba519e',
  21: 'ca681497e642ed59dba8f65f00378ed549b27d5ef19504fc19ace3869afb4414',
  22: '024ffb2f91c842fb20b21b5738ed9f431c5e6810c2268ed0a59a4b47891ac76e',
  23: '0096ce6bb2184ec0be4da2fb24f8860fb400d25692332762b5d7856403e4eec7',
  24: 'b564e0f99af733b4d9f3aa0605521fe2cfce6463a62eb99339272b25cebaf194',
  25: '7e73dc6fbc809d72f6146c97c110d425a0fca511dac070ece2946d5df868651f',
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
