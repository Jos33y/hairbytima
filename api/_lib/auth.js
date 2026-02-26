// =============================================================================
// Auth Middleware for API Routes
// =============================================================================
// Verifies JWT token and attaches admin to request
// Import: import { verifyAuth, requireRole } from './_lib/auth.js'
// =============================================================================

import jwt from 'jsonwebtoken';
import { supabase } from './supabase.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Verify token and return admin data
export async function verifyAuth(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No token provided', status: 401 };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get fresh admin data
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, email, name, role, avatar_url, is_active')
      .eq('id', decoded.id)
      .single();

    if (error || !admin) {
      return { error: 'Admin not found', status: 401 };
    }

    if (!admin.is_active) {
      return { error: 'Account is deactivated', status: 401 };
    }

    return { admin };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { error: 'Token expired', status: 401 };
    }
    return { error: 'Invalid token', status: 401 };
  }
}

// Check if admin has required role
export function requireRole(admin, requiredRole) {
  const roleHierarchy = {
    super_admin: 3,
    admin: 2,
    manager: 1,
  };

  const adminLevel = roleHierarchy[admin.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return adminLevel >= requiredLevel;
}

// Generate JWT token
export function generateToken(admin, expiresIn = '7d') {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
    JWT_SECRET,
    { expiresIn }
  );
}

// Generate refresh token
export function generateRefreshToken(adminId) {
  return jwt.sign(
    { id: adminId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}