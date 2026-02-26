// ==========================================================================
// API: Send Verification Code - /api/orders/send-code
// ==========================================================================
// Sends a 6-digit verification code to user's email for accessing orders
// ==========================================================================

import { supabase } from './../_lib/supabase.js';
import { sendVerificationCode } from './../_lib/resend.js';

// Generate random 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user has any orders
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_email', normalizedEmail)
      .limit(1);

    if (orderError) {
      console.error('Error checking orders:', orderError);
      return res.status(500).json({ error: 'Failed to verify email' });
    }

    // Don't reveal if email exists - always send "code sent" for security
    // But only actually send if orders exist
    if (!orders || orders.length === 0) {
      // Pretend we sent the code to prevent email enumeration
      return res.status(200).json({ 
        success: true, 
        message: 'If orders exist for this email, a verification code has been sent' 
      });
    }

    // Generate verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing codes for this email
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', normalizedEmail);

    // Store the code (using schema columns: email, code, purpose, expires_at, attempts)
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email: normalizedEmail,
        code,
        purpose: 'order_lookup',
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
      });

    if (insertError) {
      console.error('Error storing verification code:', insertError);
      return res.status(500).json({ error: 'Failed to generate code' });
    }

    // Send email with code
    const emailResult = await sendVerificationCode(normalizedEmail, code);

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't expose email sending failures to prevent enumeration
      return res.status(200).json({ 
        success: true, 
        message: 'If orders exist for this email, a verification code has been sent' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Verification code sent to your email' 
    });

  } catch (error) {
    console.error('Send code error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}