import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env.js';

// browser client: login + Realtime only. All data goes through the backend API (lib/api.js).
export const sb = createClient(env.supabaseUrl, env.supabaseAnonKey);
