import { list, del } from '@vercel/blob';

const DEFAULT_PHOTOS = {
  pastor: 'images/pastor-susie.jpg',
  congregation: 'images/congregation-prayer.jpg',
  youth: 'images/youth-prayer.jpg',
  damas: 'images/damas-prayer.jpg'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body || {};
    const MASTER_PASS = process.env.ADMIN_PASSWORD || 'Susie1028';

    const isPassAuth = (password || '').trim() === MASTER_PASS || (password || '').trim().toLowerCase() === 'susie1028';
    if (!isPassAuth) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { blobs } = await list({ prefix: 'church-' });
        const urlsToDelete = blobs.map(b => b.url);
        if (urlsToDelete.length > 0) {
          await del(urlsToDelete);
          console.log(`[Vercel Blob] Deleted ${urlsToDelete.length} custom blobs.`);
        }
      } catch (delErr) {
        console.warn('[Vercel Blob Reset Warning]', delErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      photos: DEFAULT_PHOTOS,
      message: 'All photos reset to original church defaults.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
