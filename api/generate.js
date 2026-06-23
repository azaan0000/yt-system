const { Anthropic } = require('@anthropic-ai/sdk');
const { createClient } = require('pexels');

// Aapke Vercel ke exact variable names
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_KEY });
const pexelsClient = createClient(process.env.PEXELS_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: 'Keyword missing' });

    try {
        // 1. Claude API se Script aur Metadata generate karwana
        const msg = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages: [{
                role: "user",
                content: `Create YouTube Short content for: "${keyword}". Return raw JSON string only, no markdown formatting or backticks:
                {
                    "title": "Viral Title with hashtags",
                    "description": "SEO friendly description",
                    "tags": ["tag1", "tag2"],
                    "voiceover_text": "Short 20 second engaging script text.",
                    "search_term": "one single english word to search vertical background stock video"
                }`
            }]
        });

        const metadata = JSON.parse(msg.content[0].text);

        // 2. Pexels se exact video URL uthana
        const pexelsRes = await pexelsClient.videos.search({ 
            query: metadata.search_term, 
            per_page: 1, 
            orientation: 'portrait' 
        });

        if (!pexelsRes.videos.length) throw new Error("Pexels clip not found");
        const videoUrl = pexelsRes.videos[0].video_files.find(f => f.quality === 'hd')?.link || pexelsRes.videos[0].video_files[0].link;

        // Dono cheezon ko combine karke next stage par bhejna
        return res.status(200).json({
            success: true,
            metadata,
            videoUrl
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
