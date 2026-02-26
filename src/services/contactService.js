// ==========================================================================
// Contact Service - Supabase integration for contact messages
// ==========================================================================

import { supabase } from '@/services/supabase';

// Common spam patterns to detect
const SPAM_PATTERNS = [
  /\b(viagra|cialis|casino|lottery|winner|bitcoin|crypto|investment opportunity)\b/i,
  /\b(click here|act now|limited time|free money|earn \$|make money fast)\b/i,
  /\b(nigerian prince|inheritance|million dollars|wire transfer)\b/i,
  /(http[s]?:\/\/){3,}/i, // Multiple URLs
  /(.)\1{10,}/i, // Repeated characters (aaaaaaaaaa)
];

// Check if message contains spam
const isSpamContent = (message) => {
  return SPAM_PATTERNS.some(pattern => pattern.test(message));
};

export const contactService = {
  /**
   * Submit a contact message
   */
  async submitMessage({ name, email, subject, message }) {
    // Content-based spam check
    const fullContent = `${name} ${email} ${subject} ${message}`;
    if (isSpamContent(fullContent)) {
      console.warn('Spam content detected');
      // Return fake success to not tip off spammers
      return { id: 'spam-blocked', success: true };
    }

    // Insert without .select() to avoid RLS SELECT permission issue
    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        status: 'unread',
      });

    if (error) {
      console.error('Error submitting contact message:', error);
      throw error;
    }

    return { success: true };
  },
};

