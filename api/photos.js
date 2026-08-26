// Vercel Serverless Function: Fetch Database Photos
const DEFAULT_PHOTOS = {
  pastor: 'images/pastor-susie.jpg',
  congregation: 'images/congregation-prayer.jpg',
  youth: 'images/youth-prayer.jpg',
  damas: 'images/damas-prayer.jpg'
};

// Global in-memory cache for fast edge responses
let memoryStore = { ...DEFAULT_PHOTOS };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // If Vercel KV / Redis is available via environment
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const kvRes = await fetch(`${process.env.KV_REST_API_URL}/get/rf_photos`, {
          headers: {
            Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`
          }
        });
        if (kvRes.ok) {
          const kvData = await kvRes.json();
          if (kvData && kvData.result) {
            const parsed = typeof kvData.result === 'string' ? JSON.parse(kvData.result) : kvData.result;
            return res.status(200).json({
              success: true,
              source: 'database_kv',
              photos: { ...DEFAULT_PHOTOS, ...parsed }
            });
          }
        }
      } catch (kvErr) {
        console.warn('KV read fallback', kvErr);
      }
    }

    return res.status(200).json({
      success: true,
      source: 'live_store',
      photos: memoryStore
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      source: 'default_fallback',
      photos: DEFAULT_PHOTOS
    });
  }
}
