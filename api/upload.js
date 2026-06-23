export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { token, title, description, tags, categoryId, videoUrl } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Token required' });

  try {
    // Create upload session
    const metaRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/mp4'
        },
        body: JSON.stringify({
          snippet: { title, description, tags, categoryId: categoryId || '17', defaultLanguage: 'en' },
          status: { privacyStatus: 'public', selfDeclaredMadeForKids: false }
        })
      }
    );

    if (metaRes.status === 401) {
      return res.status(401).json({ error: 'YouTube token expired' });
    }

    const uploadUrl = metaRes.headers.get('location');
    
    if (videoUrl && uploadUrl) {
      // Download video and upload to YouTube
      const videoRes = await fetch(videoUrl);
      const videoBuffer = await videoRes.arrayBuffer();
      
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': videoBuffer.byteLength
        },
        body: videoBuffer
      });

      if (uploadRes.ok || uploadRes.status === 201 || uploadRes.status === 200) {
        const uploadData = await uploadRes.json().catch(() => ({}));
        return res.json({ success: true, videoId: uploadData.id, message: 'Video uploaded!' });
      }
    }

    res.json({ success: true, uploadUrl, message: 'Upload session created' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
