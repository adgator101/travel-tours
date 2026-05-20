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
  const nationalitySel = document.getElementById('nationality')?.value || '';
  const pass     = document.getElementById('password').value;
  const confirm  = document.getElementById('confirm').value;

  hideError();

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

  // Fix Auth_14 equivalent — spaces-only password
  if (!pass.trim()) {
    showError('Password cannot be blank or spaces only.');
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

  const nationality = nationalitySel || dialCodeToNationality[dialCode] || 'Nepal';

  const btn = document.getElementById('signupBtn');
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    const res = await fetch(window.getApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass, nationality, phone }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Fix Auth_02 — 409 duplicate email shows clear message
      if (res.status === 409) {
        showError('An account with this email already exists. Please login instead.');
      } else {
        showError(data.message || 'Registration failed. Please try again.');
      }
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
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
    errorEl.classList.remove('hidden');
    errorEl.style.display = 'block';
  } else {
    alert(message);
  }
}

function hideError() {
  let errorEl = document.getElementById('error-msg');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
    errorEl.style.display = 'none';
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}