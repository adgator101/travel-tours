/* =============================================================
   profile.js
   - Fetches user profile from GET /api/auth/me
   - Fetches bookings from GET /api/bookings/my-bookings
   - Moments stored in localStorage (backend-ready: see TODO comments)
   ============================================================= */

// ── CONFIG ────────────────────────────────────────────────────
const API = (path) => window.getApiUrl?.(path) || path;

function getToken()       { return localStorage.getItem('token'); }
function getUser()        { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } }
function authHeaders()    {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

// ── STATE ─────────────────────────────────────────────────────
let allBookings = [];

// ── GUARD ─────────────────────────────────────────────────────
function guardAuth() {
    if (!getToken()) window.location.href = 'login.html';
}

// =============================================================
// PROFILE
// =============================================================
async function fetchProfile() {
    try {
        const res  = await fetch(API('/api/auth/me'), { headers: authHeaders() });
        const data = await res.json();

        if (!res.ok) {
            if (res.status === 401) return redirectLogin();
            throw new Error(data.message);
        }

        renderProfile(data.user);

    } catch (err) {
        console.error('Profile error:', err);
        document.getElementById('userName').textContent = 'Could not load profile';
    }
}

function renderProfile(user) {
    // Initials avatar
    const initials = (user.name || 'U')
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    document.getElementById('avatarInitials').textContent = initials;

    document.getElementById('userName').textContent = user.name || 'Traveller';

    document.getElementById('userNationality').innerHTML =
        `<i class="fas fa-flag"></i> ${user.nationality || 'Unknown'}`;

    document.getElementById('userEmail').innerHTML =
        `<i class="fas fa-envelope"></i> ${user.email || '--'}`;

    const roleChip = document.getElementById('roleChip');
    roleChip.textContent = user.role || 'USER';
    if (user.role === 'ADMIN') roleChip.classList.add('ADMIN');

    // Account panel
    document.getElementById('accName').textContent        = user.name        || '--';
    document.getElementById('accEmail').textContent       = user.email       || '--';
    document.getElementById('accNationality').textContent = user.nationality || '--';
    document.getElementById('accRole').textContent        = user.role        || '--';

    // Save locally
    localStorage.setItem('user', JSON.stringify(user));
}

// =============================================================
// BOOKINGS
// =============================================================
async function fetchBookings() {
    showBookingsSkeleton();

    try {
        const res  = await fetch(API('/api/bookings/my-bookings'), { headers: authHeaders() });
        const data = await res.json();

        if (!res.ok) {
            if (res.status === 401) return redirectLogin();
            throw new Error(data.message);
        }

        allBookings = data.bookings || [];
        renderStats(allBookings);
        renderBookings(allBookings);
        populateBookingDropdown(allBookings);

    } catch (err) {
        console.error('Bookings error:', err);
        document.getElementById('bookingsContainer').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>${err.message || 'Failed to load bookings'}</p>
                <button class="btn-retry" onclick="fetchBookings()">Try Again</button>
            </div>`;
    }
}

function renderStats(bookings) {
    document.getElementById('statTotal').textContent     = bookings.length;
    document.getElementById('statConfirmed').textContent = bookings.filter(b => b.status === 'CONFIRMED').length;
    document.getElementById('statPending').textContent   = bookings.filter(b => b.status === 'PENDING').length;
    document.getElementById('statCancelled').textContent = bookings.filter(b => b.status === 'CANCELLED').length;
}

function filterBookings(status, btn) {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    renderBookings(status === 'ALL' ? allBookings : allBookings.filter(b => b.status === status));
}

function renderBookings(list) {
    const c = document.getElementById('bookingsContainer');

    if (!list.length) {
        c.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-suitcase-rolling"></i>
                <p>No bookings found</p>
                <small>Your travel history will appear here once you book a tour.</small>
            </div>`;
        return;
    }

    const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    c.innerHTML = `<div class="booking-list">${sorted.map(bookingCard).join('')}</div>`;
}

function bookingCard(b) {
    const tour    = b.tour || {};
    const name    = tour.title || 'Tour Package';
    const price   = tour.price ? `$${parseFloat(tour.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '--';
    const status  = b.status || 'PENDING';
    const booked  = b.createdAt ? fmtDate(b.createdAt) : '--';
    const updated = b.updatedAt ? fmtDate(b.updatedAt) : '--';

    const statusLabel = { CONFIRMED: 'Confirmed', PENDING: 'Pending', CANCELLED: 'Cancelled' };
    const statusIcon  = { CONFIRMED: 'fa-check-circle', PENDING: 'fa-clock', CANCELLED: 'fa-times-circle' };

    const thumb = (tour.images && tour.images.length)
        ? `<img class="booking-thumb" src="${tour.images[0]}" alt="${name}"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="booking-thumb-placeholder" style="display:none;"><i class="fas fa-mountain"></i></div>`
        : `<div class="booking-thumb-placeholder"><i class="fas fa-mountain"></i></div>`;

    return `
    <div class="booking-card ${status}">
        ${thumb}
        <div class="booking-info">
            <div class="booking-tour-name">${name}</div>
            <div class="booking-meta-row">
                <span class="bmeta"><i class="fas fa-calendar-plus"></i> ${booked}</span>
                <span class="bmeta"><i class="fas fa-envelope"></i> ${b.contactEmail || '--'}</span>
                <span class="bmeta"><i class="fas fa-passport"></i> ${b.passportNumber || '--'}</span>
            </div>
            ${status !== 'PENDING' ? `<div class="booking-meta-row">
                <span class="bmeta"><i class="fas fa-sync-alt"></i> Updated ${updated}</span>
            </div>` : ''}
            <div class="booking-id-tag">Booking #${b.id}</div>
        </div>
        <div class="booking-right">
            <span class="booking-price">${price}</span>
            <span class="status-badge ${status}">
                <span class="status-dot"></span>
                <i class="fas ${statusIcon[status]}"></i>
                ${statusLabel[status] || status}
            </span>
        </div>
    </div>`;
}

function showBookingsSkeleton() {
    const rows = [1,2,3].map(() => `
        <div class="booking-card" style="border-left:5px solid #e5e9ed;">
            <div class="booking-thumb-placeholder"><i class="fas fa-mountain" style="color:#dde3ea;"></i></div>
            <div class="booking-info" style="gap:8px; display:flex; flex-direction:column;">
                <div class="skeleton" style="height:17px; width:220px;"></div>
                <div class="skeleton" style="height:13px; width:310px;"></div>
                <div class="skeleton" style="height:13px; width:150px;"></div>
            </div>
            <div class="booking-right">
                <div class="skeleton" style="height:22px; width:75px;"></div>
                <div class="skeleton" style="height:24px; width:95px; border-radius:20px;"></div>
            </div>
        </div>`).join('');
    document.getElementById('bookingsContainer').innerHTML = `<div class="booking-list">${rows}</div>`;
}

// =============================================================
// MOMENTS  (localStorage now — backend-ready)
// =============================================================

/*
 * TODO BACKEND INTEGRATION:
 * Replace localStorage with real API calls:
 *   GET  /api/moments          → loadMoments()
 *   POST /api/moments          → saveMoment()  (with multipart/form-data for image upload)
 *   DELETE /api/moments/:id    → deleteMoment()
 * Each moment shape: { id, title, date, note, imageUrl, bookingId, userId, createdAt }
 */

function getMoments() {
    try { return JSON.parse(localStorage.getItem('travelMoments')) || []; } catch { return []; }
}

function saveMomentsToStorage(moments) {
    localStorage.setItem('travelMoments', JSON.stringify(moments));
    document.getElementById('statMoments').textContent = moments.length;
}

function renderMoments() {
    const moments = getMoments();
    const grid    = document.getElementById('momentsGrid');

    document.getElementById('statMoments').textContent = moments.length;

    if (!moments.length) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <i class="fas fa-camera-retro"></i>
                <p>No moments saved yet</p>
                <small>Hit "Add Moment" to start your travel diary.</small>
            </div>`;
        return;
    }

    grid.innerHTML = moments
        .slice()
        .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
        .map(momentCard)
        .join('');
}

