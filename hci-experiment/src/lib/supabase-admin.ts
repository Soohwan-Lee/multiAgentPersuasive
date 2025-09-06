import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client using Service Role key
// Do NOT import this file from client components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);


