const SUPABASE_URL = "https://ggnecdlegtzuynaobfyt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnbmVjZGxlZ3R6dXluYW9iZnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjcxNDAsImV4cCI6MjA4MDY0MzE0MH0.jwLc7wBr9RjhB4bYuMIO2twhn1JWlT3FBAlFhlREg2E";

window.supabaseClient = supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

console.log("✅ Supabase Connected", window.supabaseClient);
