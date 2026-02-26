// =============================================================================
// Admin Notifications API - /api/admin/notifications
// =============================================================================
// GET: List notifications
// PUT: Mark as read
// DELETE: Delete notification
// =============================================================================

import { supabase } from './../../_lib/supabase.js';
import { verifyAuth } from './../../_lib/auth.js';

export default async function handler(req, res) {
  // Verify admin is authenticated
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  switch (req.method) {
    case 'GET':
      return getNotifications(req, res);
    case 'PUT':
      return markAsRead(req, res);
    case 'DELETE':
      return deleteNotification(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET notifications
async function getNotifications(req, res) {
  try {
    const { unread_only, limit = 20, page = 1 } = req.query;

    let query = supabase
      .from('admin_notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error: queryError, count } = await query;

    if (queryError) throw queryError;

    return res.status(200).json({
      success: true,
      notifications: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

// PUT mark as read
async function markAsRead(req, res) {
  try {
    const { id, mark_all } = req.body;

    if (mark_all) {
      // Mark all as read
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const { data: notification, error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      notification,
    });

  } catch (err) {
    console.error('Mark as read error:', err);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
}

// DELETE notification
async function deleteNotification(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }

    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });

  } catch (err) {
    console.error('Delete notification error:', err);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
}