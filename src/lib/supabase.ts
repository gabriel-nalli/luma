import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vnrfzgbqiagxidcaeanr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZucmZ6Z2JxaWFneGlkY2FlYW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5Mjg1NjcsImV4cCI6MjA3OTUwNDU2N30.cEWd8IFv9lIYaiBQvnCr4jkTNEn2o0n1p6CgzLN0f20";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fixed user ID for now (no auth yet)
export const LUMA_USER_ID = "00000000-0000-0000-0000-000000000001";
