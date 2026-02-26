import { supabase } from './supabase';

const verificationService = {
  async sendCode(email) {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing codes for this email
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email.toLowerCase());

    // Insert new code
    const { error } = await supabase.from('verification_codes').insert({
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (error) throw error;

    // Return code (in production, this would be sent via email)
    return { success: true, code };
  }, 

  async verifyCode(email, code) {
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Invalid verification code' };
    }

    if (new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'Verification code has expired' };
    }

    if (data.attempts >= 3) {
      return { valid: false, error: 'Too many attempts. Please request a new code.' };
    }

    // Delete code after successful verification
    await supabase
      .from('verification_codes')
      .delete()
      .eq('id', data.id);

    return { valid: true };
  },

  async incrementAttempts(email) {
    await supabase.rpc('increment_verification_attempts', {
      p_email: email.toLowerCase(),
    });
  },

  async deleteCode(email) {
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email.toLowerCase());
  },
};

