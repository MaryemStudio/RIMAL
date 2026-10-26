"use strict";

/* =========================================================
   RIMAL
   CONTEMPORARY MOROCCAN DINING
   MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   MENU DATA
========================================================= */

const menuItems = [

    /* =========================
       STARTERS
    ========================= */

    {
        category: "starters",
        name: "Briouat au Poulet",
        description: "Crispy Moroccan pastry filled with seasoned chicken, herbs and delicate spices.",
        price: "55 DH",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "starters",
        name: "Briouat au Fromage",
        description: "Golden pastry filled with creamy cheese, herbs and Moroccan spices.",
        price: "48 DH",
        image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "starters",
        name: "Zaalouk",
        description: "Traditional Moroccan eggplant salad with tomatoes, garlic, olive oil and spices.",
        price: "42 DH",
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "starters",
        name: "Taktouka",
        description: "Roasted peppers and tomatoes gently cooked with garlic, olive oil and Moroccan spices.",
        price: "42 DH",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "starters",
        name: "Harira Traditionnelle",
        description: "Classic Moroccan soup with tomatoes, lentils, chickpeas, herbs and aromatic spices.",
        price: "45 DH",
        image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "starters",
        name: "Salade Marocaine",
        description: "Fresh tomatoes, cucumbers, onions, herbs and olive oil dressed in Moroccan style.",
        price: "40 DH",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85"
    },


    /* =========================
       MAIN DISHES
    ========================= */

    {
        category: "main",
        name: "Tajine de Poulet au Citron & Olives",
        description: "Slow-cooked chicken with preserved lemon, green olives and Moroccan spices.",
        price: "95 DH",
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85"
    },

    {
        category: "main",
        name: "Tajine d'Agneau aux Pruneaux",
        description: "Tender lamb slowly cooked with caramelized prunes, almonds and warm Moroccan spices.",
        price: "125 DH",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=85"
    },

    {
        category: "main",
        name: "Couscous Royal",
        description: "Traditional couscous served with vegetables, tender lamb, chicken and merguez.",
        price: "135 DH",
        image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85"
    },

    {
        category: "main",
        name: "Couscous aux Sept Légumes",
        description: "Fluffy steamed couscous served with seven seasonal vegetables and rich Moroccan broth.",
        price: "95 DH",
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85"
    },

    {
        category: "main",
        name: "Pastilla au Poulet",
        description: "Crispy pastry layered with spiced chicken, almonds, eggs and a touch of cinnamon.",
        price: "115 DH",
        image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1000&q=85"
    },

    {
        category: "main",
        name: "Rfissa Traditionnelle",
        description: "Tender chicken served over msemen with lentils, onions, fenugreek and fragrant spices.",
        price: "105 DH",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=85"
    },

    {
        category: "main",
        name: "Méchoui d'Agneau",
        description: "Slow-roasted lamb, tender and aromatic, served with traditional Moroccan seasoning.",
        price: "165 DH",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=85"
    },

    {
        category: "main",
        name: "Tanjia Marrakchia",
        description: "Marrakech-style slow-cooked beef prepared with preserved lemon, saffron and Moroccan spices.",
        price: "145 DH",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=85"
    },


    /* =========================
       CHEF'S SELECTION
    ========================= */

    {
        category: "chef",
        name: "Tanjia RIMAL",
        description: "Our signature interpretation of the Marrakech classic, slowly cooked to tender perfection.",
        price: "175 DH",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=85"
    },

    {
        category: "chef",
        name: "Pastilla Royale",
        description: "A refined Moroccan pastilla combining delicate pastry, spiced chicken, almonds and saffron.",
        price: "155 DH",
        image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1000&q=85"
    },

    {
        category: "chef",
        name: "Tajine d'Agneau Signature",
        description: "Tender lamb with seasonal ingredients and a refined blend of traditional Moroccan spices.",
        price: "165 DH",
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85"
    },

    {
        category: "chef",
        name: "Couscous Royal RIMAL",
        description: "Our generous signature couscous with seasonal vegetables, lamb, chicken and merguez.",
        price: "175 DH",
        image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85"
    },


    /* =========================
       DESSERTS
    ========================= */

    {
        category: "desserts",
        name: "Sellou",
        description: "Traditional Moroccan sweet made with roasted flour, almonds, sesame and aromatic spices.",
        price: "38 DH",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "desserts",
        name: "Chebakia",
        description: "Golden Moroccan pastry coated with honey and sesame, delicately scented with orange blossom.",
        price: "35 DH",
        image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "desserts",
        name: "Briouat aux Amandes",
        description: "Crispy almond-filled pastry glazed with honey and scented with orange blossom.",
        price: "42 DH",
        image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "desserts",
        name: "Orange à la Cannelle",
        description: "Fresh Moroccan oranges served with cinnamon and a delicate touch of orange blossom water.",
        price: "32 DH",
        image: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "desserts",
        name: "Assortiment de Pâtisseries Marocaines",
        description: "A selection of traditional Moroccan pastries with almonds, sesame, honey and orange blossom.",
        price: "55 DH",
        image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "desserts",
        name: "Crème à la Fleur d'Oranger",
        description: "Silky homemade cream delicately infused with Moroccan orange blossom water.",
        price: "45 DH",
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85"
    },


    /* =========================
       DRINKS
    ========================= */

    {
        category: "drinks",
        name: "Jus d'Orange Frais",
        description: "Freshly squeezed Moroccan oranges served chilled.",
        price: "30 DH",
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "drinks",
        name: "Jus d'Avocat aux Amandes",
        description: "Creamy avocado blended with milk and almonds, inspired by the Moroccan classic.",
        price: "42 DH",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "drinks",
        name: "Jus de Citron & Gingembre",
        description: "Refreshing homemade lemon juice with fresh ginger and a subtle touch of honey.",
        price: "35 DH",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "drinks",
        name: "Citronnade Maison",
        description: "Fresh Moroccan-style lemonade prepared with lemon juice, mint and a touch of sweetness.",
        price: "32 DH",
        image: "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "drinks",
        name: "Eau de Rose Signature",
        description: "A delicate chilled rose-infused drink inspired by Moroccan floral traditions.",
        price: "35 DH",
        image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85"
    },


    /* =========================
       HOT DRINKS
    ========================= */

    {
        category: "hot",
        name: "Thé Marocain à la Menthe",
        description: "Traditional Moroccan green tea prepared with fresh mint and served in the classic style.",
        price: "28 DH",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "hot",
        name: "Thé aux Herbes Marocaines",
        description: "A fragrant Moroccan tea infused with a selection of fresh local herbs.",
        price: "30 DH",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "hot",
        name: "Café Noir",
        description: "Rich and aromatic black coffee served traditionally.",
        price: "25 DH",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "hot",
        name: "Café aux Épices",
        description: "Aromatic coffee infused with a delicate blend of Moroccan spices.",
        price: "32 DH",
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "hot",
        name: "Infusion Verveine",
        description: "Soothing verbena infusion prepared with fragrant Moroccan herbs.",
        price: "28 DH",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=85"
    },

    {
        category: "hot",
        name: "Infusion Fleur d'Oranger",
        description: "Delicate floral infusion with the distinctive fragrance of Moroccan orange blossom.",
        price: "30 DH",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=85"
    }

];


