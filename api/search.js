export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'Query required' });

  const PEXELS_KEY = process.env.PEXELS_KEY;

  try {
    const r = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    const data = await r.json();
    const videos = (data.videos || []).map(v => ({
      id: v.id,
      thumb: v.image,
      width: v.width,
      height: v.height,
      duration: v.duration,
      url: (v.video_files?.find(f => f.quality === 'hd' && f.width >= 1920) || v.video_files?.[0])?.link || '',
      source: 'Pexels'
    }));
    res.json({ videos });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
