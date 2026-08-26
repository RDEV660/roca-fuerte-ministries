import { list } from '@vercel/blob';

const DEFAULT_PHOTOS = {
  pastor: 'images/pastor-susie.jpg',
  congregation: 'images/congregation-prayer.jpg',
  youth: 'images/youth-prayer.jpg',
  damas: 'images/damas-prayer.jpg'
};

function getBlobToken() {
  if (process.env.CHURCH_READ_WRITE_TOKEN) return process.env.CHURCH_READ_WRITE_TOKEN;
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  if (process.env.CHURCH_TOKEN) return process.env.CHURCH_TOKEN;
  
  for (const key of Object.keys(process.env)) {
    if ((key.startsWith('CHURCH_') || key.startsWith('BLOB_')) && key.includes('TOKEN')) {
      if (process.env[key]) return process.env[key];
    }
  }

  const customKey = Object.keys(process.env).find(k => k.endsWith('_READ_WRITE_TOKEN') && process.env[k]);
  if (customKey) return process.env[customKey];

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const photos = { ...DEFAULT_PHOTOS };
    const token = getBlobToken();
    let rawBlobs = [];

    // Query Vercel Blob storage for uploaded church photos
    if (token) {
      try {
        const { blobs } = await list({ token: token });
        rawBlobs = blobs || [];
        if (blobs && blobs.length > 0) {
          for (const b of blobs) {
            const path = (b.pathname || b.url || '').toLowerCase();
            if (path.includes('pastor')) photos.pastor = b.url;
            if (path.includes('congregation')) photos.congregation = b.url;
            if (path.includes('youth')) photos.youth = b.url;
            if (path.includes('damas')) photos.damas = b.url;
          }
        }
      } catch (blobErr) {
        console.warn('[Vercel Blob List Warning]', blobErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      tokenConfigured: !!token,
      blobCount: rawBlobs.length,
      photos
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      tokenConfigured: false,
      photos: DEFAULT_PHOTOS
    });
  }
}
