// signup.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const businessName = document.getElementById("businessName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // RUN SUPABASE SIGNUP
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
          businessName: businessName
        }
      }
    });

    if (error) {
      alert("Signup Failed: " + error.message);
      console.error("Signup Error:", error);
      return;
    }

    alert("Account created! Please check your email to confirm your account.");
    window.location.href = "../login.html";
  });
});
