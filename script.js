const SHIPPING_RATES = {
    LIGHT: { max: 500, fee: 50, vehicle: "Pickup Truck" },
    MEDIUM: { max: 2000, fee: 150, vehicle: "Flatbed Truck" },
    HEAVY: { max: 10000, fee: 400, vehicle: "10-Wheeler Tipper" }
};

const mockOrders = {
    "SCH-101": { item: "50 Bags Cement", status: 3, eta: "February 15, 2026, 2:00 PM" },
    "SCH-202": { item: "2 Tons Rebar", status: 2, eta: "February 16, 2026, 9:00 AM" },
    "SCH-303": { item: "Ceramic Floor Tiles", status: 1, eta: "February 17, 2026, 11:00 AM" }
};

let currentCartTotal = 0;
let currentWeightTotal = 0;
let cartItemCount = 0;
let productMap = new Map();
let cartItems = [];

function normalizeText(value) {
    return (value || "").trim().toLowerCase();
}

function getShippingPlan(totalWeight) {
    if (totalWeight > 0 && totalWeight <= SHIPPING_RATES.LIGHT.max) {
        return SHIPPING_RATES.LIGHT;
    }
    if (totalWeight <= SHIPPING_RATES.MEDIUM.max) {
        return SHIPPING_RATES.MEDIUM;
    }
    return SHIPPING_RATES.HEAVY;
}

function renderCartTotals() {
    const totalWeightEl = document.getElementById("total-weight");
    const vehicleTypeEl = document.getElementById("vehicle-type");
    const shippingFeeEl = document.getElementById("shipping-fee");
    const grandTotalEl = document.getElementById("grand-total");
    const cartCountEl = document.getElementById("cart-count");

    if (!totalWeightEl || !vehicleTypeEl || !shippingFeeEl || !grandTotalEl || !cartCountEl) {
        return;
    }

    const shippingPlan = getShippingPlan(currentWeightTotal);
    const shippingFee = cartItemCount > 0 ? shippingPlan.fee : 0;

    totalWeightEl.innerText = currentWeightTotal.toFixed(0);
    vehicleTypeEl.innerText = cartItemCount > 0 ? shippingPlan.vehicle : "None";
    shippingFeeEl.innerText = shippingFee.toFixed(2);
    grandTotalEl.innerText = (currentCartTotal + shippingFee).toFixed(2);
    cartCountEl.innerText = String(cartItemCount);
}

function addLineItem(name, category, quantity, unitPrice, unitWeight) {
    const itemList = document.getElementById("selected-items");
    if (!itemList) return;

    const line = document.createElement("li");
    const totalItemPrice = unitPrice * quantity;
    line.textContent = `${name} (${category}) x${quantity} - $${totalItemPrice.toFixed(2)}`;
    itemList.appendChild(line);
}

function addToOrder(item, quantity = 1) {
    if (!item || quantity < 1) return;

    currentCartTotal += item.price * quantity;
    currentWeightTotal += item.weight * quantity;
    cartItemCount += quantity;
    cartItems.push({
        name: item.name,
        category: item.category,
        quantity: quantity,
        unitPrice: item.price,
        totalPrice: item.price * quantity
    });

    addLineItem(item.name, item.category, quantity, item.price, item.weight);
    renderCartTotals();
}

function getAllProductCards() {
    return Array.from(document.querySelectorAll(".product-card"));
}

function applyCatalogFilter() {
    const searchInput = document.getElementById("material-search");
    const categorySelect = document.getElementById("category-select");
    const resultsCount = document.getElementById("results-count");
    const categorySections = Array.from(document.querySelectorAll(".category-section"));
    const cards = getAllProductCards();

    if (!searchInput || !categorySelect || !resultsCount || cards.length === 0) return;

    const keyword = normalizeText(searchInput.value);
    const chosenCategory = categorySelect.value;
    let visibleCount = 0;

    cards.forEach((card) => {
        const name = normalizeText(card.dataset.name);
        const category = card.dataset.category || "";
        const specs = normalizeText(card.dataset.specs);
        const inCategory = chosenCategory === "all" || category === chosenCategory;
        const inSearch =
            keyword === "" ||
            name.includes(keyword) ||
            normalizeText(category).includes(keyword) ||
            specs.includes(keyword);

        const show = inCategory && inSearch;
        card.style.display = show ? "block" : "none";
        if (show) visibleCount += 1;
    });

    categorySections.forEach((section) => {
        const hasVisibleProducts = Array.from(section.querySelectorAll(".product-card"))
            .some((card) => card.style.display !== "none");
        section.style.display = hasVisibleProducts ? "block" : "none";
    });

    resultsCount.textContent = visibleCount === 0
        ? "No materials matched your search."
        : `Showing ${visibleCount} material${visibleCount === 1 ? "" : "s"}.`;
}