/* =========================================================
   DOM ELEMENTS
========================================================= */

const menuList = document.getElementById("menuList");
const menuTabs = document.querySelectorAll(".menu-tab");


/* =========================================================
   RENDER MENU
========================================================= */

function renderMenu(category = "all") {

    if (!menuList) return;

    const filteredItems =
        category === "all"
            ? menuItems
            : menuItems.filter(item => item.category === category);

    menuList.innerHTML = "";

    filteredItems.forEach(item => {

        const menuItem = document.createElement("article");

        menuItem.className = "menu-item";

        menuItem.innerHTML = `
            <div class="menu-item-image">
                <img
                    src="${item.image}"
                    alt="${item.name}"
                    loading="lazy"
                >
            </div>

            <div class="menu-item-content">

                <div class="menu-item-header">
                    <h3 class="menu-item-title">
                        ${item.name}
                    </h3>

                    <span class="menu-item-price">
                        ${item.price}
                    </span>
                </div>

                <p class="menu-item-description">
                    ${item.description}
                </p>

            </div>
        `;

        menuList.appendChild(menuItem);
    });
}


/* =========================================================
   MENU TABS
========================================================= */

menuTabs.forEach(tab => {

    tab.addEventListener("click", () => {

        menuTabs.forEach(item => {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        const category = tab.dataset.category;

        if (category) {
            renderMenu(category);
        } else {
            renderMenu("all");
        }

    });

});


/* =========================================================
   MOBILE MENU
========================================================= */

const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");

if (menuToggle && mobileMenu) {

    menuToggle.addEventListener("click", () => {

        mobileMenu.classList.toggle("active");
        menuToggle.classList.toggle("active");

    });

}


/* =========================================================
   CLOSE MOBILE MENU AFTER CLICK
========================================================= */

if (mobileMenu) {

    const mobileLinks = mobileMenu.querySelectorAll("a");

    mobileLinks.forEach(link => {

        link.addEventListener("click", () => {

            mobileMenu.classList.remove("active");

            if (menuToggle) {
                menuToggle.classList.remove("active");
            }

        });

    });

}


/* =========================================================
   HEADER SCROLL
========================================================= */

const header = document.getElementById("header");

window.addEventListener("scroll", () => {

    if (!header) return;

    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }

});


/* =========================================
   RIMAL — RESERVATION FORM
========================================= */

const reservationForm = document.getElementById("reservationForm");

const reservationMessage = document.getElementById("reservationMessage");

const reservationDateInput = reservationForm
    ? reservationForm.querySelector('input[type="date"]')
    : null;


/* Get today's date using the visitor's local date */

function getTodayLocalDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/* Prevent selecting past dates */

if (reservationDateInput) {

    reservationDateInput.min = getTodayLocalDate();

    reservationDateInput.addEventListener("change", function () {

        if (
            this.value &&
            this.value < getTodayLocalDate()
        ) {

            this.value = "";

            this.setCustomValidity(
                "Please choose today or a future date."
            );

            this.reportValidity();

            this.setCustomValidity("");

        }

    });

}


/* Validate and submit reservation form */

if (reservationForm) {

    reservationForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const today = getTodayLocalDate();

        if (
            reservationDateInput &&
            (
                !reservationDateInput.value ||
                reservationDateInput.value < today
            )
        ) {

            if (reservationDateInput.value < today) {
                reservationDateInput.value = "";
            }

            reservationDateInput.min = today;

            reservationDateInput.setCustomValidity(
                "Please choose today or a future date."
            );

            reservationDateInput.reportValidity();

            reservationDateInput.setCustomValidity("");

            return;

        }


        if (reservationMessage) {

            reservationMessage.textContent =
                "Thank you. Your reservation request has been received.";

            reservationMessage.classList.add("show");

        }


        reservationForm.reset();

        if (reservationDateInput) {
            reservationDateInput.min = getTodayLocalDate();
        }


        setTimeout(() => {

            if (reservationMessage) {
                reservationMessage.classList.remove("show");
            }

        }, 5000);

    });

}

