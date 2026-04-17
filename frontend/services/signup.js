// Map dial codes to nationality/country names for the API's "nationality" field
const dialCodeToNationality = {
  '+1':   'United States',
  '+44':  'United Kingdom',
  '+91':  'India',
  '+977': 'Nepal',
  '+61':  'Australia',
  '+81':  'Japan',
  '+49':  'Germany',
  '+33':  'France',
  '+86':  'China',
  '+971': 'United Arab Emirates',
};

document.getElementById('signupBtn').addEventListener('click', handleSignup);

async function handleSignup() {
  const name     = document.getElementById('fullname').value.trim();
  const email    = document.getElementById('email').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const dialCode = document.getElementById('dialcode').value;
  const pass     = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm').value;

  // --- Client-side validation (kept exactly as before) ---
  if (!name || !email || !phone || !pass || !confirm) {
    showError('Please fill in all fields.');
    return;
  }

  if (!isValidEmail(email)) {
    showError('Please enter a valid email address.');
    return;
  }

  if (!/^\d{6,15}$/.test(phone)) {
    showError('Please enter a valid phone number (digits only, 6–15 digits).');
    return;
  }

  if (pass.length < 6) {
    showError('Password must be at least 6 characters.');
    return;
  }

  if (pass !== confirm) {
    showError('Passwords do not match.');
    return;
  }

  // Derive nationality from the selected dial code
  const nationality = dialCodeToNationality[dialCode] || 'Nepal';

  const btn = document.getElementById('signupBtn');
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    const res = await fetch(window.getApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass, nationality }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Handle specific errors: 409 = user already exists, 400 = validation
      showError(data.message || 'Registration failed. Please try again.');
      return;
    }

    // Store the token and user info — user is logged in right after signup
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Redirect to main page after successful registration
    window.location.href = 'index.html';

  } catch (err) {
    showError('Network error. Please check your connection and try again.');
    console.error('Signup error:', err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign Up';
  }
}

function showError(message) {
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