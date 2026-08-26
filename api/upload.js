import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

function getBlobToken() {
  // 1. Direct checks
  if (process.env.CHURCH_READ_WRITE_TOKEN) return process.env.CHURCH_READ_WRITE_TOKEN;
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  if (process.env.CHURCH_TOKEN) return process.env.CHURCH_TOKEN;
  
  // 2. Search any env key with CHURCH or BLOB that looks like a token
  for (const key of Object.keys(process.env)) {
    if ((key.startsWith('CHURCH_') || key.startsWith('BLOB_')) && key.includes('TOKEN')) {
      if (process.env[key]) return process.env[key];
    }
  }

  // 3. Search any _READ_WRITE_TOKEN
  const customKey = Object.keys(process.env).find(k => k.endsWith('_READ_WRITE_TOKEN') && process.env[k]);
  if (customKey) return process.env[customKey];

  return null;
}

export default async function handler(req, res) {
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

    // Diagnostics: List detected environment variable keys (names only, no secrets)
    const detectedEnvKeys = Object.keys(process.env).filter(
      k => k.includes('BLOB') || k.includes('CHURCH') || k.includes('STORE') || k.includes('KV')
    );

    // Parse image buffer
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `church-${slot}.jpg`;

    let finalUrl = image;
    let isBlobActive = false;
    let uploadError = null;

    const token = getBlobToken();

    // Upload to Vercel Blob Storage
    if (token) {
      try {
        const blob = await put(filename, buffer, {
          access: 'public',
          contentType: mimeType,
          addRandomSuffix: false,
          token: token
        });
        finalUrl = blob.url;
        isBlobActive = true;
        console.log(`[Vercel Blob] Uploaded ${filename} -> ${finalUrl}`);
      } catch (putErr) {
        uploadError = putErr.message;
        console.error('[Vercel Blob Put Error]', putErr);
      }
    } else {
      console.warn('[Vercel Blob] No matching token found. Available keys:', detectedEnvKeys);
    }

    return res.status(200).json({
      success: true,
      slot,
      url: finalUrl,
      blobActive: isBlobActive,
      detectedKeys: detectedEnvKeys,
      uploadError: uploadError,
      message: isBlobActive 
        ? '✓ Photo uploaded and saved to Vercel Blob CDN successfully!' 
        : `Token check: [${detectedEnvKeys.join(', ')}]. Redeploy may be required if variables were just added.`
    });
  } catch (err) {
    console.error('[Vercel Blob Upload Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
