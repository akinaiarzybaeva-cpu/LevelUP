const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { messages = [], model = 'GigaChat-2', temperature = 0.5 } = await req.json().catch(() => ({}));
    const apiKey = process.env.GIGACHAT_API_KEY;
    const apiBaseUrl = (process.env.GIGACHAT_API_URL || 'https://api.gigachat.ai/api/v1').replace(/\/$/, '');

    if (!apiKey) return json({ error: 'GIGACHAT_API_KEY is not configured on the server.' }, 500);

    const tokenResponse = await fetch(`${apiBaseUrl}/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: apiKey }).toString(),
    });
    const tokenPayload = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      return json({ error: tokenPayload.error || tokenPayload.message || 'Failed to authenticate with GigaChat.' }, 401);
    }

    const chatResponse = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenPayload.access_token}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ model, temperature, messages }),
    });
    const chatPayload = await chatResponse.json().catch(() => ({}));
    if (!chatResponse.ok) {
      return json({ error: chatPayload.error || chatPayload.message || 'Failed native model HTTP request' }, chatResponse.status || 502);
    }

    const answer = chatPayload.choices?.[0]?.message?.content || chatPayload?.answer || chatPayload?.output_text;
    if (typeof answer !== 'string' || !answer.trim()) {
      return json({ error: 'The AI model returned an empty response.' }, 502);
    }
    return json({ answer: answer.trim() });
  } catch (error) {
    console.error('AI chat proxy error:', error);
    return json({ error: 'AI service is temporarily unavailable. Please try again later.' }, 502);
  }
};
