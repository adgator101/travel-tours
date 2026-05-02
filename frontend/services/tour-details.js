// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE_DET = (path) => window.getApiUrl?.(path) || path;

function getTokenDet() {
    return localStorage.getItem('token');
}

function getAuthHeadersDet() {
    const token = getTokenDet();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

// ─── LOAD TOUR FROM API ───────────────────────────────────────────────────────
async function loadTourDetails() {
    const params = new URLSearchParams(window.location.search);
    const tourId = params.get('id');
    if (!tourId) return;

    try {
        const response = await fetch(API_BASE_DET(`/api/tours/${tourId}`), {
            method: 'GET',
            headers: getAuthHeadersDet()
        });
        const data = await response.json();
        if (!response.ok || !data.success || !data.tour) return;

        const tour = data.tour;
        const FALLBACK = 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=400&fit=crop';

        // ── Page title
        document.title = `${tour.title} - Travel Tours`;

        // ── Hero image
        const heroImg = document.querySelector('.hero-image');
        if (heroImg) {
            const imgSrc = (tour.images && tour.images.length > 0 && tour.images[0])
                ? tour.images[0] : FALLBACK;
            heroImg.src = imgSrc;
            heroImg.alt = tour.title || 'Tour Image';
            heroImg.onerror = function () { this.onerror = null; this.src = FALLBACK; };
        }

        // ── Badge
        const badge = document.querySelector('.badge');
        if (badge && tour.durationDays)
            badge.textContent = `${tour.durationDays} Days / ${tour.durationDays - 1} Nights`;

        // ── Hero title & location
        const heroTitle = document.querySelector('.hero h1');
        if (heroTitle) heroTitle.textContent = tour.title;
        const locationEl = document.querySelector('.hero-meta .location');
        if (locationEl && tour.destination) locationEl.textContent = tour.destination;

        // ── About
        const aboutP = document.querySelector('.about-section p');
        if (aboutP && tour.description) aboutP.textContent = tour.description;

        // ── Price & sidebar
        const priceEl = document.querySelector('.price');
        if (priceEl && tour.price) priceEl.textContent = `$${Number(tour.price).toLocaleString()}`;
        const sidebarValues = document.querySelectorAll('.info-item .info-value');
        if (sidebarValues[0] && tour.durationDays)
            sidebarValues[0].textContent = `${tour.durationDays} Days / ${tour.durationDays - 1} Nights`;
        if (sidebarValues[1] && tour.destination)
            sidebarValues[1].textContent = tour.destination;

        // ── ITINERARY
        // Fallback itinerary if backend data is empty/too short
        const DEFAULT_ITINERARY = [
            { title: 'Arrival & Orientation', desc: 'Arrive at destination. Meet your guide and group. Equipment check and safety briefing. Check into accommodation.' },
            { title: 'Acclimatization Day', desc: 'Easy warm-up hike to adjust to altitude. Explore local villages and culture. Briefing on the days ahead.' },
            { title: 'Trek Begins', desc: 'Start the main trek. Scenic trail through forests and alpine meadows. Lunch with mountain views.' },
            { title: 'High Altitude Section', desc: 'Challenge the higher elevation trails. Reach key viewpoints. Photography opportunities with panoramic views.' },
            { title: 'Summit / Highlight Day', desc: 'The most rewarding day of the trek. Reach the main destination. Celebrate with the group.' },
            { title: 'Descent', desc: 'Begin the return journey. Enjoy the scenery from a new perspective. Rest at camp.' },
            { title: 'Return & Departure', desc: 'Final descent to base. Certificate ceremony. Transfer to departure point. Farewell dinner.' },
        ];

        const timeline = document.querySelector('.timeline');
        if (timeline) {
            let itineraryItems = [];

            if (tour.itinerary) {
                const lines = tour.itinerary.split('\n').filter(l => l.trim());
                // Only use API data if it has real content (not just "Day 1...")
                const hasRealContent = lines.some(l => l.trim().length > 10 && !l.match(/^Day \d+\.{0,3}$/i));
                if (hasRealContent) {
                    itineraryItems = lines.map((line, i) => ({ title: `Day ${i + 1}`, desc: line.trim() }));
                }
            }

            // Use default if no real itinerary from backend
            if (itineraryItems.length === 0) {
                const days = tour.durationDays || 7;
                itineraryItems = DEFAULT_ITINERARY.slice(0, Math.min(days, DEFAULT_ITINERARY.length));
            }

            timeline.innerHTML = itineraryItems.map((item, i) => `
                <div class="timeline-item">
                    <div class="timeline-number">${i + 1}</div>
                    <div class="timeline-content">
                        <h3>${item.title}</h3>
                        <p>${item.desc}</p>
                    </div>
                </div>
            `).join('');

            // Re-apply animation observer to new items
            timeline.querySelectorAll('.timeline-item').forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                item.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
                observer.observe(item);
            });
        }

        // ── GALLERY — always 4 unique images
        const CURATED_POOL = [
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop',
        ];

        const galleryGrid = document.querySelector('.gallery-grid');
        if (galleryGrid) {
            // Use only the FIRST real image (avoid duplicate), then fill from pool
            const realImages = (tour.images && tour.images.length > 0) ? [tour.images[0]] : [];
            const galleryImages = [...realImages];

            for (let i = 0; i < CURATED_POOL.length && galleryImages.length < 4; i++) {
                galleryImages.push(CURATED_POOL[i]);
            }

            galleryGrid.innerHTML = galleryImages.slice(0, 4).map(img =>
                `<img src="${img}" alt="${tour.title}" loading="lazy"
                    onerror="this.onerror=null;this.src='${FALLBACK}'">`
            ).join('');
        }

        // ── WHAT'S INCLUDED
        const DEFAULT_INCLUDED = [
            'Professional guide', 'Accommodation', 'All meals during trek',
            'Trekking equipment', 'Group transfer', 'Completion certificate'
        ];
        const DEFAULT_EXCLUDED = [
            'International flights', 'Travel insurance',
            'Personal hiking gear', 'Tips for guides', 'Additional snacks'
        ];

        const inclusionsUl = document.querySelector('.inclusions ul');
        if (inclusionsUl) {
            let items = [];
            if (tour.included) {
                items = tour.included.split(',').map(i => i.trim()).filter(Boolean);
            }
            // Use default if backend has too few items
            if (items.length < 3) items = DEFAULT_INCLUDED;
            inclusionsUl.innerHTML = items.map(i => `<li>${i}</li>`).join('');
        }

        // What's Not Included — keep static HTML but ensure it's visible
        const exclusionsUl = document.querySelector('.exclusions ul');
        if (exclusionsUl && exclusionsUl.querySelectorAll('li').length === 0) {
            exclusionsUl.innerHTML = DEFAULT_EXCLUDED.map(i => `<li>${i}</li>`).join('');
        }

    } catch (err) {
        console.error('Error loading tour details:', err);
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

document.querySelector('.book-btn')?.addEventListener('click', function () {
    alert('Booking feature coming soon!');
});
document.querySelector('.contact-btn')?.addEventListener('click', function () {
    alert('Contact form coming soon!');
});

const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.timeline-item').forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        observer.observe(item);
    });
    loadTourDetails();
});