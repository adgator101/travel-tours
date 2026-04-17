const API_BASE = "";

document.getElementById('loginBtn').addEventListener('click', handleLogin);

async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const pass  = document.getElementById('password').value;

  if (!email || !pass) {
    showError('Please fill in all fields.');
    return;
  }

  if (!isValidEmail(email)) {
    showError('Please enter a valid email address.');
    return;
  }

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Logging in…';

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });

    const data = await res.json();

    if (!res.ok) {
      // API returns { success: false, message: "..." }
      showError(data.message || 'Login failed. Please try again.');
      return;
    }

    // Store the token and user info for use on other pages
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Redirect to the main page after successful login
    window.location.href = 'index.html';

  } catch (err) {
    showError('Network error. Please check your connection and try again.');
    console.error('Login error:', err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}

function showError(message) {
  // Try to find an existing error element, otherwise use alert as fallback
  let errorEl = document.getElementById('error-msg');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  } else {
    alert(message);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}