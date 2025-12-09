document.addEventListener("DOMContentLoaded", async () => {
  // Use the initialized client from supabase-init.js
  const { data: { user }, error } = await supabaseClient.auth.getUser();

  if (error) {
    console.error("Error fetching user:", error.message);
  }

  if (!user) {
    // Redirect to login if no active session
    window.location.href = "login.html";
    return;
  }

  // Show welcome message (name if available, fallback to email)
  const name = user.user_metadata?.name || user.email;
  const welcomeEl = document.getElementById("welcome");
  if (welcomeEl) {
    welcomeEl.textContent = `Welcome, ${name}`;
  }

  // Logout button
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "login.html";
    });
  }

  // Time Clock button (now has correct ID in HTML)
  const timeClockBtn = document.getElementById("timeClock");
  if (timeClockBtn) {
    timeClockBtn.addEventListener("click", () => {
      window.location.href = "timeclock.html";
    });
  }
});