function momentCard(m) {
    const img = m.imageUrl
        ? `<img class="moment-img" src="${m.imageUrl}" alt="${m.title}"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="moment-img-placeholder" style="display:none;"><i class="fas fa-mountain"></i></div>`
        : `<div class="moment-img-placeholder"><i class="fas fa-mountain"></i></div>`;

    const linked = m.bookingId
        ? `<div class="moment-linked-trip"><i class="fas fa-suitcase"></i> Linked to Booking #${m.bookingId}</div>`
        : '';

    return `
    <div class="moment-card">
        <button class="moment-delete" onclick="deleteMoment('${m.id}')" title="Delete moment">
            <i class="fas fa-times"></i>
        </button>
        ${img}
        <div class="moment-body">
            <div class="moment-title">${m.title}</div>
            <div class="moment-date"><i class="fas fa-calendar-day"></i> ${m.date ? fmtDate(m.date) : 'Date not set'}</div>
            ${m.note ? `<p class="moment-note">${m.note}</p>` : ''}
            ${linked}
        </div>
    </div>`;
}

function deleteMoment(id) {
    /*
     * TODO BACKEND: await fetch(API(`/api/moments/${id}`), { method: 'DELETE', headers: authHeaders() });
     */
    const updated = getMoments().filter(m => m.id !== id);
    saveMomentsToStorage(updated);
    renderMoments();
}

