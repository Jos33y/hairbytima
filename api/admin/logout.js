// =============================================================================
// Admin Logout API - /api/admin/logout
// =============================================================================

import jwt from 'jsonwebtoken';
import { supabase } from '../_lib/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ success: true });
    }

    const token = authHeader.split(' ')[1];

    // Decode token (ignore expiration for logout)
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    } catch (err) {
      return res.status(200).json({ success: true });
    }

    // Delete all sessions for this admin
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('admin_id', decoded.id);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(200).json({ success: true });
  }
}