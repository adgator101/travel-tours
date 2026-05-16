const API = 'https://travel-tours-app.happygrass-dcd4e26f.centralindia.azurecontainerapps.io';

// ─── AUTH GUARD ───────────────────────────────────────────────────────────────
(function () {
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "null");
  if (!token || !user) { window.location.href = "login.html"; return; }
  if (user.role !== "ADMIN") { alert("Access denied. Admin only."); window.location.href = "index.html"; return; }
  const initials = user.name ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "A";
  document.getElementById("adminAvatar").textContent = initials;
  document.getElementById("adminName").textContent   = user.name || "Admin Portal";
})();

// Fix Auth_22 — prevent back button access after logout
window.addEventListener("pageshow", (e) => {
  if (e.persisted) {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "login.html";
  }
});

function getToken() { return localStorage.getItem("token") || ""; }

async function apiFetch(path, opts = {}) {
  const res = await fetch(window.getApiUrl ? window.getApiUrl(path) : API + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken(),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: "Dashboard",
  packages:  "Manage Packages",
  bookings:  "Manage Bookings",
  users:     "Users",
};

function showPage(name) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  document.getElementById("page-" + name)?.classList.add("active");
  document.querySelector(`.nav-item[data-page="${name}"]`)?.classList.add("active");
  document.getElementById("topbarTitle").textContent = PAGE_TITLES[name] || name;
  if (name === "dashboard") loadDashboard();
  if (name === "packages")  loadPackages();
  if (name === "bookings")  loadBookings();
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-page]");
  if (el) { e.preventDefault(); showPage(el.dataset.page); }
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch (_) {}
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  history.replaceState(null, "", "login.html");
  window.location.href = "login.html";
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
}
function showToast(msg, type = "success") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = "position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:10px;font-size:0.9rem;font-weight:600;z-index:9999;transition:opacity 0.3s;";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = type === "success" ? "#4CAF50" : "#e53935";
  toast.style.color   = "#fff";
  toast.style.display = "block";
  toast.style.opacity = "1";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = "none"; }, 3500);
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const { tours } = await apiFetch("/api/tours");
    document.getElementById("statPackages").textContent = tours.length;
    const pkgBody = document.getElementById("popularPackagesBody");
    pkgBody.innerHTML = tours.length
      ? tours.slice(0, 5).map((t) => `
          <tr>
            <td class="cell-green">${esc(t.title)}</td>
            <td>${esc(t.destination)}</td>
            <td>$${Number(t.price).toLocaleString()}</td>
            <td>—</td><td>—</td>
          </tr>`).join("")
      : `<tr><td colspan="5" class="loading-cell">No packages yet</td></tr>`;
  } catch (err) {
    document.getElementById("statPackages").textContent = "—";
  }

  try {
    const { bookings } = await apiFetch("/api/bookings/admin/all");
    document.getElementById("statBookings").textContent = bookings.length;
    const revenue = bookings.reduce((sum, b) => sum + Number(b.tour?.price || 0), 0);
    document.getElementById("statRevenue").textContent = "$" + revenue.toLocaleString();
    const tbody  = document.getElementById("recentBookingsBody");
    const recent = bookings.slice(0, 3);
    tbody.innerHTML = recent.length
      ? recent.map((b) => {
          const statusClass = { confirmed: "badge-confirmed", pending: "badge-pending", cancelled: "badge-cancelled" }[(b.status || "").toLowerCase()] || "badge-pending";
          return `<tr>
            <td class="cell-green">#${esc(String(b.id))}</td>
            <td class="cell-green">${esc(b.user?.name || "—")}</td>
            <td class="cell-green">${esc(b.tour?.title || "—")}</td>
            <td>${esc(b.createdAt?.slice(0, 10) || "—")}</td>
            <td><span class="badge ${statusClass}">${capitalize(b.status)}</span></td>
            <td>$${Number(b.tour?.price || 0).toLocaleString()}</td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="6" class="loading-cell">No bookings yet</td></tr>`;
  } catch (err) {
    document.getElementById("statBookings").textContent = "—";
    document.getElementById("statRevenue").textContent  = "—";
    document.getElementById("recentBookingsBody").innerHTML = `<tr><td colspan="6" class="loading-cell">Could not load bookings</td></tr>`;
  }

  document.getElementById("statUsers").textContent = "—";
}

// ─── PACKAGES ─────────────────────────────────────────────────────────────────
let allTours     = [];
let editingTourId = null;

async function loadPackages() {
  const tbody = document.getElementById("packagesTableBody");
  tbody.innerHTML = `<tr><td colspan="5" class="loading-cell"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;
  try {
    const { tours } = await apiFetch("/api/tours");
    allTours = tours;
    renderPackagesTable(tours);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="loading-cell">Failed to load packages</td></tr>`;
    showToast(err.message, "error");
  }
}

