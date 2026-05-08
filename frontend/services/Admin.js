// ─────────────────────────────────────────────────────────────────────────────
//  Travel & Tours — Admin Portal  (fully integrated with REST API)
//  API Base is read from window.APP_CONFIG.API_BASE_URL (set by config.js)
// ─────────────────────────────────────────────────────────────────────────────

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Returns the stored JWT or null */
function getToken() {
  return localStorage.getItem("token");
}

/** Authenticated fetch wrapper — throws on non-2xx */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(window.getApiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

/** Show a small toast-style alert */
function showToast(message, type = "success") {
  const existing = document.getElementById("toast-msg");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast-msg";
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    padding:12px 20px;border-radius:8px;font-size:0.9rem;
    font-family:inherit;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.18);
    background:${type === "success" ? "#22c55e" : "#ef4444"};color:#fff;
    animation:fadeIn .25s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/** Format currency */
const fmt$ = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** Format date string */
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

/** Badge HTML for booking status */
function statusBadge(status) {
  const map = { CONFIRMED: "confirmed", PENDING: "pending", CANCELLED: "cancelled" };
  const cls = map[status] || "pending";
  return `<span class="badge badge-${cls}">${status}</span>`;
}

// ─── AUTH GUARD ───────────────────────────────────────────────────────────────
async function initAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return false;
  }
  try {
    const data = await apiFetch("/api/auth/me");
    const user = data.user;

    if (user.role !== "ADMIN") {
      alert("Access denied. Admin only area.");
      localStorage.clear();
      window.location.href = "login.html";
      return false;
    }

    // Populate sidebar
    const initial = user.name ? user.name[0].toUpperCase() : "A";
    document.getElementById("adminAvatar").textContent = initial;
    document.getElementById("adminName").textContent = user.name || "Admin";

    // Store user globally
    window.__adminUser = user;
    return true;
  } catch (err) {
    localStorage.clear();
    window.location.href = "login.html";
    return false;
  }
}

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch (_) {
    // ignore errors during logout
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }
});

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: "Dashboard",
  packages: "Manage Packages",
  bookings: "Manage Bookings",
  users: "Users",
};

function showPage(name) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  document.getElementById("page-" + name)?.classList.add("active");
  document.querySelector(`.nav-item[data-page="${name}"]`)?.classList.add("active");
  document.getElementById("topbarTitle").textContent = PAGE_TITLES[name] || name;
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-page]");
  if (el) {
    e.preventDefault();
    const page = el.dataset.page;
    showPage(page);
    if (page === "packages") loadPackages();
    if (page === "bookings") loadBookings();
    if (page === "dashboard") loadDashboard();
  }
});

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [toursData, bookingsData] = await Promise.all([
      apiFetch("/api/tours"),
      apiFetch("/api/bookings/admin/all"),
    ]);

    const tours = toursData.tours || [];
    const bookings = bookingsData.bookings || [];

    // Stats
    document.getElementById("statPackages").textContent = tours.length;
    document.getElementById("statBookings").textContent = bookings.length;

    // Revenue = sum of prices of CONFIRMED bookings
    const revenue = bookings
      .filter((b) => b.status === "CONFIRMED")
      .reduce((sum, b) => sum + (b.tour?.price || 0), 0);
    document.getElementById("statRevenue").textContent = fmt$(revenue);

    // Users stat — we don't have a users endpoint, show unique users
    const uniqueUsers = new Set(bookings.map((b) => b.user?.id)).size;
    document.getElementById("statUsers").textContent = uniqueUsers || "—";

    // Recent bookings table (last 5)
    const recent = [...bookings].reverse().slice(0, 5);
    const tbody = document.getElementById("recentBookingsBody");
    if (tbody) {
      tbody.innerHTML = recent.length
        ? recent
            .map(
              (b) => `
          <tr>
            <td class="cell-green">#BK${String(b.id).padStart(3, "0")}</td>
            <td class="cell-green">${b.user?.name || "—"}</td>
            <td class="cell-green">${b.tour?.title || "—"}</td>
            <td>${fmtDate(b.createdAt)}</td>
            <td>${statusBadge(b.status)}</td>
            <td>${fmt$(b.tour?.price || 0)}</td>
          </tr>`
            )
            .join("")
        : `<tr><td colspan="6" style="text-align:center;color:#888;padding:20px">No bookings yet.</td></tr>`;
    }

    // Popular packages — most booked tours
    const tourBookingCount = {};
    bookings.forEach((b) => {
      if (b.tourId) tourBookingCount[b.tourId] = (tourBookingCount[b.tourId] || 0) + 1;
    });
    const popular = [...tours]
      .sort((a, b) => (tourBookingCount[b.id] || 0) - (tourBookingCount[a.id] || 0))
      .slice(0, 5);

    const ppBody = document.getElementById("popularPackagesBody");
    if (ppBody) {
      ppBody.innerHTML = popular.length
        ? popular
            .map(
              (t) => `
          <tr>
            <td class="cell-green">${t.title}</td>
            <td>${t.destination}</td>
            <td>${fmt$(t.price)}</td>
            <td>${tourBookingCount[t.id] || 0}</td>
            <td>—</td>
          </tr>`
            )
            .join("")
        : `<tr><td colspan="5" style="text-align:center;color:#888;padding:20px">No packages yet.</td></tr>`;
    }
  } catch (err) {
    showToast("Failed to load dashboard: " + err.message, "error");
  }
}

