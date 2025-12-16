import { createClient } from "@supabase/supabase-js";

// process.env.SUPABASE_URL and process.env.SUPABASE_ANON_KEY should be set in your build environment
// For local testing, you can replace these with your actual Supabase project credentials
export const supabaseUrl =
  process.env.SUPABASE_URL || "https://qdwztkhlqzlwthosgbia.supabase.co";
export const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkd3p0a2hscXpsd3Rob3NnYmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzMzMTYsImV4cCI6MjA4MTM0OTMxNn0.pZjyulyZ2DSFonSbx5r1SqLtASEd01x5kwU78ytBd7g";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
