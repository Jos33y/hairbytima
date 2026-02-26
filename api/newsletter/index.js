// =============================================================================
// Public Newsletter API - /api/newsletter
// =============================================================================
// POST: Subscribe to newsletter
// DELETE: Unsubscribe from newsletter
// =============================================================================

import { supabase } from './../_lib/supabase.js';

export default async function handler(req, res) {
  switch (req.method) {
    case 'POST':
      return subscribe(req, res);
    case 'DELETE':
      return unsubscribe(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// =============================================================================
// POST - Subscribe
// =============================================================================
async function subscribe(req, res) {
  try {
    const { email, source = 'homepage' } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if already exists
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      // If exists but unsubscribed, reactivate
      if (!existing.is_active) {
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({ 
            is_active: true, 
            unsubscribed_at: null,
            source: source, // Update source to current
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;

        return res.status(200).json({
          success: true,
          message: 'Welcome back! You have been resubscribed.',
        });
      }

      // Already subscribed
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed!',
      });
    }

    // Insert new subscriber
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: normalizedEmail,
        source: source,
        is_active: true,
      });

    if (insertError) {
      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return res.status(200).json({
          success: true,
          message: 'You are already subscribed!',
        });
      }
      throw insertError;
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you for subscribing!',
    });

  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    return res.status(500).json({ error: 'Failed to subscribe. Please try again.' });
  }
}

// =============================================================================
// DELETE - Unsubscribe
// =============================================================================
async function unsubscribe(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({ 
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail)
      .select()
      .single();

    if (updateError && updateError.code !== 'PGRST116') {
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      message: 'You have been unsubscribed.',
    });

  } catch (err) {
    console.error('Newsletter unsubscribe error:', err);
    return res.status(500).json({ error: 'Failed to unsubscribe. Please try again.' });
  }
}