function setupQuickSelect() {
    const select = document.getElementById("item-select");
    const qtyInput = document.getElementById("item-qty");
    const addButton = document.getElementById("quick-add-btn");
    const cards = getAllProductCards();

    if (!select || !qtyInput || !addButton || cards.length === 0) return;

    productMap = new Map();
    select.innerHTML = "";

    cards.forEach((card) => {
        const item = {
            name: card.dataset.name,
            category: card.dataset.category,
            price: Number(card.dataset.price || 0),
            weight: Number(card.dataset.weight || 0)
        };
        productMap.set(item.name, item);

        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = `${item.name} (${item.category})`;
        select.appendChild(option);
    });

    addButton.addEventListener("click", () => {
        const selectedName = select.value;
        const quantity = Math.max(1, Number(qtyInput.value || 1));
        const item = productMap.get(selectedName);
        if (!item) return;
        addToOrder(item, quantity);
    });
}

function setupCardActions() {
    getAllProductCards().forEach((card) => {
        const button = card.querySelector(".add-btn");
        if (!button) return;

        button.addEventListener("click", () => {
            const item = {
                name: card.dataset.name,
                category: card.dataset.category,
                price: Number(card.dataset.price || 0),
                weight: Number(card.dataset.weight || 0)
            };
            addToOrder(item, 1);
        });
    });
}

function setupCatalogControls() {
    const searchInput = document.getElementById("material-search");
    const categorySelect = document.getElementById("category-select");
    const clearButton = document.getElementById("clear-filters");

    if (!searchInput || !categorySelect || !clearButton) return;

    searchInput.addEventListener("input", applyCatalogFilter);
    categorySelect.addEventListener("change", applyCatalogFilter);
    clearButton.addEventListener("click", () => {
        searchInput.value = "";
        categorySelect.value = "all";
        applyCatalogFilter();
    });
}

function getOrderItemsSummary() {
    if (cartItems.length === 0) return "";
    return cartItems
        .map((entry, idx) => `${idx + 1}. ${entry.name} (${entry.category}) x${entry.quantity} - $${entry.totalPrice.toFixed(2)}`)
        .join("\n");
}

function setupCheckout() {
    const checkoutButton = document.querySelector(".checkout-btn");
    const checkoutPanel = document.getElementById("checkout-panel");
    const checkoutForm = document.getElementById("checkout-form");
    const checkoutNextInput = document.getElementById("checkout-next");
    const orderItemsInput = document.getElementById("order-items-input");
    const orderWeightInput = document.getElementById("order-weight-input");
    const orderVehicleInput = document.getElementById("order-vehicle-input");
    const orderShippingInput = document.getElementById("order-shipping-input");
    const orderGrandTotalInput = document.getElementById("order-grand-total-input");

    if (!checkoutButton || !checkoutPanel || !checkoutForm) return;

    if (checkoutNextInput) {
        checkoutNextInput.value = new URL("thank-you.html", window.location.href).toString();
    }

    checkoutButton.addEventListener("click", () => {
        if (cartItemCount === 0) {
            alert("Your cart is empty. Please add materials before checkout.");
            return;
        }

        const shippingPlan = getShippingPlan(currentWeightTotal);
        const shippingFee = shippingPlan.fee;
        const grandTotal = currentCartTotal + shippingFee;

        if (orderItemsInput) orderItemsInput.value = getOrderItemsSummary();
        if (orderWeightInput) orderWeightInput.value = currentWeightTotal.toFixed(0);
        if (orderVehicleInput) orderVehicleInput.value = shippingPlan.vehicle;
        if (orderShippingInput) orderShippingInput.value = shippingFee.toFixed(2);
        if (orderGrandTotalInput) orderGrandTotalInput.value = grandTotal.toFixed(2);

        checkoutPanel.hidden = false;
        checkoutPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    checkoutForm.addEventListener("submit", (event) => {
        if (cartItemCount === 0) {
            event.preventDefault();
            alert("Your cart is empty. Please add materials before checkout.");
        }
    });
}

function trackOrder() {
    const input = document.getElementById("order-id-input");
    const display = document.getElementById("tracking-display");
    if (!input || !display) return;

    const id = input.value.toUpperCase().trim();
    const order = mockOrders[id];

    if (!order) {
        alert("Order ID not found. Please check your receipt.");
        return;
    }

    display.style.display = "block";
    document.getElementById("display-order-id").innerText = `Order #${id}`;
    document.getElementById("display-item").innerText = `Material: ${order.item}`;
    document.getElementById("delivery-eta").innerText = `ETA: ${order.eta}`;

    for (let i = 1; i <= 4; i += 1) {
        const step = document.getElementById(`step-${i}`);
        if (!step) continue;
        step.classList.remove("active");
        if (i <= order.status) step.classList.add("active");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setupCatalogControls();
    setupQuickSelect();
    setupCardActions();
    setupCheckout();
    applyCatalogFilter();
    renderCartTotals();
});

window.trackOrder = trackOrder;
