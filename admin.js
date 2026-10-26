"use strict";

/* RIMAL Admin Dashboard — connected to the local Express/SQLite API. */
const CATEGORIES = {
    starters: "Starters",
    main: "Main Dishes",
    chef: "Chef's Selection",
    desserts: "Desserts",
    drinks: "Drinks",
    hot: "Hot Drinks"
};
const state = { view: "overview", editingId: null, toastTimer: null, menu: [], reservations: [], messages: [] };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

async function api(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
    return result;
}
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
function parsePrice(value) {
    const number = Number(String(value ?? "").replace(/[^\d.]/g, ""));
    return Number.isFinite(number) ? number : 0;
}
function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}
function formatDate(value, withTime = false) {
    if (!value) return "—";
    const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-GB", withTime
        ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
        : { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
function statusClass(status) {
    const clean = String(status || "Pending").toLowerCase();
    if (clean === "confirmed") return "badge-confirmed";
    if (clean === "cancelled") return "badge-cancelled";
    return "badge-pending";
}
function showLoginPanel(message = "Sign in to manage your restaurant.") {
    let panel = $("#rimalAdminAuth");
    if (!panel) {
        panel = document.createElement("section");
        panel.id = "rimalAdminAuth";
        panel.className = "rimal-auth-backdrop";
        panel.innerHTML = `
            <form class="rimal-auth-card" id="rimalLoginForm">
                <div class="rimal-auth-mark">R</div>
                <p class="eyebrow">RIMAL · PRIVATE WORKSPACE</p>
                <h1>Admin <em>sign in.</em></h1>
                <p class="rimal-auth-copy">Sign in to manage dishes, reservations and guest messages stored on this computer.</p>
                <label>Username<input id="rimalLoginUser" type="text" autocomplete="username" value="admin" required></label>
                <label>Password<input id="rimalLoginPassword" type="password" autocomplete="current-password" required></label>
                <p class="rimal-auth-error" id="rimalLoginError" role="alert"></p>
                <button class="button button-primary" type="submit" id="rimalLoginButton">Sign in</button>
                <small>Local development workspace · not publicly accessible</small>
            </form>`;
        document.body.appendChild(panel);
        $("#rimalLoginForm", panel).addEventListener("submit", login);
    }
    $("#rimalLoginError").textContent = message === "Sign in to manage your restaurant." ? "" : message;
    panel.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#rimalLoginPassword")?.focus(), 40);
}
function hideLoginPanel() {
    const panel = $("#rimalAdminAuth");
    if (panel) panel.hidden = true;
    document.body.style.overflow = "";
}
async function login(event) {
    event.preventDefault();
    const button = $("#rimalLoginButton");
    const error = $("#rimalLoginError");
    button.disabled = true;
    button.textContent = "Signing in…";
    error.textContent = "";
    try {
        await api("/api/admin/login", {
            method: "POST",
            body: JSON.stringify({ username: $("#rimalLoginUser").value.trim(), password: $("#rimalLoginPassword").value })
        });
        hideLoginPanel();
        await loadAdminData();
        addLogoutButton();
        showToast("Signed in successfully.");
    } catch (err) {
        error.textContent = err.message || "Unable to sign in.";
    } finally {
        button.disabled = false;
        button.textContent = "Sign in";
        $("#rimalLoginPassword").value = "";
    }
}
function addLogoutButton() {
    const bottom = $(".sidebar-bottom");
    if (!bottom || $("#rimalLogoutButton")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.id = "rimalLogoutButton";
    button.className = "rimal-logout-button";
    button.textContent = "Sign out";
    button.addEventListener("click", logout);
    bottom.appendChild(button);
}
async function logout() {
    try { await api("/api/admin/logout", { method: "POST", body: "{}" }); } catch { }
    showLoginPanel();
}
async function loadAdminData() {
    const [menu, reservations, messages] = await Promise.all([
        api("/api/admin/menu"),
        api("/api/admin/reservations"),
        api("/api/admin/messages")
    ]);
    state.menu = menu;
    state.reservations = reservations;
    state.messages = messages;
    refreshCurrent();
}
function switchView(view) {
    if (!$(`#view-${view}`)) return;
    state.view = view;
    $$(".view").forEach(panel => panel.classList.toggle("active", panel.id === `view-${view}`));
    $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    const labels = { overview: "Overview", menu: "Menu management", reservations: "Reservations", messages: "Messages" };
    $("#pageCrumb").textContent = labels[view] || "Overview";
    $("#sidebar").classList.remove("open");
    if (view === "overview") renderOverview();
    if (view === "menu") renderMenuTable();
    if (view === "reservations") renderReservations();
    if (view === "messages") renderMessages();
}
function renderCounts() {
    $("#statMenu").textContent = state.menu.length;
    $("#statReservations").textContent = state.reservations.length;
    $("#statPending").textContent = state.reservations.filter(item => (item.status || "Pending") === "Pending").length;
    $("#statMessages").textContent = state.messages.length;
    $("#navMenuCount").textContent = state.menu.length;
    $("#navReservationCount").textContent = state.reservations.length;
    $("#navMessageCount").textContent = state.messages.length;
}
function renderOverview() {
    renderCounts();
    const target = $("#recentReservations");
    const recent = state.reservations.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4);
    if (!recent.length) {
        target.innerHTML = `<div class="empty-state"><span class="empty-icon">▦</span><h3>No requests yet</h3><p>New reservations will appear here after a guest submits the public form.</p></div>`;
        return;
    }
    target.innerHTML = recent.map(item => `<div class="compact-reservation"><div class="avatar">${escapeHTML((item.name || "G").trim().charAt(0).toUpperCase())}</div><div class="compact-text"><strong>${escapeHTML(item.name || "Guest")}</strong><small>${escapeHTML(formatDate(item.date))}${item.time ? ` · ${escapeHTML(item.time)}` : ""}</small></div><span class="badge ${statusClass(item.status)}">${escapeHTML(item.status || "Pending")}</span></div>`).join("");
}
function renderMenuTable() {
    const body = $("#menuTableBody");
    const query = $("#menuSearch").value.trim().toLowerCase();
    const category = $("#menuCategoryFilter").value;
    const items = state.menu.filter(item => {
        const text = `${item.name || ""} ${item.description || ""} ${item.category || ""}`.toLowerCase();
        return text.includes(query) && (category === "all" || item.category === category);
    });
    $("#menuResultCount").textContent = `${items.length} ${items.length === 1 ? "dish" : "dishes"}`;
    $("#menuEmpty").hidden = items.length > 0;
    body.innerHTML = items.map(item => {
        const categoryLabel = CATEGORIES[item.category] || item.category || "Uncategorised";
        const image = item.image
            ? `<img class="dish-thumb" src="${escapeHTML(item.image)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'dish-thumb dish-thumb-fallback',textContent:'R'}))">`
            : `<div class="dish-thumb dish-thumb-fallback">R</div>`;
        const activeBadge = item.active === false ? ` <span class="category-chip">Hidden</span>` : "";
        return `<tr><td><div class="dish-cell">${image}<div class="dish-info"><strong>${escapeHTML(item.name)}${activeBadge}</strong><small>${escapeHTML(item.description || "No description provided")}</small></div></div></td><td><span class="category-chip">${escapeHTML(categoryLabel)}</span></td><td class="price-cell">${parsePrice(item.price)} DH</td><td class="actions-cell"><div class="row-actions"><button class="small-action" type="button" data-edit-dish="${escapeHTML(item.id)}">Edit</button><button class="small-action delete" type="button" data-delete-dish="${escapeHTML(item.id)}">Delete</button></div></td></tr>`;
    }).join("");
    renderCounts();
}
function openDishModal(item = null) {
    state.editingId = item?.id || null;
    $("#dishForm").reset();
    $("#dishId").value = item?.id || "";
    $("#dishName").value = item?.name || "";
    $("#dishCategory").value = item?.category || "starters";
    $("#dishPrice").value = item ? parsePrice(item.price) : "";
    $("#dishImage").value = item?.image || "";
    $("#dishDescription").value = item?.description || "";
    $("#dishModalTitle").textContent = item ? "Edit dish" : "Add a dish";
    $("#dishSubmitButton").textContent = item ? "Save changes" : "Save dish";
    $("#dishFormError").textContent = "";
    $("#dishModal").hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#dishName").focus(), 30);
}
function closeDishModal() {
    $("#dishModal").hidden = true;
    document.body.style.overflow = "";
    state.editingId = null;
}
async function saveDish(event) {
    event.preventDefault();
    const name = $("#dishName").value.trim();
    let category = $("#dishCategory").value;
    if (category === "mains") category = "main";
    if (category === "hot-drinks") category = "hot";
    const price = parsePrice($("#dishPrice").value);
    const image = $("#dishImage").value.trim();
    const description = $("#dishDescription").value.trim();
    const error = $("#dishFormError");
    if (!name || !description || !image || !category || !Number.isFinite(price) || price < 0) {
        error.textContent = "Please complete all fields with a valid price.";
        return;
    }
    try {
        const parsed = new URL(image, window.location.href);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("bad protocol");
    } catch {
        error.textContent = "Enter a valid image URL starting with http:// or https://.";
        return;
    }
    const payload = { name, category, price, image, description };
    const existingId = state.editingId;
    try {
        if (existingId) await api(`/api/admin/menu/${encodeURIComponent(existingId)}`, { method: "PUT", body: JSON.stringify(payload) });
        else await api("/api/admin/menu", { method: "POST", body: JSON.stringify(payload) });
        await loadAdminData();
        closeDishModal();
        showToast(existingId ? "Dish updated in the SQLite database." : "Dish added to the SQLite database.");
    } catch (err) {
        error.textContent = err.message || "Unable to save this dish.";
    }
}
async function deleteDish(id) {
    const item = state.menu.find(dish => dish.id === id);
    if (!item || !window.confirm(`Delete “${item.name}” from the menu?`)) return;
    try {
        await api(`/api/admin/menu/${encodeURIComponent(id)}`, { method: "DELETE" });
        await loadAdminData();
        showToast("Dish deleted from the SQLite database.");
    } catch (err) { showToast(err.message); }
}
function renderReservations() {
    const body = $("#reservationTableBody");
    const query = $("#reservationSearch").value.trim().toLowerCase();
    const filter = $("#reservationStatusFilter").value;
    const items = state.reservations.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).filter(item => {
        const text = `${item.name || ""} ${item.email || ""} ${item.phone || ""} ${item.date || ""} ${item.time || ""} ${item.message || ""} ${item.specialRequest || ""} ${item.occasion || ""}`.toLowerCase();
        return text.includes(query) && (filter === "all" || (item.status || "Pending") === filter);
    });
    $("#reservationResultCount").textContent = `${items.length} ${items.length === 1 ? "request" : "requests"}`;
    $("#reservationEmpty").hidden = items.length > 0;

    body.innerHTML = items.map(item => `<tr><td>
        <div class="guest-cell"> 
                  <strong>
                    ${escapeHTML(item.name || "Guest")}
                  </strong>
              <small>
                    ${escapeHTML(item.email || item.phone || "Contact not supplied")}
              </small>
        </div>
               </td>
               <td>
                  ${escapeHTML(formatDate(item.date))}<br>
              <small>
                    ${escapeHTML(item.time || "Time not supplied")}
              </small>
               </td>
               <td>
                    ${escapeHTML(item.guests || "—")}
                    ${(item.message || item.specialRequest || item.occasion) ? `
               <br>
              <small class="reservation-request">
                     Special Request: ${escapeHTML(item.specialRequest || item.message || item.occasion)}
              </small>
                      ` : ""}
               </td>
    <td><span class="badge ${statusClass(item.status)}">${escapeHTML(item.status || "Pending")}</span></td><td class="actions-cell"><div class="row-actions"><select class="status-select" data-reservation-status="${escapeHTML(item.id)}" aria-label="Change status for ${escapeHTML(item.name || "Guest")}"><option ${item.status === "Pending" ? "selected" : ""}>Pending</option><option ${item.status === "Confirmed" ? "selected" : ""}>Confirmed</option><option ${item.status === "Cancelled" ? "selected" : ""}>Cancelled</option></select><button class="small-action delete" type="button" data-delete-reservation="${escapeHTML(item.id)}">Delete</button></div></td></tr>`).join("");
    renderCounts();
}

async function updateReservationStatus(id, status) {
    try {
        await api(`/api/admin/reservations/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
        await loadAdminData();
        showToast(`Reservation marked ${status.toLowerCase()}.`);
    } catch (err) { showToast(err.message); }
}
async function deleteReservation(id) {
    if (!window.confirm("Delete this reservation request?")) return;
    try {
        await api(`/api/admin/reservations/${encodeURIComponent(id)}`, { method: "DELETE" });
        await loadAdminData();
        showToast("Reservation removed from the database.");
    } catch (err) { showToast(err.message); }
}
function renderMessages() {
    const target = $("#messagesList");
    const query = $("#messageSearch").value.trim().toLowerCase();
    const items = state.messages.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).filter(item => `${item.name || ""} ${item.email || ""} ${item.subject || ""} ${item.message || ""}`.toLowerCase().includes(query));
    $("#messageResultCount").textContent = `${items.length} ${items.length === 1 ? "message" : "messages"}`;
    $("#messagesEmpty").hidden = items.length > 0;
    target.innerHTML = items.map(item => `<article class="message-card"><div class="message-card-head"><h3>${escapeHTML(item.name || "Guest enquiry")}</h3><time class="message-date">${escapeHTML(formatDate(item.createdAt, true))}</time></div><div class="message-meta">${escapeHTML(item.email || "No email supplied")}${item.subject ? ` · ${escapeHTML(item.subject)}` : ""}</div><div class="message-body">${escapeHTML(item.message || "No message content")}</div><div class="message-card-footer"><button class="small-action delete" type="button" data-delete-message="${escapeHTML(item.id)}">Delete message</button></div></article>`).join("");
    renderCounts();
}
async function deleteMessage(id) {
    if (!window.confirm("Delete this message?")) return;
    try {
        await api(`/api/admin/messages/${encodeURIComponent(id)}`, { method: "DELETE" });
        await loadAdminData();
        showToast("Message deleted.");
    } catch (err) { showToast(err.message); }
}
function refreshCurrent() {
    renderCounts();
    if (state.view === "overview") renderOverview();
    if (state.view === "menu") renderMenuTable();
    if (state.view === "reservations") renderReservations();
    if (state.view === "messages") renderMessages();
}

// Navigation & actions
document.addEventListener("click", event => {
    const nav = event.target.closest("[data-view]");
    if (nav) { switchView(nav.dataset.view); return; }
    const add = event.target.closest('[data-action="add-menu"]');
    if (add) { openDishModal(); return; }
    const edit = event.target.closest("[data-edit-dish]");
    if (edit) { const item = state.menu.find(dish => dish.id === edit.dataset.editDish); if (item) openDishModal(item); return; }
    const delDish = event.target.closest("[data-delete-dish]");
    if (delDish) { deleteDish(delDish.dataset.deleteDish); return; }
    const delReservation = event.target.closest("[data-delete-reservation]");
    if (delReservation) { deleteReservation(delReservation.dataset.deleteReservation); return; }
    const delMessage = event.target.closest("[data-delete-message]");
    if (delMessage) { deleteMessage(delMessage.dataset.deleteMessage); return; }
    if (event.target.closest("[data-close-modal]")) closeDishModal();
});
$("#dishForm").addEventListener("submit", saveDish);
$("#dishModal").addEventListener("click", event => { if (event.target === $("#dishModal")) closeDishModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !$("#dishModal").hidden) closeDishModal(); });
$("#sidebarToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#menuSearch").addEventListener("input", renderMenuTable);
$("#menuCategoryFilter").addEventListener("change", renderMenuTable);
$("#reservationSearch").addEventListener("input", renderReservations);
$("#reservationStatusFilter").addEventListener("change", renderReservations);
$("#messageSearch").addEventListener("input", renderMessages);
$("#reservationTableBody").addEventListener("change", event => {
    const select = event.target.closest("[data-reservation-status]");
    if (select) updateReservationStatus(select.dataset.reservationStatus, select.value);
});

async function boot() {
    showLoginPanel();
    try {
        const auth = await api("/api/admin/me");
        if (auth.authenticated) {
            hideLoginPanel();
            await loadAdminData();
            addLogoutButton();
        }
    } catch (err) {
        showLoginPanel("The backend is not responding. Start it with `node server.js`, then refresh this page.");
    }
}
boot();