// ── MODAL ─────────────────────────────────────────────────────
function openMomentModal() {
    document.getElementById('momentModal').classList.remove('hidden');
    document.getElementById('mDate').value = new Date().toISOString().split('T')[0];
}

function closeMomentModal() {
    document.getElementById('momentModal').classList.add('hidden');
    ['mTitle','mDate','mNote','mImage'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('mBooking').value = '';
}

function closeMomentModalOutside(e) {
    if (e.target === document.getElementById('momentModal')) closeMomentModal();
}

function saveMoment() {
    const title     = document.getElementById('mTitle').value.trim();
    const date      = document.getElementById('mDate').value;
    const note      = document.getElementById('mNote').value.trim();
    const imageUrl  = document.getElementById('mImage').value.trim();
    const bookingId = document.getElementById('mBooking').value;

    if (!title) {
        alert('Please enter a title or destination.');
        return;
    }

    const moment = {
        id: Date.now().toString(),
        title,
        date,
        note,
        imageUrl,
        bookingId: bookingId || null,
        savedAt: new Date().toISOString()
        /*
         * TODO BACKEND: Remove id/savedAt — let server generate these.
         * POST /api/moments with FormData if you add image upload.
         */
    };

    const moments = getMoments();
    moments.unshift(moment);
    saveMomentsToStorage(moments);
    renderMoments();
    closeMomentModal();

    // Switch to moments tab so user sees the result
    const momentsBtn = document.querySelector('.tab-btn[onclick*="moments"]');
    if (momentsBtn) switchTab('moments', momentsBtn);
}

function populateBookingDropdown(bookings) {
    const sel = document.getElementById('mBooking');
    bookings.forEach(b => {
        const opt   = document.createElement('option');
        opt.value   = b.id;
        opt.textContent = `${b.tour?.title || 'Booking'} #${b.id}`;
        sel.appendChild(opt);
    });
}

// =============================================================
// TABS
// =============================================================
function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`panel-${tab}`).classList.add('active');

    if (tab === 'moments') renderMoments();
}

// =============================================================
// LOGOUT
// =============================================================
async function handleLogout() {
    try {
        await fetch(API('/api/auth/logout'), { method: 'POST', headers: authHeaders() });
    } catch (_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function redirectLogin() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// =============================================================
// UTILS
// =============================================================
function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

// =============================================================
// INIT
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
    guardAuth();
    fetchProfile();
    fetchBookings();
    renderMoments();  // render from localStorage immediately
});