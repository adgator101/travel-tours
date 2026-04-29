// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = (path) => window.getApiUrl?.(path) || path;

// ─── AUTH HELPER ──────────────────────────────────────────────────────────────
function getToken() {
    return localStorage.getItem('token');
}

function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
function showLoading() {
    const grid = document.getElementById('toursGrid');
    grid.innerHTML = `
        <div class="loading-state" style="grid-column: 1/-1; text-align:center; padding: 60px 20px; color: #888;">
            <i class="fas fa-spinner fa-spin" style="font-size:32px; color:#5cb85c; margin-bottom:12px; display:block;"></i>
            <p style="font-size:15px;">Loading tours...</p>
        </div>
    `;
}

function showError(message, isAuthError = false) {
    const grid = document.getElementById('toursGrid');
    grid.innerHTML = `
        <div class="error-state" style="grid-column: 1/-1; text-align:center; padding: 60px 20px; color: #888;">
            <i class="fas fa-exclamation-circle" style="font-size:32px; color:#e74c3c; margin-bottom:12px; display:block;"></i>
            <p style="font-size:15px; color:#e74c3c; margin-bottom:8px;">${message}</p>
            ${isAuthError ? `
                <div style="margin-top:16px; display:flex; gap:10px; justify-content:center;">
                    <button onclick="handleLogin()" style="padding:10px 24px; background:#5cb85c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">
                        Go to Login
                    </button>
                </div>
            ` : `
                <button onclick="fetchTours()" style="margin-top:16px; padding:10px 24px; background:#5cb85c; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">
                    Try Again
                </button>
            `}
        </div>
    `;
}

function generateStars(rating) {
    if (!rating) return '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    return starsHTML;
}

// ─── AUTH BUTTONS UPDATE ──────────────────────────────────────────────────────
function updateAuthButtons() {
    const token = getToken();
    const authContainer = document.getElementById('authButtons');
    
    if (token) {
        // User logged in cha
        authContainer.innerHTML = `
            <button class="btn" onclick="handleProfile()">
                <i class="fas fa-user"></i> Profile
            </button>
            <button class="btn" onclick="handleLogout()" style="border-color:#e74c3c; color:#e74c3c;">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
    } else {
        // User logged in chaina
        authContainer.innerHTML = `
            <button class="btn" onclick="handleLogin()">Login</button>
            <button class="btn btn-primary" onclick="handleSignup()">Sign Up</button>
        `;
    }
}

// ─── FETCH ALL TOURS (GET /api/tours) ─────────────────────────────────────────
async function fetchTours() {
    showLoading();

    try {
        const response = await fetch(API_BASE('/api/tours'), {
            method: 'GET',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                showError('Please log in to view tours.', true);
                return;
            }
            throw new Error(data.message || `Failed to load tours (Status: ${response.status})`);
        }

        if (data.success && data.tours) {
            renderTours(data.tours);
        } else {
            showError('No tours found.');
        }

    } catch (err) {
        console.error('Error fetching tours:', err);
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
            showError('Could not connect to the server. Please check your internet connection.');
        } else {
            showError(err.message || 'An unexpected error occurred.');
        }
    }
}

// ─── RENDER TOURS GRID ────────────────────────────────────────────────────────
function renderTours(tours) {
    const grid = document.getElementById('toursGrid');

    if (!tours || tours.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#888;">
                <i class="fas fa-map-marked-alt" style="font-size:32px; margin-bottom:12px; display:block;"></i>
                <p>No tours available right now.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';

    tours.forEach(tour => {
        const card = document.createElement('div');
        card.className = 'tour-card';

        const imageUrl = (tour.images && tour.images.length > 0)
            ? tour.images[0]
            : `https://via.placeholder.com/400x300/5cb85c/ffffff?text=${encodeURIComponent(tour.title)}`;

        const priceFormatted = tour.price
            ? `$${Number(tour.price).toLocaleString()}`
            : 'N/A';

        const duration = tour.durationDays
            ? `${tour.durationDays} Days`
            : 'N/A';

        card.innerHTML = `
            <div class="card-image">
                <img 
                    src="${imageUrl}" 
                    alt="${tour.title}" 
                    loading="lazy"
                    onerror="this.src='https://via.placeholder.com/400x300/5cb85c/ffffff?text=${encodeURIComponent(tour.title)}'"
                >
                <span class="price-tag">${priceFormatted}</span>
            </div>
            <div class="card-content">
                <h3>${tour.title}</h3>
                <div class="card-info">
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${tour.destination || 'Unknown'}</span>
                    </div>
                    <div class="info-item">
                        <i class="far fa-clock"></i>
                        <span>${duration}</span>
                    </div>
                    ${tour.description ? `
                    <div class="info-item">
                        <i class="fas fa-info-circle"></i>
                        <span style="overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${tour.description}</span>
                    </div>` : ''}
                </div>
                <button class="view-details-btn" onclick="viewDetails(${tour.id})">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        `;

        grid.appendChild(card);
    });
}