function renderPackagesTable(tours) {
  const tbody = document.getElementById("packagesTableBody");
  if (!tours.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No packages yet. Create one!</td></tr>`;
    return;
  }
  tbody.innerHTML = tours.map((t) => `
    <tr>
      <td class="cell-green">${esc(t.title)}</td>
      <td>${esc(t.destination)}</td>
      <td>$${Number(t.price).toLocaleString()}</td>
      <td>${t.durationDays} days</td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon" title="Edit" onclick="openEditModalById(${t.id})"><i class="fas fa-pen"></i></button>
          <button class="btn-icon danger" title="Delete" onclick="deletePackage(${t.id})"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join("");
}

async function deletePackage(id) {
  showConfirmModal(
    "Are you sure you want to delete this package? This cannot be undone.",
    async () => {
      try {
        await apiFetch(`/api/tours/${id}`, { method: "DELETE" });
        showToast("Package deleted successfully.");
        loadPackages();
      } catch (err) {
        showToast(err.message, "error");
      }
    },
    "danger"
  );
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
let bookingsData = [];
let bookingPage  = 1;
const PER_PAGE   = 5;

async function loadBookings() {
  const tbody = document.getElementById("bookingsTableBody");
  tbody.innerHTML = `<tr><td colspan="8" class="loading-cell"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>`;
  try {
    const { bookings } = await apiFetch("/api/bookings/admin/all");
    bookingsData = bookings;
    bookingPage  = 1;
    renderBookings();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">Failed to load bookings: ${esc(err.message)}</td></tr>`;
    showToast(err.message, "error");
  }
}

function renderBookings() {
  const query      = document.getElementById("bookingSearch")?.value.toLowerCase() || "";
  const statusFilt = document.getElementById("statusFilter")?.value.toUpperCase() || "";

  const filtered = bookingsData.filter((b) => {
    const name = (b.user?.name || "").toLowerCase();
    const pkg  = (b.tour?.title || "").toLowerCase();
    const id   = String(b.id || "").toLowerCase();
    const matchQ = !query || name.includes(query) || pkg.includes(query) || id.includes(query);
    const matchS = !statusFilt || (b.status || "").toUpperCase() === statusFilt;
    return matchQ && matchS;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  if (bookingPage > totalPages) bookingPage = 1;
  const slice = filtered.slice((bookingPage - 1) * PER_PAGE, bookingPage * PER_PAGE);
  const tbody = document.getElementById("bookingsTableBody");

  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No bookings found</td></tr>`;
  } else {
    tbody.innerHTML = slice.map((b) => {
      const name     = b.user?.name  || "—";
      const email    = b.user?.email || b.contactEmail || "";
      const pkgTitle = b.tour?.title || "—";
      const price    = Number(b.tour?.price || 0);
      const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
      const status   = (b.status || "PENDING").toUpperCase();
      const statusClass = { CONFIRMED: "badge-confirmed", PENDING: "badge-pending", CANCELLED: "badge-cancelled" }[status] || "badge-pending";
      const date = b.createdAt?.slice(0, 10) || "—";
      return `<tr>
        <td class="cell-green">#${esc(String(b.id))}</td>
        <td>
          <div class="customer-cell">
            <div class="customer-avatar">${initials}</div>
            <div>
              <div class="customer-name">${esc(name)}</div>
              <div class="customer-email">${esc(email)}</div>
            </div>
          </div>
        </td>
        <td class="cell-green">${esc(pkgTitle)}</td>
        <td>${esc(date)}</td>
        <td>—</td>
        <td>$${price.toLocaleString()}</td>
        <td><span class="badge ${statusClass}">${capitalize(status)}</span></td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon" title="View" onclick="viewBooking(${b.id})"><i class="fas fa-eye"></i></button>
            <button class="btn-icon" title="Update Status" onclick="updateBookingStatus(${b.id}, '${status}')"><i class="fas fa-pen"></i></button>
          </div>
        </td>
      </tr>`;
    }).join("");
  }

  const pag = document.getElementById("bookingPagination");
  pag.innerHTML = `
    <button ${bookingPage === 1 ? "disabled" : ""} onclick="changeBookingPage(-1)">← Previous</button>
    <span class="page-info">Page ${bookingPage} of ${totalPages}</span>
    <button ${bookingPage >= totalPages ? "disabled" : ""} onclick="changeBookingPage(1)">Next →</button>
  `;
}

function changeBookingPage(delta) { bookingPage += delta; renderBookings(); }
document.getElementById("bookingSearch")?.addEventListener("input",  () => { bookingPage = 1; renderBookings(); });
document.getElementById("statusFilter")?.addEventListener("change",  () => { bookingPage = 1; renderBookings(); });

// ─── VIEW BOOKING MODAL ───────────────────────────────────────────────────────
function viewBooking(id) {
  const b = bookingsData.find((x) => x.id === id);
  if (!b) return;
  const status   = (b.status || "PENDING").toUpperCase();
  const statusClass = { CONFIRMED: "badge-confirmed", PENDING: "badge-pending", CANCELLED: "badge-cancelled" }[status] || "badge-pending";
  document.getElementById("viewModalId").textContent = `Booking #${b.id}`;
  document.getElementById("viewModalContent").innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:0.92rem;">
      <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#7a8f7a;width:40%">Customer</td><td style="padding:10px 0;font-weight:600;">${esc(b.user?.name || "—")}</td></tr>
      <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#7a8f7a;">Email</td><td style="padding:10px 0;">${esc(b.user?.email || b.contactEmail || "—")}</td></tr>
      <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#7a8f7a;">Passport</td><td style="padding:10px 0;">${esc(b.passportNumber || "—")}</td></tr>
      <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#7a8f7a;">Package</td><td style="padding:10px 0;color:#4CAF50;font-weight:600;">${esc(b.tour?.title || "—")}</td></tr>
      <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#7a8f7a;">Price</td><td style="padding:10px 0;font-weight:600;">$${Number(b.tour?.price || 0).toLocaleString()}</td></tr>
      <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#7a8f7a;">Booked On</td><td style="padding:10px 0;">${esc(b.createdAt?.slice(0, 10) || "—")}</td></tr>
      <tr><td style="padding:10px 0;color:#7a8f7a;">Status</td><td style="padding:10px 0;"><span class="badge ${statusClass}">${capitalize(status)}</span></td></tr>
    </table>
  `;
  document.getElementById("viewModal").classList.remove("hidden");
}

document.getElementById("viewModalClose").addEventListener("click", () => document.getElementById("viewModal").classList.add("hidden"));
document.getElementById("viewModalCloseBtn").addEventListener("click", () => document.getElementById("viewModal").classList.add("hidden"));
document.getElementById("viewModal").addEventListener("click", (e) => { if (e.target === document.getElementById("viewModal")) document.getElementById("viewModal").classList.add("hidden"); });

// ─── STATUS UPDATE MODAL ──────────────────────────────────────────────────────
function showConfirmModal(message, onConfirm, type = "normal") {
  const modal      = document.getElementById("statusModal");
  const msgEl      = document.getElementById("statusModalMsg");
  const confirmBtn = document.getElementById("statusModalConfirm");
  const cancelBtn  = document.getElementById("statusModalCancel");
  const closeBtn   = document.getElementById("statusModalClose");

  msgEl.textContent = message;
  confirmBtn.style.background = type === "danger" ? "#e53935" : "#4CAF50";
  modal.classList.remove("hidden");

  function closeModal() { modal.classList.add("hidden"); }

  confirmBtn.onclick = () => { closeModal(); onConfirm(); };
  cancelBtn.onclick  = closeModal;
  closeBtn.onclick   = closeModal;
  modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

function updateBookingStatus(id, currentStatus) {
  const statuses = ["PENDING", "CONFIRMED", "CANCELLED"];
  const next = statuses[(statuses.indexOf(currentStatus.toUpperCase()) + 1) % statuses.length];
  const type = next === "CANCELLED" ? "danger" : "normal";

  showConfirmModal(
    `Are you sure you want to change this booking status to "${capitalize(next)}"?`,
    async () => {
      try {
        await apiFetch(`/api/bookings/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: next }),
        });
        showToast("Booking status updated!");
        loadBookings();
      } catch (err) {
        showToast(err.message, "error");
      }
    },
    type
  );
}

