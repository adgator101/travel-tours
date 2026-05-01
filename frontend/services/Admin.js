
// ─── AUTH GUARD ──────────────────────────────────────────────────────────────
(function() {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');
  if (!token || !user) {
    window.location.href = 'login.html';
    return;
  }
  if (user.role !== 'ADMIN') {
    alert('Access denied. Admin only.');
    window.location.href = 'index.html';
    return;
  }
  // Set avatar initials
  const initials = user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'A';
  document.getElementById('adminAvatar').textContent = initials;
  document.getElementById('adminName').textContent   = user.name || 'Admin Portal';
})();

function getToken() { return localStorage.getItem('token') || ''; }

async function apiFetch(path, opts = {}) {
  const res = await fetch(window.getApiUrl(path), {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken(),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  packages:  'Manage Packages',
  bookings:  'Manage Bookings',
  users:     'Users',
};

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${name}"]`)?.classList.add('active');
  document.getElementById('topbarTitle').textContent = PAGE_TITLES[name] || name;
  if (name === 'dashboard') loadDashboard();
  if (name === 'packages')  loadPackages();
  if (name === 'bookings')  loadBookings();
}

document.querySelectorAll('.nav-item, .link-green').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const pg = el.dataset.page;
    if (pg) showPage(pg);
  });
});

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (_) {}
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
});

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const { tours } = await apiFetch('/api/tours');

    // Stats from tours (bookings API not available, show tour count + placeholders)
    document.getElementById('statPackages').textContent = tours.length;
    document.getElementById('statBookings').textContent = '—';
    document.getElementById('statUsers').textContent    = '—';
    document.getElementById('statRevenue').textContent  = '—';

    // Recent bookings placeholder
    const tbody = document.getElementById('recentBookingsBody');
    tbody.innerHTML = `<tr><td colspan="6" class="loading-cell" style="color:#b0c4b0;">No booking data available from API</td></tr>`;

    // Popular packages
    const pkgBody = document.getElementById('popularPackagesBody');
    if (!tours.length) {
      pkgBody.innerHTML = `<tr><td colspan="4" class="loading-cell">No packages yet</td></tr>`;
      return;
    }
    pkgBody.innerHTML = tours.slice(0, 5).map(t => `
      <tr>
        <td class="cell-link">${esc(t.title)}</td>
        <td>${esc(t.destination)}</td>
        <td>$${Number(t.price).toLocaleString()}</td>
        <td>${t.durationDays} days</td>
      </tr>`).join('');
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

// ─── PACKAGES ────────────────────────────────────────────────────────────────
let allTours = [];

async function loadPackages() {
  const tbody = document.getElementById('packagesTableBody');
  tbody.innerHTML = `<tr><td colspan="5" class="loading-cell"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;
  hideBanner('Packages');
  try {
    const { tours } = await apiFetch('/api/tours');
    allTours = tours;
    renderPackagesTable(tours);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="loading-cell">Failed to load packages</td></tr>`;
    showBanner('Packages', 'error', err.message);
  }
}

