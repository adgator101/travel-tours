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

// Event delegation — works for sidebar AND links inside page content (View All, Manage)
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-page]");
  if (el) {
    e.preventDefault();
    showPage(el.dataset.page);
  }
});

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
});

// ─── MODAL OPEN / CLOSE ──────────────────────────────────────────────────────
let dayCount = 0;

function openCreateModal() {
  document.getElementById("modalTitle").textContent = "Create New Package";
  document.getElementById("modalSubtitle").textContent = "Add a new travel package to your catalog";
  document.getElementById("savePackageBtn").textContent = "Save Package";
  resetModal();
  document.getElementById("packageModal").classList.remove("hidden");
}

function openEditModal() {
  document.getElementById("modalTitle").textContent = "Edit Package";
  document.getElementById("modalSubtitle").textContent = "Update the details of this package";
  document.getElementById("savePackageBtn").textContent = "Update Package";
  resetModal();
  document.getElementById("pkgTitle").value = "Tropical Paradise Getaway";
  document.getElementById("pkgDestination").value = "Maldives";
  document.getElementById("pkgDuration").value = "7";
  document.getElementById("pkgPrice").value = "1299";
  document.getElementById("pkgDescription").value = "Experience the breathtaking beauty of the Maldives with crystal clear waters and pristine white beaches.";
  document.getElementById("pkgImage").value = "https://example.com/maldives.jpg";
  document.getElementById("packageModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("packageModal").classList.add("hidden");
}

document.getElementById("newPackageBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  openCreateModal();
});

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("cancelModalBtn").addEventListener("click", closeModal);
document.getElementById("savePackageBtn").addEventListener("click", closeModal);

document.getElementById("packageModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("packageModal")) closeModal();
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

document.getElementById("addDayBtn").addEventListener("click", () => addDay());

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

document.getElementById("addIncludedBtn").addEventListener("click", () => addItem("included"));
document.getElementById("addExcludedBtn").addEventListener("click", () => addItem("excluded"));

// ─── INIT ─────────────────────────────────────────────────────────────────────
showPage("dashboard");