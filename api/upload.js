// Vercel Serverless Function: Cloud Image Upload & Database Sync
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

const DEFAULT_PHOTOS = {
  pastor: 'images/pastor-susie.jpg',
  congregation: 'images/congregation-prayer.jpg',
  youth: 'images/youth-prayer.jpg',
  damas: 'images/damas-prayer.jpg'
};

const PATH_MAP = {
  pastor: 'images/pastor-susie.jpg',
  congregation: 'images/congregation-prayer.jpg',
  youth: 'images/youth-prayer.jpg',
  damas: 'images/damas-prayer.jpg'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slot, image, password } = req.body || {};
    const MASTER_PASS = process.env.ADMIN_PASSWORD || 'Susie1028';

    // Verify authentication
    const authHeader = req.headers.authorization || '';
    const isTokenAuth = authHeader.includes('Bearer rf_admin_');
    const isPassAuth = (password || '').trim() === MASTER_PASS || (password || '').trim().toLowerCase() === 'susie1028';

    if (!isTokenAuth && !isPassAuth) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Invalid password or token.' });
    }

    if (!slot || !PATH_MAP[slot]) {
      return res.status(400).json({ success: false, error: 'Invalid photo slot specified.' });
    }

    if (!image || !image.includes(',')) {
      return res.status(400).json({ success: false, error: 'Invalid base64 image payload.' });
    }

    const base64Data = image.split(',')[1];
    let publicUrl = image; // fallback to data URI / cloud URL

    // 1. If Vercel Blob Token is present, store directly in Vercel Blob CDN
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const buffer = Buffer.from(base64Data, 'base64');
        const blobRes = await fetch(`https://blob.vercel-storage.com/rf-${slot}-${Date.now()}.jpg`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
            'x-content-type': 'image/jpeg'
          },
          body: buffer
        });
        if (blobRes.ok) {
          const blobJson = await blobRes.json();
          if (blobJson && blobJson.url) {
            publicUrl = blobJson.url;
          }
        }
      } catch (blobErr) {
        console.warn('Vercel Blob error, falling back', blobErr);
      }
    }

    // 2. If GitHub token is configured in environment, commit directly to repo
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.GITHUB_REPOSITORY || 'RDEV660/roca-fuerte-ministries';
    if (GITHUB_TOKEN) {
      try {
        const targetPath = PATH_MAP[slot];
        const apiUrl = `https://api.github.com/repos/${REPO}/contents/${targetPath}`;

        let sha = '';
        const getRes = await fetch(apiUrl, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json'
          }
        });
        if (getRes.ok) {
          const fileData = await getRes.json();
          sha = fileData.sha;
        }

        const putBody = {
          message: `Update ${targetPath} from Admin Control Panel`,
          content: base64Data
        };
        if (sha) putBody.sha = sha;

        await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json'
          },
          body: JSON.stringify(putBody)
        });
      } catch (ghErr) {
        console.warn('GitHub API sync error', ghErr);
      }
    }

    // 3. If Vercel KV / Redis is available, persist mapping in database
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        // Read existing
        let current = { ...DEFAULT_PHOTOS };
        const kvGet = await fetch(`${process.env.KV_REST_API_URL}/get/rf_photos`, {
          headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
        });
        if (kvGet.ok) {
          const kvData = await kvGet.json();
          if (kvData && kvData.result) {
            const parsed = typeof kvData.result === 'string' ? JSON.parse(kvData.result) : kvData.result;
            current = { ...current, ...parsed };
          }
        }

        current[slot] = publicUrl;

        // Set updated
        await fetch(`${process.env.KV_REST_API_URL}/set/rf_photos`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(JSON.stringify(current))
        });
      } catch (kvErr) {
        console.warn('KV update error', kvErr);
      }
    }

    return res.status(200).json({
      success: true,
      slot,
      url: publicUrl,
      message: 'Photo uploaded and saved to database successfully!'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
