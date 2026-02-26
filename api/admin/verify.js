// =============================================================================
// Admin Verify API - /api/admin/verify
// =============================================================================

import { verifyAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { admin, error, status } = await verifyAuth(req);

  if (error) {
    return res.status(status).json({ error });
  }

  return res.status(200).json({
    success: true,
    admin,
  });
}