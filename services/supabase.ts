
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ncigpxwatagtjljeusro.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaWdweHdhdGFndGpsamV1c3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTM4NzcsImV4cCI6MjA4MDE4OTg3N30.a4sj0W91nIkdxAzxNdF5OroH-EtJj23MTEy0y8Ttbn8';

export const supabase = createClient(supabaseUrl, supabaseKey.trim());
