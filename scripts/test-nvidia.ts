import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function generateViaNvidia(prompt: string, apiKey: string) {
  const body = {
    prompt,
    width: 1024,
    height: 1024,
    steps: 4,
    seed: 12345,
  };

  const startTime = Date.now();
  console.log('Sending request to NVIDIA...');
  const res = await fetch(
    'https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  console.log(`[${Date.now() - startTime}ms] NVIDIA returned status ${res.status}`);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`NVIDIA API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  console.log('[NVIDIA] response keys:', Object.keys(data));

  const b64 =
    data?.artifacts?.[0]?.base64 ||
    data?.artifacts?.[0]?.b64_json ||
    data?.data?.[0]?.b64_json;

  if (!b64) {
    if (data?.id) {
      console.log('Async polling with ID:', data.id);
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const pollTime = Date.now();
        const pollRes = await fetch(
          `https://api.nvidia.com/v1/genai/status/${data.id}`,
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        console.log(`[${Date.now() - pollTime}ms] Poll #${i+1} status: ${pollRes.status}`);
        if (!pollRes.ok) break;
        const pd = await pollRes.json();
        const polledB64 = pd?.artifacts?.[0]?.base64 || pd?.artifacts?.[0]?.b64_json;
        if (polledB64) {
          console.log(`Generated! Total time: ${Date.now() - startTime}ms`);
          return;
        }
        if (pd?.status === 'failed') throw new Error('NVIDIA 生成失敗');
      }
    }
  } else {
    console.log(`Synchronous return! Total time: ${Date.now() - startTime}ms`);
  }
}

generateViaNvidia("A cat", process.env.NVIDIA_API_KEY!).catch(console.error);
