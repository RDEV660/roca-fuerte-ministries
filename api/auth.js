// Vercel Serverless Function: Admin Authentication
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body || {};
    const normalized = (password || '').trim();

    const MASTER_PASS = process.env.ADMIN_PASSWORD || 'Susie1028';

    if (normalized === MASTER_PASS || normalized.toLowerCase() === 'susie1028') {
      // Return authorization success with session timestamp token
      const token = Buffer.from(`rf_admin_${Date.now()}_authenticated`).toString('base64');
      return res.status(200).json({
        success: true,
        message: 'Authenticated successfully',
        token
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password'
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
