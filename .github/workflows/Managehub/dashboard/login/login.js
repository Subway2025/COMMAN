const { createClient } = supabase;

const supabaseUrl = "https://ggnecdlegtzuynaobfyt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnbmVjZGxlZ3R6dXluYW9iZnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjcxNDAsImV4cCI6MjA4MDY0MzE0MH0.jwLc7wBr9RjhB4bYuMIO2twhn1JWlT3FBAlFhlREg2E";
const supabaseClient = createClient(supabaseUrl, supabaseKey);

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Login failed: " + error.message);
  } else {
    alert("Login successful! Redirecting...");
    window.location.href = "../dashboard.html";
  }
});
