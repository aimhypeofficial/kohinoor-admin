// Build-time settings (Vite). Set them in admin/.env locally, or in Vercel -> Settings -> Environment Variables.
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  apiUrl: (import.meta.env.VITE_API_URL || '').replace(/\/$/, ''),
};
