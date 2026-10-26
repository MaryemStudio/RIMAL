"use strict";

/* Connects the existing public RIMAL website to the local API without replacing its design. */
(function () {
    const categoryMap = {
        mains: "main",
        "main-dishes": "main",
        "hot-drinks": "hot",
        hot_drinks: "hot"
    };
    const normaliseCategory = value => categoryMap[String(value || "").toLowerCase()] || String(value || "all").toLowerCase();
    let lastCategory = "all";
    let requestSequence = 0;
    let seedPromise = null;

    async function api(path, options = {}) {
        const response = await fetch(path, {
            ...options,
            headers: { "Content-Type": "application/json", ...(options.headers || {}) },
            credentials: "same-origin"
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
        return data;
    }

    function localSeed() {
        try {
            return typeof menuItems !== "undefined" ? menuItems.map(item => ({ ...item })) : [];
        } catch {
            return [];
        }
    }

    async function ensureSeeded() {
        if (!seedPromise) {
            seedPromise = (async () => {
                let current = await api("/api/menu");
                if (current.length) return current;
                const seed = localSeed();
                if (!seed.length) return current;
                try {
                    await api("/api/setup/seed", { method: "POST", body: JSON.stringify({ items: seed }) });
                } catch (error) {
                    // Another page load may have seeded the database a moment earlier.
                    if (!/already been initialized/i.test(error.message)) throw error;
                }
                current = await api("/api/menu");
                return current;
            })().catch(error => {
                seedPromise = null;
                throw error;
            });
        }
        return seedPromise;
    }

    function showMenuError(message) {
        const target = document.getElementById("menuList");
        if (!target) return;
        target.innerHTML = `<p class="menu-backend-message" role="status">${String(message).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch])}</p>`;
    }

    async function renderMenuFromApi(category = "all") {
        const targetSequence = ++requestSequence;
        const menuList = document.getElementById("menuList");
        if (!menuList) return;

        let wanted = normaliseCategory(category);
        if (wanted === "all") {
            const activeTab = document.querySelector(".menu-tab.active");
            if (activeTab?.dataset.category) wanted = normaliseCategory(activeTab.dataset.category);
        }
        lastCategory = wanted;

        try {
            let items = await ensureSeeded();
            if (targetSequence !== requestSequence) return;
            items = wanted === "all" ? items : items.filter(item => normaliseCategory(item.category) === wanted);
            menuList.innerHTML = "";
            if (!items.length) {
                menuList.innerHTML = '<p class="menu-backend-message">No dishes are listed in this category yet.</p>';
                return;
            }
            items.forEach(item => {
                const card = document.createElement("article");
                card.className = "menu-item";
                const price = Number(item.price);
                card.innerHTML = `
                    <div class="menu-item-image">
                        <img src="${String(item.image || "").replace(/"/g, "&quot;")}" alt="" loading="lazy">
                    </div>
                    <div class="menu-item-content">
                        <div class="menu-item-header">
                            <h3 class="menu-item-title"></h3>
                            <span class="menu-item-price"></span>
                        </div>
                        <p class="menu-item-description"></p>
                    </div>`;
                card.querySelector(".menu-item-title").textContent = item.name || "";
                card.querySelector(".menu-item-price").textContent = `${Number.isFinite(price) ? price : item.price} DH`;
                card.querySelector(".menu-item-description").textContent = item.description || "";
                const img = card.querySelector("img");
                img.alt = item.name || "Moroccan dish";
                img.addEventListener("error", () => { img.style.visibility = "hidden"; }, { once: true });
                menuList.appendChild(card);
            });
        } catch (error) {
            console.error("RIMAL menu API:", error);
            // Keep the existing local menu visible if the API is temporarily unavailable.
            if (typeof window.__rimalOriginalRenderMenu === "function") {
                window.__rimalOriginalRenderMenu(wanted);
            } else {
                showMenuError("The menu service is unavailable. Please ensure the RIMAL server is running.");
            }
        }
    }

    // The existing script's menu tab listeners call this global function.
    if (typeof window.renderMenu === "function") window.__rimalOriginalRenderMenu = window.renderMenu;
    window.renderMenu = renderMenuFromApi;

    function key(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
    function findFormValue(form, aliases) {
        const entries = Array.from(new FormData(form).entries()).map(([name, value]) => ({ name: key(name), value: String(value || "").trim() }));
        for (const alias of aliases) {
            const normalized = key(alias);
            const found = entries.find(item => item.name === normalized && item.value);
            if (found) return found.value;
        }
        for (const alias of aliases) {
            const normalized = key(alias);
            const found = entries.find(item => item.name.includes(normalized) && item.value);
            if (found) return found.value;
        }
        return "";
    }
    function reservationPayload(form) {
        const byType = selector => form.querySelector(selector)?.value?.trim() || "";
        const guestsInput = findFormValue(form, ["guests", "guestcount", "party", "people", "persons", "numberofguests"]);
        return {
            name: findFormValue(form, ["name", "fullname", "guestname", "customername", "reservationname"]) || byType('input[type="text"]'),
            email: findFormValue(form, ["email", "guestemail", "reservationemail"]) || byType('input[type="email"]'),
            phone: findFormValue(form, ["phone", "telephone", "tel", "mobile"]) || byType('input[type="tel"]'),
            date: byType('input[type="date"]') || findFormValue(form, ["date", "reservationdate"]),
            time: byType('input[type="time"]') || findFormValue(form, ["time", "reservationtime"]),
            guests: Number(guestsInput || "2"),
            occasion: findFormValue(form, ["occasion", "event"]),
            message: findFormValue(form, ["message", "notes", "specialrequest", "request"])
        };
    }
    function displayReservationMessage(message, good = true) {
        const target = document.getElementById("reservationMessage");
        if (target) {
            target.textContent = message;
            target.classList.add("show");
            target.dataset.state = good ? "success" : "error";
        } else {
            window.alert(message);
        }
    }

    // Capture phase stops the previous demo handler, so a fake success cannot race the real API.
    document.addEventListener("submit", async event => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;
        if (form.id === "reservationForm") {
            event.preventDefault();
            event.stopImmediatePropagation();
            const payload = reservationPayload(form);
            if (!payload.name || !payload.date || !payload.time || !Number.isInteger(payload.guests) || payload.guests < 1) {
                displayReservationMessage("Please enter your name, date, time and number of guests.", false);
                return;
            }
            try {
                await api("/api/reservations", { method: "POST", body: JSON.stringify(payload) });
                form.reset();
                const dateInput = form.querySelector('input[type="date"]');
                if (dateInput) dateInput.min = new Date().toLocaleDateString("en-CA");
                displayReservationMessage("Thank you. Your reservation request has been saved. The restaurant will confirm it with you.", true);
            } catch (error) {
                displayReservationMessage(error.message || "We could not save the reservation. Please try again.", false);
            }
            return;
        }

        const isContactForm = form.id === "contactForm" || form.matches(".contact-form") || form.closest("#contact") && form.querySelector('input[type="email"]') && form.querySelector("textarea");
        if (isContactForm) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const payload = {
                name: findFormValue(form, ["name", "fullname", "yourname"]) || form.querySelector('input[type="text"]')?.value?.trim() || "",
                email: findFormValue(form, ["email", "youremail"]) || form.querySelector('input[type="email"]')?.value?.trim() || "",
                subject: findFormValue(form, ["subject", "topic"]) || "",
                message: findFormValue(form, ["message", "details", "enquiry", "inquiry"]) || form.querySelector("textarea")?.value?.trim() || ""
            };
            try {
                await api("/api/messages", { method: "POST", body: JSON.stringify(payload) });
                form.reset();
                const feedback = form.querySelector(".form-message, .form-status, [role='status']");
                if (feedback) feedback.textContent = "Thank you. Your message has been saved.";
                else window.alert("Thank you. Your message has been saved.");
            } catch (error) {
                window.alert(error.message || "We could not save your message. Please try again.");
            }
        }
    }, true);

    document.addEventListener("DOMContentLoaded", () => {
        renderMenuFromApi("all");
    });
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) renderMenuFromApi(lastCategory);
    });
})();