function renderPackagesTable(tours) {
  const tbody = document.getElementById('packagesTableBody');
  if (!tours.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No packages available</td></tr>`;
    return;
  }
  tbody.innerHTML = tours.map(t => `
    <tr>
      <td class="cell-green">${esc(t.title)}</td>
      <td>${esc(t.destination)}</td>
      <td>$${Number(t.price).toLocaleString()}</td>
      <td>${t.durationDays} days</td>
    </tr>`).join('');
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────
// NOTE: Bookings endpoints are not in the provided API docs.
// We'll show a graceful message and search/filter placeholders are wired up.
let bookingsData = [];
let bookingPage  = 1;
const PER_PAGE   = 5;

async function loadBookings() {
  const tbody = document.getElementById('bookingsTableBody');
  tbody.innerHTML = `<tr><td colspan="8" class="loading-cell"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;

  try {
    // Try to fetch bookings; API may have this endpoint even if not documented
    const data = await apiFetch('/api/bookings');
    bookingsData = data.bookings || data.data || [];
    bookingPage  = 1;
    renderBookings();
  } catch (err) {
    // Show demo data if API doesn't have bookings
    bookingsData = DEMO_BOOKINGS;
    bookingPage  = 1;
    renderBookings();
  }
}

const DEMO_BOOKINGS = [
  { id: 'BK001', customerName: 'John Doe',   customerEmail: 'john@email.com',  packageTitle: 'Mountain Adventure Trek', travelDate: '2024-02-15', persons: 2, amount: 2798, status: 'confirmed'  },
  { id: 'BK002', customerName: 'Jane Smith',  customerEmail: 'jane@email.com',  packageTitle: 'Tropical Paradise Getaway', travelDate: '2024-02-20', persons: 4, amount: 5196, status: 'pending'    },
  { id: 'BK003', customerName: 'Mike Johnson',customerEmail: 'mike@email.com',  packageTitle: 'European Heritage Tour',   travelDate: '2024-03-01', persons: 2, amount: 3198, status: 'confirmed'  },
  { id: 'BK004', customerName: 'Sarah Lee',   customerEmail: 'sarah@email.com', packageTitle: 'Safari Wildlife Experience',travelDate: '2024-03-10', persons: 2, amount: 4398, status: 'cancelled'  },
];

function renderBookings() {
  const query      = document.getElementById('bookingSearch').value.toLowerCase();
  const statusFilt = document.getElementById('statusFilter').value.toLowerCase();

  let filtered = bookingsData.filter(b => {
    const matchQ = !query ||
      (b.customerName  || '').toLowerCase().includes(query) ||
      (b.packageTitle  || '').toLowerCase().includes(query) ||
      String(b.id || '').toLowerCase().includes(query);
    const matchS = !statusFilt || (b.status || '').toLowerCase() === statusFilt;
    return matchQ && matchS;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  if (bookingPage > totalPages) bookingPage = 1;

  const slice  = filtered.slice((bookingPage - 1) * PER_PAGE, bookingPage * PER_PAGE);
  const tbody  = document.getElementById('bookingsTableBody');

  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No bookings found</td></tr>`;
  } else {
    tbody.innerHTML = slice.map(b => {
      const initials = (b.customerName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const statusClass = { confirmed: 'badge-confirmed', pending: 'badge-pending', cancelled: 'badge-cancelled' }[b.status?.toLowerCase()] || 'badge-pending';
      return `
      <tr>
        <td class="cell-green">#${b.id}</td>
        <td>
          <div class="customer-cell">
            <div class="customer-avatar">${initials}</div>
            <div>
              <div class="customer-name">${esc(b.customerName || '—')}</div>
              <div class="customer-email">${esc(b.customerEmail || '')}</div>
            </div>
          </div>
        </td>
        <td class="cell-link">${esc(b.packageTitle || '—')}</td>
        <td>${b.travelDate || '—'}</td>
        <td>${b.persons || '—'}</td>
        <td>$${Number(b.amount || 0).toLocaleString()}</td>
        <td><span class="badge ${statusClass}">${capitalize(b.status || '')}</span></td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon" title="View"><i class="fas fa-eye"></i></button>
            <button class="btn-icon" title="Edit"><i class="fas fa-pen"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  // Pagination
  const pag = document.getElementById('bookingPagination');
  pag.innerHTML = `
    <button ${bookingPage === 1 ? 'disabled' : ''} onclick="changeBookingPage(-1)">← Previous</button>
    <span class="page-info">Page ${bookingPage} of ${totalPages}</span>
    <button ${bookingPage >= totalPages ? 'disabled' : ''} onclick="changeBookingPage(1)">Next →</button>
  `;
}

function changeBookingPage(delta) { bookingPage += delta; renderBookings(); }

document.getElementById('bookingSearch').addEventListener('input',  () => { bookingPage = 1; renderBookings(); });
document.getElementById('statusFilter').addEventListener('change',  () => { bookingPage = 1; renderBookings(); });

// ─── BANNER HELPERS ──────────────────────────────────────────────────────────
function showBanner(section, type, msg) {
  const el = document.getElementById((type === 'error' ? 'errorBanner' : 'successBanner') + section);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}
function hideBanner(section) {
  ['errorBanner', 'successBanner'].forEach(prefix => {
    document.getElementById(prefix + section)?.classList.add('hidden');
  });
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
}

// ─── INIT ────────────────────────────────────────────────────────────────────
showPage('dashboard');