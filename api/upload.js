import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slot, image, password } = req.body || {};
    const MASTER_PASS = process.env.ADMIN_PASSWORD || 'Susie1028';

    // Verify authentication
    const isPassAuth = (password || '').trim() === MASTER_PASS || (password || '').trim().toLowerCase() === 'susie1028';
    if (!isPassAuth) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid password' });
    }

    if (!slot || !['pastor', 'congregation', 'youth', 'damas'].includes(slot)) {
      return res.status(400).json({ success: false, error: 'Invalid photo slot specified' });
    }

    if (!image || !image.includes(',')) {
      return res.status(400).json({ success: false, error: 'Invalid base64 image data' });
    }

    // Parse image buffer
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `church-${slot}.jpg`;

    let finalUrl = image;

    // 1. Upload to Vercel Blob Storage if connected
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: mimeType,
        addRandomSuffix: false
      });
      finalUrl = blob.url;
      console.log(`[Vercel Blob] Uploaded ${filename} -> ${finalUrl}`);
    } else {
      console.warn('[Vercel Blob] BLOB_READ_WRITE_TOKEN not found in environment.');
    }

    return res.status(200).json({
      success: true,
      slot,
      url: finalUrl,
      message: 'Photo uploaded and saved to Vercel Blob storage successfully!'
    });
  } catch (err) {
    console.error('[Vercel Blob Upload Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
