document.getElementById('signupBtn').addEventListener('click', handleSignup);

function handleSignup() {
  const name    = document.getElementById('fullname').value.trim();
  const email   = document.getElementById('email').value.trim();
  const phone   = document.getElementById('phone').value.trim();
  const pass    = document.getElementById('password').value;
  const confirm = document.getElementById('confirm').value;

  if (!name || !email || !phone || !pass || !confirm) {
    alert('Please fill in all fields.');
    return;
  }

  if (!isValidEmail(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  if (!/^\d{6,15}$/.test(phone)) {
    alert('Please enter a valid phone number (digits only, 6–15 digits).');
    return;
  }

  if (pass.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }

  if (pass !== confirm) {
    alert('Passwords do not match.');
    return;
  }

  alert('Account created successfully! Welcome aboard ✈️');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
