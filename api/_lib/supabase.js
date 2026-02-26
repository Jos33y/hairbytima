// =============================================================================
// Supabase Client for API Routes
// =============================================================================
// Shared client with service role key (bypasses RLS)
// Import: import { supabase } from './_lib/supabase.js'
// =============================================================================

import { createClient } from '@supabase/supabase-js';

// Service role client - bypasses RLS, use only in API routes
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);