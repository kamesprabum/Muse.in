import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Clean up trailing slash or accidentally included /rest/v1 endpoint path
const supabaseUrl = rawUrl?.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '') ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
