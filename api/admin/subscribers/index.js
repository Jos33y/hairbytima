// =============================================================================
// Admin Subscribers API - /api/admin/subscribers
// =============================================================================
// GET: List all newsletter subscribers
// =============================================================================

import { supabase } from '../../_lib/supabase.js';
import { verifyAuth } from '../../_lib/auth.js';

export default async function handler(req, res) {
  // Verify admin is authenticated
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return getSubscribers(req, res);
} 

// =============================================================================
// GET all subscribers
// =============================================================================
async function getSubscribers(req, res) {
  try {
    const { status: filterStatus, source, search, limit = 100 } = req.query;

    // Build query
    let query = supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Status filter
    if (filterStatus === 'active') {
      query = query.eq('is_active', true);
    } else if (filterStatus === 'unsubscribed') {
      query = query.eq('is_active', false);
    }

    // Source filter
    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    // Search filter
    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    const { data: subscribers, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    // Get all subscribers for stats (without filters)
    const { data: allSubscribers, error: allError } = await supabase
      .from('newsletter_subscribers')
      .select('*');

    if (allError) throw allError;

    // Calculate stats
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const stats = {
      total: allSubscribers.length,
      active: allSubscribers.filter(s => s.is_active).length,
      unsubscribed: allSubscribers.filter(s => !s.is_active).length,
      thisWeek: allSubscribers.filter(s => {
        return new Date(s.created_at) > weekAgo && s.is_active;
      }).length,
    };

    const sourceStats = {
      homepage: allSubscribers.filter(s => s.source === 'homepage').length,
      footer: allSubscribers.filter(s => s.source === 'footer').length,
      checkout: allSubscribers.filter(s => s.source === 'checkout').length,
    };

    // Format response
    const formattedSubscribers = subscribers.map(sub => ({
      id: sub.id,
      email: sub.email,
      source: sub.source || 'homepage',
      isActive: sub.is_active,
      createdAt: sub.created_at,
      unsubscribedAt: sub.unsubscribed_at,
    }));

    return res.status(200).json({
      success: true,
      subscribers: formattedSubscribers,
      stats,
      sourceStats,
    });

  } catch (err) {
    console.error('Get subscribers error:', err);
    return res.status(500).json({ error: 'Failed to fetch subscribers', details: err.message });
  }
}