// ─── MODAL OPEN / CLOSE ───────────────────────────────────────────────────────
let dayCount = 0;

function openCreateModal() {
  editingTourId = null;
  document.getElementById("modalTitle").textContent    = "Create New Package";
  document.getElementById("modalSubtitle").textContent = "Add a new travel package to your catalog";
  document.getElementById("savePackageBtn").textContent = "Save Package";
  resetModal();
  document.getElementById("packageModal").classList.remove("hidden");
}

function openEditModalById(id) {
  const tour = allTours.find((t) => t.id === id);
  if (!tour) return;
  editingTourId = id;
  document.getElementById("modalTitle").textContent    = "Edit Package";
  document.getElementById("modalSubtitle").textContent = "Update the details of this package";
  document.getElementById("savePackageBtn").textContent = "Update Package";
  resetModal();
  document.getElementById("pkgTitle").value       = tour.title        || "";
  document.getElementById("pkgDestination").value = tour.destination  || "";
  document.getElementById("pkgDuration").value    = tour.durationDays || "";
  document.getElementById("pkgPrice").value       = tour.price        || "";
  document.getElementById("pkgDescription").value = tour.description  || "";
  document.getElementById("pkgImage").value       = (tour.images && tour.images[0]) || "";
  document.getElementById("packageModal").classList.remove("hidden");
}

