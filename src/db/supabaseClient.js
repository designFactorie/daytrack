import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL and Anon Key are required! Check your environment variables.');
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : { from: () => ({ select: () => ({ order: () => ({ subscribe: () => { } }) }), on: () => ({ subscribe: () => { } }) }) }; // Minimal mock to prevent early crashes