// ─── VIEW TOUR DETAILS (GET /api/tours/:id) ───────────────────────────────────
async function viewDetails(tourId) {
    showDetailsModal(null, true);

    try {
        const response = await fetch(API_BASE(`/api/tours/${tourId}`), {
            method: 'GET',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                closeModal();
                showError('Please log in to view tour details.', true);
                return;
            }
            throw new Error(data.message || 'Tour not found');
        }

        if (data.success && data.tour) {
            showDetailsModal(data.tour, false);
        } else {
            closeModal();
            alert('Tour details not available.');
        }

    } catch (err) {
        console.error('Error fetching tour details:', err);
        closeModal();
        alert('Could not load tour details. Please try again.');
    }
}

// ─── DETAILS MODAL ────────────────────────────────────────────────────────────
function showDetailsModal(tour, isLoading) {
    const existing = document.getElementById('tourModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'tourModal';
    modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.55);
        display: flex; align-items: center; justify-content: center;
        z-index: 1000; padding: 20px;
    `;

    if (isLoading) {
        modal.innerHTML = `
            <div style="background:#fff; border-radius:12px; padding:40px; text-align:center; min-width:280px;">
                <i class="fas fa-spinner fa-spin" style="font-size:28px; color:#5cb85c;"></i>
                <p style="margin-top:12px; color:#888;">Loading tour details...</p>
            </div>
        `;
    } else {
        const imageUrl = (tour.images && tour.images.length > 0)
            ? tour.images[0]
            : `https://via.placeholder.com/600x300/5cb85c/ffffff?text=${encodeURIComponent(tour.title)}`;

        const priceFormatted = tour.price ? `$${Number(tour.price).toLocaleString()}` : 'N/A';
        const duration = tour.durationDays ? `${tour.durationDays} Days` : 'N/A';

        modal.innerHTML = `
            <div style="background:#fff; border-radius:12px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto; position:relative;">
                <button onclick="closeModal()" style="
                    position:sticky; top:10px; left:100%; float:right; margin:10px 10px 0 0;
                    background:#fff; border:1px solid #ddd; border-radius:50%;
                    width:32px; height:32px; cursor:pointer; font-size:16px; color:#666;
                    display:flex; align-items:center; justify-content:center; z-index:10;
                ">✕</button>

                <img src="${imageUrl}" alt="${tour.title}" 
                    onerror="this.src='https://via.placeholder.com/600x300/5cb85c/ffffff?text=${encodeURIComponent(tour.title)}'"
                    style="width:100%; height:220px; object-fit:cover; border-radius:12px 12px 0 0; display:block;"
                >

                <div style="padding:24px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                        <h2 style="font-size:20px; color:#333; font-weight:600; flex:1; margin-right:12px;">${tour.title}</h2>
                        <span style="background:#5cb85c; color:white; padding:6px 14px; border-radius:20px; font-size:14px; font-weight:600; white-space:nowrap;">${priceFormatted}</span>
                    </div>

                    <div style="display:flex; gap:20px; margin-bottom:20px; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:6px; color:#666; font-size:13px;">
                            <i class="fas fa-map-marker-alt" style="color:#5cb85c;"></i>
                            <span>${tour.destination || 'N/A'}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px; color:#666; font-size:13px;">
                            <i class="far fa-clock" style="color:#5cb85c;"></i>
                            <span>${duration}</span>
                        </div>
                    </div>

                    ${tour.description ? `
                    <div style="margin-bottom:16px;">
                        <h4 style="font-size:14px; font-weight:600; color:#333; margin-bottom:6px;">About this Tour</h4>
                        <p style="font-size:13px; color:#666; line-height:1.6;">${tour.description}</p>
                    </div>` : ''}

                    ${tour.itinerary ? `
                    <div style="margin-bottom:16px;">
                        <h4 style="font-size:14px; font-weight:600; color:#333; margin-bottom:6px;">Itinerary</h4>
                        <p style="font-size:13px; color:#666; line-height:1.7; white-space:pre-line;">${tour.itinerary}</p>
                    </div>` : ''}

                    ${tour.included ? `
                    <div style="margin-bottom:20px;">
                        <h4 style="font-size:14px; font-weight:600; color:#333; margin-bottom:6px;">What's Included</h4>
                        <p style="font-size:13px; color:#666; line-height:1.6;">${tour.included}</p>
                    </div>` : ''}

                    <button onclick="closeModal()" style="
                        width:100%; padding:13px; background:#5cb85c; color:white;
                        border:none; border-radius:8px; cursor:pointer; font-size:15px;
                        font-weight:500;
                    ">
                        Close
                    </button>
                </div>
            </div>
        `;
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Background scroll rokne
}

function closeModal() {
    const modal = document.getElementById('tourModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = ''; // Scroll enable garne
    }
}

// ─── AUTH BUTTONS ─────────────────────────────────────────────────────────────
function handleLogin() {
    window.location.href = 'login.html';
}

function handleSignup() {
    window.location.href = 'signup.html';
}

function handleProfile() {
    window.location.href = 'profile.html';
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthButtons();
    fetchTours(); // Refresh to show login required
    alert('Logged out successfully!');
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    fetchTours();
});