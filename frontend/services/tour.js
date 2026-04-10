const tours = [
    {
        id: 1,
        title: "Tropical Paradise Getaway",
        location: "Maldives",
        duration: "7 Days / 6 Nights",
        rating: 4.8,
        reviews: 124,
        price: "$1299",
        image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=300&fit=crop"
    },
    {
        id: 2,
        title: "Mountain Adventure Trek",
        location: "Swiss Alps",
        duration: "5 Days / 4 Nights",
        rating: 4.9,
        reviews: 89,
        price: "$899",
        image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop"
    },
    {
        id: 3,
        title: "European Heritage Tour",
        location: "Paris, France",
        duration: "6 Days / 5 Nights",
        rating: 4.7,
        reviews: 156,
        price: "$1199",
        image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop"
    },
    {
        id: 4,
        title: "Safari Wildlife Experience",
        location: "Serengeti, Tanzania",
        duration: "8 Days / 7 Nights",
        rating: 4.9,
        reviews: 73,
        price: "$2499",
        image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=300&fit=crop"
    },
    {
        id: 5,
        title: "Luxury Cruise Experience",
        location: "Mediterranean Sea",
        duration: "10 Days / 9 Nights",
        rating: 4.8,
        reviews: 201,
        price: "$1899",
        image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=300&fit=crop"
    },
    {
        id: 6,
        title: "City Explorer Package",
        location: "Tokyo, Japan",
        duration: "5 Days / 4 Nights",
        rating: 4.7,
        reviews: 142,
        price: "$1099",
        image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop"
    }
];

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    return starsHTML;
}

function renderTours() {
    const grid = document.getElementById('toursGrid');
    
    tours.forEach(tour => {
        const card = document.createElement('div');
        card.className = 'tour-card';
        card.innerHTML = `
            <div class="card-image">
                <img src="${tour.image}" alt="${tour.title}" onerror="this.src='https://via.placeholder.com/400x300/5cb85c/ffffff?text=${encodeURIComponent(tour.title)}'">
                <span class="price-tag">${tour.price}</span>
            </div>
            <div class="card-content">
                <h3>${tour.title}</h3>
                <div class="card-info">
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${tour.location}</span>
                    </div>
                    <div class="info-item">
                        <i class="far fa-clock"></i>
                        <span>${tour.duration}</span>
                    </div>
                    <div class="rating">
                        ${generateStars(tour.rating)}
                        <span>${tour.rating} (${tour.reviews} reviews)</span>
                    </div>
                </div>
                <button class="view-details-btn" onclick="viewDetails(${tour.id})">View Details</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function viewDetails(tourId) {
    const tour = tours.find(t => t.id === tourId);
    alert(`Viewing details for: ${tour.title}\nLocation: ${tour.location}\nPrice: ${tour.price}\nDuration: ${tour.duration}`);
    console.log('Viewing tour:', tour);
}

function handleLogin() {
    alert('Login functionality - Redirecting to login page...');
    window.location.href = 'login.html';
}

function handleSignup() {
    alert('Sign Up functionality - Redirecting to signup page...');
    window.location.href = 'signup.html';
}

document.addEventListener('DOMContentLoaded', renderTours);