document.getElementById('loginBtn').addEventListener('click', handleLogin);

function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const pass  = document.getElementById('password').value;

  if (!email || !pass) {
    alert('Please fill in all fields.');
    return;
  }

  if (!isValidEmail(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  alert('Login successful! Welcome back ✈️');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