// ─── PACKAGES ────────────────────────────────────────────────────────────────
let allTours = [];

async function loadPackages() {
  const tbody = document.getElementById("packagesTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#888"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;

  try {
    const data = await apiFetch("/api/tours");
    allTours = data.tours || [];
    renderPackagesTable(allTours);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#ef4444;padding:20px">Failed to load packages: ${err.message}</td></tr>`;
  }
}

function renderPackagesTable(tours) {
  const tbody = document.getElementById("packagesTableBody");
  if (!tbody) return;

  tbody.innerHTML = tours.length
    ? tours
        .map(
          (t) => `
      <tr data-tour-id="${t.id}">
        <td class="cell-green">${t.title}</td>
        <td>${t.destination}</td>
        <td>${fmt$(t.price)}</td>
        <td>${t.durationDays} days</td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon" onclick="openEditModal(${t.id})" title="Edit"><i class="fas fa-pen"></i></button>
            <button class="btn-icon danger" onclick="deleteTour(${t.id}, '${t.title.replace(/'/g, "\\'")}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="5" style="text-align:center;color:#888;padding:20px">No packages yet. Create one!</td></tr>`;
}

async function deleteTour(id, title) {
  if (!confirm(`Delete "${title}"?\n\nThis cannot be undone.`)) return;
  try {
    await apiFetch(`/api/tours/${id}`, { method: "DELETE" });
    showToast(`"${title}" deleted successfully.`);
    allTours = allTours.filter((t) => t.id !== id);
    renderPackagesTable(allTours);
    // Refresh dashboard stats if needed
  } catch (err) {
    showToast("Delete failed: " + err.message, "error");
  }
}

// ─── MODAL — CREATE / EDIT ─────────────────────────────────────────────────
let dayCount = 0;
let editingTourId = null; // null = create mode, number = edit mode

function openCreateModal() {
  editingTourId = null;
  document.getElementById("modalTitle").textContent = "Create New Package";
  document.getElementById("modalSubtitle").textContent = "Add a new travel package to your catalog";
  document.getElementById("savePackageBtn").textContent = "Save Package";
  resetModal();
  document.getElementById("packageModal").classList.remove("hidden");
}

function openEditModal(tourId) {
  const tour = allTours.find((t) => t.id === tourId);
  if (!tour) return;

  editingTourId = tourId;
  document.getElementById("modalTitle").textContent = "Edit Package";
  document.getElementById("modalSubtitle").textContent = "Update the details of this package";
  document.getElementById("savePackageBtn").textContent = "Update Package";
  resetModal();

  // Populate fields
  document.getElementById("pkgTitle").value = tour.title || "";
  document.getElementById("pkgDestination").value = tour.destination || "";
  document.getElementById("pkgDuration").value = tour.durationDays || "";
  document.getElementById("pkgPrice").value = tour.price || "";
  document.getElementById("pkgDescription").value = tour.description || "";
  document.getElementById("pkgImage").value = (tour.images || [])[0] || "";

  // Itinerary — clear default days and repopulate from stored itinerary string
  document.getElementById("itineraryDays").innerHTML = "";
  dayCount = 0;
  if (tour.itinerary) {
    // Try to split by "Day N:" pattern
    const lines = tour.itinerary.split(/\r?\n/).filter(Boolean);
    lines.forEach((line) => addDay("", line));
  } else {
    addDay();
  }

  // Inclusions
  document.getElementById("includedList").innerHTML = "";
  document.getElementById("excludedList").innerHTML = "";
  if (tour.included) {
    tour.included.split(",").forEach((item) => {
      const trimmed = item.trim();
      if (trimmed) addItem("included", trimmed);
    });
  }
  if (!document.getElementById("includedList").children.length) addItem("included");

  document.getElementById("packageModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("packageModal").classList.add("hidden");
  editingTourId = null;
}

document.getElementById("newPackageBtn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  openCreateModal();
});

document.getElementById("modalClose")?.addEventListener("click", closeModal);
document.getElementById("cancelModalBtn")?.addEventListener("click", closeModal);

document.getElementById("packageModal")?.addEventListener("click", (e) => {
  if (e.target === document.getElementById("packageModal")) closeModal();
});

// ─── SAVE / UPDATE PACKAGE ───────────────────────────────────────────────────
document.getElementById("savePackageBtn")?.addEventListener("click", async () => {
  const title = document.getElementById("pkgTitle").value.trim();
  const destination = document.getElementById("pkgDestination").value.trim();
  const durationDays = parseInt(document.getElementById("pkgDuration").value, 10);
  const price = parseFloat(document.getElementById("pkgPrice").value);
  const description = document.getElementById("pkgDescription").value.trim();
  const imageUrl = document.getElementById("pkgImage").value.trim();

  // Basic validation
  if (!title || !destination || !durationDays || !price || !description) {
    showToast("Please fill in all required fields.", "error");
    return;
  }

  // Build itinerary string from day blocks
  const itinerary = Array.from(document.querySelectorAll(".day-block"))
    .map((block, i) => {
      const dayTitle = block.querySelector(".day-title")?.value?.trim() || "";
      const dayDesc = block.querySelector(".day-desc")?.value?.trim() || "";
      return `Day ${i + 1}: ${dayTitle}${dayDesc ? " — " + dayDesc : ""}`;
    })
    .join("\n");

  // Build included string
  const included = Array.from(document.querySelectorAll("#includedList .item-row input"))
    .map((inp) => inp.value.trim())
    .filter(Boolean)
    .join(", ");

  const payload = {
    title,
    destination,
    durationDays,
    price,
    description,
    itinerary,
    included,
    images: imageUrl ? [imageUrl] : [],
  };

  const saveBtn = document.getElementById("savePackageBtn");
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving…`;

  try {
    if (editingTourId) {
      // UPDATE
      const data = await apiFetch(`/api/tours/${editingTourId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const updated = data.tour;
      allTours = allTours.map((t) => (t.id === editingTourId ? updated : t));
      showToast(`"${updated.title}" updated successfully!`);
    } else {
      // CREATE
      const data = await apiFetch("/api/tours", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      allTours.push(data.tour);
      showToast(`"${data.tour.title}" created successfully!`);
    }

    renderPackagesTable(allTours);
    closeModal();
  } catch (err) {
    showToast("Save failed: " + err.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = editingTourId ? "Update Package" : "Save Package";
  }
});

// ─── RESET MODAL ─────────────────────────────────────────────────────────────
function resetModal() {
  ["pkgTitle", "pkgDestination", "pkgDuration", "pkgPrice", "pkgDescription", "pkgImage"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("itineraryDays").innerHTML = "";
  document.getElementById("includedList").innerHTML = "";
  document.getElementById("excludedList").innerHTML = "";
  dayCount = 0;
  addDay();
  addDay();
  addDay();
  addItem("included");
  addItem("included");
  addItem("included");
  addItem("excluded");
  addItem("excluded");
}

// ─── ITINERARY DAYS ───────────────────────────────────────────────────────────
function addDay(titleVal = "", descVal = "") {
  dayCount++;
  const n = dayCount;
  const container = document.getElementById("itineraryDays");
  const div = document.createElement("div");
  div.className = "day-block";
  div.innerHTML = `
    <div class="day-label">
      <div class="day-badge">${n}</div>
      <span>Day ${n}</span>
    </div>
    <div class="field">
      <label>Activity Title</label>
      <input type="text" class="day-title" placeholder="e.g., Arrival and Beach Exploration" value="${titleVal}"/>
    </div>
    <div class="field" style="margin-bottom:0">
      <label>Description</label>
      <textarea class="day-desc" rows="2" placeholder="Describe what happens on this day…">${descVal}</textarea>
    </div>
  `;
  container.appendChild(div);
}

document.getElementById("addDayBtn")?.addEventListener("click", () => addDay());

// ─── INCLUSIONS / EXCLUSIONS ──────────────────────────────────────────────────
function addItem(type, text = "") {
  const listEl = document.getElementById(type + "List");
  const placeholders =
    type === "included"
      ? ["Airport transfers", "Hotel accommodation", "Daily breakfast"]
      : ["International flights", "Travel insurance", "Personal expenses"];
  const placeholder = placeholders[listEl.children.length % 3];
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <i class="fas ${type === "included" ? "fa-check-circle green-text" : "fa-times-circle red-text"}" style="font-size:0.85rem;flex-shrink:0"></i>
    <input type="text" placeholder="e.g., ${placeholder}" value="${text}"/>
    <button class="item-remove" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
  `;
  listEl.appendChild(row);
}

document.getElementById("addIncludedBtn")?.addEventListener("click", () => addItem("included"));
document.getElementById("addExcludedBtn")?.addEventListener("click", () => addItem("excluded"));

// ─── BOOKINGS ────────────────────────────────────────────────────────────────
let allBookings = [];

async function loadBookings() {
  const tbody = document.getElementById("bookingsTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#888"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;

  try {
    const data = await apiFetch("/api/bookings/admin/all");
    allBookings = data.bookings || [];
    renderBookingsTable(allBookings);
    setupBookingFilters();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#ef4444;padding:20px">Failed to load bookings: ${err.message}</td></tr>`;
  }
}

function renderBookingsTable(bookings) {
  const tbody = document.getElementById("bookingsTableBody");
  if (!tbody) return;

  tbody.innerHTML = bookings.length
    ? bookings
        .map(
          (b) => `
      <tr data-booking-id="${b.id}">
        <td class="cell-green">#BK${String(b.id).padStart(3, "0")}</td>
        <td>
          <div class="customer-cell">
            <div class="customer-avatar">${(b.user?.name || "?")[0].toUpperCase()}</div>
            <div>
              <div class="customer-name">${b.user?.name || "—"}</div>
              <div class="customer-email">${b.user?.email || b.contactEmail || "—"}</div>
            </div>
          </div>
        </td>
        <td class="cell-green">${b.tour?.title || "—"}</td>
        <td>${fmtDate(b.createdAt)}</td>
        <td>—</td>
        <td>${fmt$(b.tour?.price || 0)}</td>
        <td>${statusBadge(b.status)}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon" onclick="viewBooking(${b.id})" title="View details"><i class="fas fa-eye"></i></button>
            <button class="btn-icon" onclick="openStatusModal(${b.id}, '${b.status}')" title="Update status"><i class="fas fa-pen"></i></button>
          </div>
        </td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="8" style="text-align:center;color:#888;padding:20px">No bookings found.</td></tr>`;
}

/** Show booking detail in a simple alert (can be enhanced later) */
function viewBooking(id) {
  const b = allBookings.find((x) => x.id === id);
  if (!b) return;
  alert(
    `Booking #BK${String(b.id).padStart(3, "0")}\n\n` +
      `Customer: ${b.user?.name || "—"} (${b.user?.email || b.contactEmail})\n` +
      `Tour: ${b.tour?.title || "—"}\n` +
      `Passport: ${b.passportNumber || "—"}\n` +
      `Status: ${b.status}\n` +
      `Price: ${fmt$(b.tour?.price || 0)}\n` +
      `Booked on: ${fmtDate(b.createdAt)}`
  );
}

/** Inline status update dropdown */
function openStatusModal(bookingId, currentStatus) {
  const statusOptions = ["PENDING", "CONFIRMED", "CANCELLED"];
  const choice = prompt(
    `Update status for #BK${String(bookingId).padStart(3, "0")}\n\nCurrent: ${currentStatus}\n\nEnter new status:\n  • PENDING\n  • CONFIRMED\n  • CANCELLED`,
    currentStatus
  );
  if (!choice) return;
  const newStatus = choice.trim().toUpperCase();
  if (!statusOptions.includes(newStatus)) {
    showToast("Invalid status. Use PENDING, CONFIRMED, or CANCELLED.", "error");
    return;
  }
  if (newStatus === currentStatus) return;
  updateBookingStatus(bookingId, newStatus);
}

async function updateBookingStatus(bookingId, newStatus) {
  try {
    await apiFetch(`/api/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    allBookings = allBookings.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b));
    renderBookingsTable(filterBookingsList());
    showToast(`Booking #BK${String(bookingId).padStart(3, "0")} updated to ${newStatus}.`);
  } catch (err) {
    showToast("Status update failed: " + err.message, "error");
  }
}

/** Returns currently filtered bookings based on search and status inputs */
function filterBookingsList() {
  const search = (document.getElementById("bookingSearch")?.value || "").toLowerCase();
  const statusVal = (document.getElementById("statusFilter")?.value || "").toUpperCase();

  return allBookings.filter((b) => {
    const matchSearch =
      !search ||
      b.user?.name?.toLowerCase().includes(search) ||
      b.tour?.title?.toLowerCase().includes(search) ||
      b.contactEmail?.toLowerCase().includes(search) ||
      String(b.id).includes(search);

    const matchStatus = !statusVal || b.status === statusVal;

    return matchSearch && matchStatus;
  });
}

function setupBookingFilters() {
  const searchInput = document.getElementById("bookingSearch");
  const statusSelect = document.getElementById("statusFilter");

  const handler = () => renderBookingsTable(filterBookingsList());

  if (searchInput) {
    searchInput.removeEventListener("input", handler);
    searchInput.addEventListener("input", handler);
  }
  if (statusSelect) {
    statusSelect.removeEventListener("change", handler);
    statusSelect.addEventListener("change", handler);
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
(async () => {
  const authed = await initAuth();
  if (!authed) return;

  showPage("dashboard");
  loadDashboard();
})();