function openEditModal() { openCreateModal(); }
function closeModal()    { document.getElementById("packageModal").classList.add("hidden"); }

document.getElementById("newPackageBtn").addEventListener("click", (e) => { e.stopPropagation(); openCreateModal(); });
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("cancelModalBtn").addEventListener("click", closeModal);
document.getElementById("packageModal").addEventListener("click", (e) => { if (e.target === document.getElementById("packageModal")) closeModal(); });

// ─── SAVE / UPDATE PACKAGE ────────────────────────────────────────────────────
document.getElementById("savePackageBtn").addEventListener("click", async () => {
  const title       = document.getElementById("pkgTitle").value.trim();
  const destination = document.getElementById("pkgDestination").value.trim();
  const duration    = parseInt(document.getElementById("pkgDuration").value);
  const price       = parseFloat(document.getElementById("pkgPrice").value);
  const description = document.getElementById("pkgDescription").value.trim();
  const imageUrl    = document.getElementById("pkgImage").value.trim();

  if (!title || !destination || !duration || !price) {
    showToast("Please fill in Title, Location, Duration and Price.", "error");
    return;
  }

  const dayBlocks = document.querySelectorAll("#itineraryDays .day-block");
  const itinerary = Array.from(dayBlocks).map((b, i) => {
    const t = b.querySelector(".day-title")?.value.trim() || "";
    const d = b.querySelector(".day-desc")?.value.trim()  || "";
    return `Day ${i + 1}: ${t}${d ? " – " + d : ""}`;
  }).join("\n");

  const includedInputs = document.querySelectorAll("#includedList .item-row input");
  const included = Array.from(includedInputs).map((i) => i.value.trim()).filter(Boolean).join(", ");
  const payload = { title, destination, description, price, durationDays: duration, itinerary, included, images: imageUrl ? [imageUrl] : [] };

  const btn = document.getElementById("savePackageBtn");
  btn.disabled    = true;
  btn.textContent = editingTourId ? "Updating…" : "Saving…";

  try {
    if (editingTourId) {
      await apiFetch(`/api/tours/${editingTourId}`, { method: "PUT",  body: JSON.stringify(payload) });
      showToast("Package updated successfully!");
    } else {
      await apiFetch("/api/tours",                  { method: "POST", body: JSON.stringify(payload) });
      showToast("Package created successfully!");
    }
    closeModal();
    loadPackages();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled    = false;
    btn.textContent = editingTourId ? "Update Package" : "Save Package";
  }
});

// ─── RESET MODAL ──────────────────────────────────────────────────────────────
function resetModal() {
  ["pkgTitle","pkgDestination","pkgDuration","pkgPrice","pkgDescription","pkgImage"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("itineraryDays").innerHTML = "";
  document.getElementById("includedList").innerHTML  = "";
  document.getElementById("excludedList").innerHTML  = "";
  dayCount = 0;
  addDay(); addDay(); addDay();
  addItem("included"); addItem("included"); addItem("included");
  addItem("excluded"); addItem("excluded"); addItem("excluded");
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
document.getElementById("addDayBtn").addEventListener("click", () => addDay());

// ─── INCLUSIONS / EXCLUSIONS ──────────────────────────────────────────────────
function addItem(type, text = "") {
  const listEl = document.getElementById(type + "List");
  const placeholders = type === "included"
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
document.getElementById("addIncludedBtn").addEventListener("click", () => addItem("included"));
document.getElementById("addExcludedBtn").addEventListener("click", () => addItem("excluded"));

// ─── INIT ─────────────────────────────────────────────────────────────────────
showPage("dashboard");