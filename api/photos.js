import { list } from '@vercel/blob';

const DEFAULT_PHOTOS = {
  pastor: 'images/pastor-susie.jpg',
  congregation: 'images/congregation-prayer.jpg',
  youth: 'images/youth-prayer.jpg',
  damas: 'images/damas-prayer.jpg'
};

function getBlobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const customKey = Object.keys(process.env).find(k => k.endsWith('_READ_WRITE_TOKEN') && process.env[k]);
  return customKey ? process.env[customKey] : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const photos = { ...DEFAULT_PHOTOS };
    const token = getBlobToken();

    // Query Vercel Blob storage for uploaded church photos
    if (token) {
      try {
        const { blobs } = await list({ prefix: 'church-', token: token });
        if (blobs && blobs.length > 0) {
          for (const b of blobs) {
            if (b.pathname.includes('church-pastor')) photos.pastor = b.url;
            if (b.pathname.includes('church-congregation')) photos.congregation = b.url;
            if (b.pathname.includes('church-youth')) photos.youth = b.url;
            if (b.pathname.includes('church-damas')) photos.damas = b.url;
          }
        }
      } catch (blobErr) {
        console.warn('[Vercel Blob List Warning]', blobErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      photos
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      photos: DEFAULT_PHOTOS
    });
  }
}
