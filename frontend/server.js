import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.post('/api/ai-chat', async (req, res) => {
  try {
    const { messages = [], model = 'GigaChat-2', temperature = 0.5 } = req.body || {};
    const apiKey = process.env.GIGACHAT_API_KEY;
    const apiBaseUrl = (process.env.GIGACHAT_API_URL || 'https://api.gigachat.ai/api/v1').replace(/\/$/, '');

    if (!apiKey) {
      return res.status(500).json({ error: 'GIGACHAT_API_KEY is not configured on the server.' });
    }

    const tokenResponse = await fetch(`${apiBaseUrl}/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: apiKey,
      }).toString(),
    });

    const tokenPayload = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      const message = tokenPayload.error || tokenPayload.message || 'Failed to authenticate with GigaChat.';
      return res.status(401).json({ error: message });
    }

    const chatResponse = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenPayload.access_token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature,
        messages,
      }),
    });

    const chatPayload = await chatResponse.json().catch(() => ({}));
    if (!chatResponse.ok) {
      const message = chatPayload.error || chatPayload.message || 'Failed native model HTTP request';
      return res.status(chatResponse.status || 502).json({ error: message });
    }

    const answer = chatPayload.choices?.[0]?.message?.content || chatPayload?.answer || chatPayload?.output_text;
    if (typeof answer !== 'string' || !answer.trim()) {
      return res.status(502).json({ error: 'The AI model returned an empty response.' });
    }

    return res.json({ answer: answer.trim() });
  } catch (error) {
    console.error('AI chat proxy error:', error);
    return res.status(502).json({
      error: 'AI service is temporarily unavailable. Please try again later.',
    });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`AI chat proxy listening on http://localhost:${port}`);
});
