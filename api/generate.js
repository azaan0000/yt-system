export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { topic } = req.body || {};
  if (!topic) return res.status(400).json({ error: 'Topic required' });

  const CLAUDE_KEY = process.env.CLAUDE_KEY;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a YouTube SEO expert. Create VIRAL metadata for: "${topic}"
Reply ONLY with this JSON (no markdown):
{
  "title": "VIRAL title under 60 chars with emojis",
  "description": "3 paragraphs: hook, details, CTA with subscribe/like",
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12","tag13","tag14","tag15"],
  "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10",
  "categoryId": "17",
  "category": "Sports",
  "bestTime": "Tue-Thu 6-9 PM",
  "thumbnail": "Thumbnail design suggestion"
}`
        }]
      })
    });
    const data = await r.json();
    const txt = data.content[0].text.replace(/```json|```/g, '').trim();
    const match = txt.match(/\{[\s\S]*\}/);
    res.json(JSON.parse(match[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