/* =========================================================
   SUCCESS MODAL
========================================================= */

const successModal = document.getElementById("successModal");
const modalClose = document.getElementById("modalClose");
const modalDone = document.getElementById("modalDone");

function closeSuccessModal() {

    if (successModal) {
        successModal.classList.remove("active");
    }

}

if (modalClose) {
    modalClose.addEventListener("click", closeSuccessModal);
}

if (modalDone) {
    modalDone.addEventListener("click", closeSuccessModal);
}

if (successModal) {

    successModal.addEventListener("click", event => {

        if (event.target === successModal) {
            closeSuccessModal();
        }

    });

}


/* =========================================================
   CURRENT YEAR
========================================================= */

const currentYear = document.getElementById("currentYear");

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    renderMenu("all");

});

// ==========================================
// RIMAL CONTACT FORM
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contactForm");

    if (!contactForm) return;

    const statusElement = document.getElementById("contactFormStatus");
    const submitButton = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("contactName").value.trim();
        const email = document.getElementById("contactEmail").value.trim();
        const subject = document.getElementById("contactSubject").value.trim();
        const message = document.getElementById("contactMessage").value.trim();

        if (!name || !message) {
            statusElement.textContent = "Please enter your name and message.";
            return;
        }

        const originalButtonText = submitButton.textContent;

        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
        statusElement.textContent = "";

        try {
            const response = await fetch("/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    subject,
                    message
                })
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.error || "We could not send your message. Please try again.");
            }

            statusElement.textContent = "Thank you! Your message has been sent successfully.";
            contactForm.reset();

        } catch (error) {
            console.error("Contact form error:", error);
            statusElement.textContent =
                error.message || "Something went wrong. Please try again.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
});