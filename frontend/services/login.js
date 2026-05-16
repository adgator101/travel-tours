document.getElementById("loginBtn").addEventListener("click", handleLogin);

async function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const pass  = document.getElementById("password").value;

  hideError();

  if (!email || !pass) {
    showError("Please fill in all fields.");
    return;
  }

  // Fix Auth_14 — spaces-only password
  if (!pass.trim()) {
    showError("Password cannot be blank or spaces only.");
    return;
  }

  if (!isValidEmail(email)) {
    showError("Please enter a valid email address.");
    return;
  }

  const btn = document.getElementById("loginBtn");
  btn.disabled = true;
  btn.textContent = "Logging in…";

  try {
    const res = await fetch(window.getApiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.message || "Login failed. Please try again.");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    if (data.user && data.user.role === "ADMIN") {
      window.location.href = "Admin.html";
    } else {
      window.location.href = "index.html";
    }
  } catch (err) {
    showError("Network error. Please check your connection and try again.");
    console.error("Login error:", err);
  } finally {
    btn.disabled = false;
    btn.textContent = "Login";
  }
}

function showError(message) {
  let errorEl = document.getElementById("error-msg");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
    errorEl.style.display = "block";
  } else {
    alert(message);
  }
}

function hideError() {
  let errorEl = document.getElementById("error-msg");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
    errorEl.style.display = "none";
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}