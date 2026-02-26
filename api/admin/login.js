// =============================================================================
// Admin Login API - /api/admin/login
// =============================================================================

import bcrypt from 'bcryptjs';
import { supabase } from '../_lib/supabase.js';
import { generateToken, generateRefreshToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find admin user
    const { data: admin, error: findError } = await supabase
      .from('admin_users')
      .select('id, email, password_hash, name, role, avatar_url, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (findError || !admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!admin.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate tokens
    const token = generateToken(admin);
    const refreshToken = generateRefreshToken(admin.id);

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Create session
    await supabase.from('admin_sessions').insert({
      admin_id: admin.id,
      refresh_token: refreshToken,
      user_agent: req.headers['user-agent'] || 'Unknown',
      ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Unknown',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return res.status(200).json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatar_url: admin.avatar_url,
      },
      token,
      refreshToken,
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}