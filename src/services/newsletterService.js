import { supabase } from './supabase';

export const newsletterService = {
  /**
   * Subscribe email to newsletter
   * Handles duplicates gracefully
   */
  async subscribe(email, source = 'homepage') {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      // If exists but inactive, reactivate
      if (!existing.is_active) {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({ 
            is_active: true, 
            unsubscribed_at: null,
            source 
          })
          .eq('id', existing.id);

        if (error) throw error;
        return { success: true, message: 'Welcome back! You have been resubscribed.' };
      }
      
      return { success: true, message: 'You are already subscribed!' };
    }

    // New subscription
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ 
        email: normalizedEmail, 
        source,
        is_active: true 
      }]);

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return { success: true, message: 'You are already subscribed!' };
      }
      console.error('Newsletter subscription error:', error);
      throw error;
    }

    return { success: true, message: 'Thank you for subscribing!' };
  },

  /**
   * Unsubscribe email from newsletter
   */
  async unsubscribe(email) {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ 
        is_active: false, 
        unsubscribed_at: new Date().toISOString() 
      })
      .eq('email', email.toLowerCase().trim());

    if (error) {
      console.error('Newsletter unsubscribe error:', error);
      throw error;
    }

    return { success: true, message: 'You have been unsubscribed.' };
  }
};

