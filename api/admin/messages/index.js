// =============================================================================
// Admin Messages API - /api/admin/messages
// =============================================================================
// GET: List all contact messages
// PUT: Update message status or admin notes
// =============================================================================

import { supabase } from '../../_lib/supabase.js';
import { verifyAuth } from '../../_lib/auth.js';

export default async function handler(req, res) { 
  // Verify admin is authenticated
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return getMessages(req, res);
    case 'PUT':
      if (!id) {
        return res.status(400).json({ error: 'Message ID is required' });
      }
      return updateMessage(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// =============================================================================
// GET all messages
// =============================================================================
async function getMessages(req, res) {
  try {
    const { status: filterStatus, search, limit = 50 } = req.query;

    // Build query
    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Status filter
    if (filterStatus && filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`);
    }

    const { data: messages, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    // Get stats
    const { data: statsData, error: statsError } = await supabase
      .from('contact_message_stats')
      .select('*')
      .single();

    // Format response
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      name: msg.name,
      email: msg.email,
      subject: msg.subject,
      message: msg.message,
      status: msg.status,
      adminNotes: msg.admin_notes || '',
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
    }));

    return res.status(200).json({
      success: true,
      messages: formattedMessages,
      stats: statsData || {
        total_messages: messages.length,
        unread_count: messages.filter(m => m.status === 'unread').length,
        read_count: messages.filter(m => m.status === 'read').length,
        resolved_count: messages.filter(m => m.status === 'resolved').length,
      },
    });

  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
  }
}

// =============================================================================
// PUT update message
// =============================================================================
async function updateMessage(req, res, id) {
  try {
    const { status, admin_notes } = req.body;

    // Build update object
    const updates = {};
    if (status) {
      const validStatuses = ['unread', 'read', 'resolved'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be: unread, read, or resolved' });
      }
      updates.status = status;
    }
    if (admin_notes !== undefined) {
      updates.admin_notes = admin_notes;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: message, error: updateError } = await supabase
      .from('contact_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    return res.status(200).json({
      success: true,
      message: {
        id: message.id,
        name: message.name,
        email: message.email,
        subject: message.subject,
        message: message.message,
        status: message.status,
        adminNotes: message.admin_notes || '',
        createdAt: message.created_at,
        updatedAt: message.updated_at,
      },
    });

  } catch (err) {
    console.error('Update message error:', err);
    return res.status(500).json({ error: 'Failed to update message', details: err.message });
  }
}