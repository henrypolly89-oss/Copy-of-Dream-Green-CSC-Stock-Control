console.log("THIS IS THE FILE I AM EDITING");

/* =====================================================
   BACKOFFICE.JS — MASTER CONTROL FILE
   Author: David
   Purpose: Categories, Products, Inventory Management
   ===================================================== */

console.log("🔥 backoffice.js is running!");

/* =====================================================
   TABLE OF CONTENTS
   =====================================================

   1. DATA LOADING & NORMALIZATION
   2. SAVE HELPERS

   3. CATEGORY SYSTEM
      3.1 renderCategories()
      3.2 loadCategories()
      3.3 openEditCategory()
      3.4 deleteCategory()

   4. PRODUCT SYSTEM
      4.1 renderProducts()
      4.2 openProductModal()
      4.3 deleteProduct()

   5. INVENTORY SYSTEM
      5.1 renderInventory()
      5.2 available checkbox handler
      5.3 bulk update checkbox handler
      5.4 bulk stock update action

   6. CATEGORY SELECTOR (searchable dropdown)

   7. SECTION NAVIGATION (sidebar)

   8. - UPLOAD HANDLERS

   9. DOMCONTENTLOADED INITIALIZATION

   ===================================================== */


/* =====================================================
   1. DATA LOADING & NORMALIZATION
   ===================================================== */
// --- Firebase Setup (must be at the very top) ---

// GLOBAL DATA ARRAYS — MUST BE AT THE TOP

// ===============================
// 1. FIREBASE INITIALISATION
// ===============================


const firebaseConfig = {
  apiKey: "AIzaSyCth2KC077cxP4K42b_H4i1y5FhBhD71Qc",
  authDomain: "backoffice-inventory.firebaseapp.com",
  projectId: "backoffice-inventory",
  storageBucket: "backoffice-inventory.firebasestorage.app",
  messagingSenderId: "892138152302",
  appId: "1:892138152302:web:99f4ab77fe53574152e17f"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// ⭐ MUST BE HERE ⭐
const storage = firebase.storage(firebase.app(), "gs://backoffice-inventory.firebasestorage.app");

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let events = {};

let products = JSON.parse(localStorage.getItem("products") || "[]");
let inventory = JSON.parse(localStorage.getItem("inventory") || "[]");
let currentStatsProductId = null;
let transactions = [];
let revenueChart;
let profitChart;

// --- TS / MS / BS global settings ---
let tsmsbsSettings = {
    ts: 0,
    ms: 0,
    bs: 0
};

const defaultMemberTypes = [
    { name: "Local", percent: 0 },
    { name: "Tourist", percent: 0 },
    { name: "Mates Rates", percent: 0 },
    { name: "Staff", percent: 0 }
];

const defaultStaff = [
    { name: "Staff 1" },
    { name: "Staff 2" },
    { name: "Staff 3" },
    { name: "Staff 4" },
    { name: "Staff 5" }
];

window.addEventListener("load", () => {
    updateSalesTodayCard();
});


async function loadMemberTypesFromFirestore() {
    const docRef = firebase.firestore().collection("settings").doc("memberTypes");
    const snap = await docRef.get();

    let types = defaultMemberTypes;

    if (snap.exists) {
        types = snap.data().types;
    }

    renderMemberTypesGrid(types);
}

async function updateInventoryStock(productId, newStock) {
  await db.collection("inventory").doc(productId).update({
    stock: newStock,
    available: newStock > 0
  });
}

function renderMemberTypesGrid(types) {
    const grid = document.getElementById("membertypes-grid");
    grid.innerHTML = "";

    types.forEach(t => {
        grid.innerHTML += `
            <input class="mt-name" type="text" value="${t.name}" 
                style="width:100%; padding:6px; border-radius:4px; border:1px solid #1b5e20;">
            <input class="mt-percent" type="number" step="0.01" value="${t.percent}" 
                style="width:100%; padding:6px; border-radius:4px; border:1px solid:#1b5e20;">
        `;
    });
}

async function saveMemberTypes() {
    console.log("SAVE CLICKED"); // debug

    const names = Array.from(document.querySelectorAll(".mt-name")).map(i => i.value.trim());
    const percents = Array.from(document.querySelectorAll(".mt-percent")).map(i => parseFloat(i.value) || 0);

    const types = names.map((name, i) => ({
        name: name,
        percent: percents[i]
    }));

    try {
        await firebase.firestore()
            .collection("settings")
            .doc("memberTypes")
            .set({ types: types });

        console.log("Member types saved:", types);

        document.getElementById("membertypes-card").style.display = "none";

    } catch (err) {
        console.error("Error saving member types:", err);
    }
}

let staffRows = []; // store row objects for saving

function renderStaffGrid(userDocs) {
    const grid = document.getElementById("staff-grid");
    grid.innerHTML = "";
    staffRows = [];

    // Header row
    const header = document.createElement("div");
    header.style.display = "grid";
    header.style.gridTemplateColumns = "1fr 80px 80px";
    header.style.fontWeight = "bold";
    header.style.color = "#1b5e20";
    header.innerHTML = `
        <div>Name</div>
        <div>Front</div>
        <div>Full</div>
    `;
    grid.appendChild(header);

    // Existing users
    userDocs.forEach(doc => {
        const data = doc.data();
        addStaffRow(doc.id, data.role);
    });

    // Fixed empty row at bottom
    addStaffRow("", "front", true);
}

function addStaffRow(username, role, isEmptyRow = false) {
    const grid = document.getElementById("staff-grid");

    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "1fr 80px 80px";
    row.style.alignItems = "center";
    row.style.gap = "8px";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = username;
    nameInput.placeholder = isEmptyRow ? "Add staff name" : "";
    nameInput.style.padding = "8px";
    nameInput.style.border = "2px solid #1b5e20";
    nameInput.style.borderRadius = "6px";
    nameInput.style.background = "#ffffff";

    const frontBox = document.createElement("input");
    frontBox.type = "checkbox";
    frontBox.checked = role === "front";

    const fullBox = document.createElement("input");
    fullBox.type = "checkbox";
    fullBox.checked = role === "full";

    // Only one role allowed
    frontBox.addEventListener("change", () => {
        if (frontBox.checked) fullBox.checked = false;
    });

    fullBox.addEventListener("change", () => {
        if (fullBox.checked) frontBox.checked = false;
    });

    row.appendChild(nameInput);
    row.appendChild(frontBox);
    row.appendChild(fullBox);

    grid.appendChild(row);

    staffRows.push({
        nameInput,
        frontBox,
        fullBox,
        isEmptyRow
    });
}


async function loadStaffFromFirestore() {
    const snap = await firebase.firestore().collection("users").get();
    renderStaffGrid(snap.docs);
}

async function saveStaff() {
    const usersRef = firebase.firestore().collection("users");

    for (const row of staffRows) {
        const name = row.nameInput.value.trim().toLowerCase();
        const role = row.fullBox.checked ? "full" : "front";

        // Skip empty row
        if (row.isEmptyRow && name === "") continue;

        // Delete user if name cleared
        if (!row.isEmptyRow && name === "") {
            await usersRef.doc(row.nameInput.value).delete();
            continue;
        }

        // Create or update user
        await usersRef.doc(name).set({
            name: name,
            password: "0000",
            role: role,
            mustChangePassword: false
        }, { merge: true });
    }

    document.getElementById("staff-card").style.display = "none";
}

function cancelStaff() {
    document.getElementById("staff-card").style.display = "none";
}

const staffBtn = document.getElementById("staff-btn");
if (staffBtn) {
    staffBtn.addEventListener("click", () => {
        loadStaffFromFirestore();
        document.getElementById("staff-card").style.display = "block";
    });
}

async function loadStaticCostsFromFirestore() {
    const snapshot = await db.collection("staticcosts").get();

    const grid = document.getElementById("staticcosts-grid");
    grid.innerHTML = "";

    snapshot.forEach(doc => {
        const data = doc.data();

        const row = document.createElement("div");
        row.style.display = "contents";

        row.innerHTML = `
            <input type="text" class="sc-name" value="${data.name}" 
                   style="padding:6px; border:1px solid #1b5e20; border-radius:4px;">

            <input type="number" class="sc-monthly" value="${data.monthly}" 
                   style="padding:6px; border:1px solid #1b5e20; border-radius:4px;">

            <input type="number" class="sc-weekly" value="${data.weekly}" 
                   style="padding:6px; border:1px solid #1b5e20; border-radius:4px;">
        `;

        grid.appendChild(row);

        // Monthly → Weekly auto-calc
        row.querySelector(".sc-monthly").addEventListener("input", () => {
            const m = parseFloat(row.querySelector(".sc-monthly").value) || 0;
            const w = m / 4.345;
            row.querySelector(".sc-weekly").value = w.toFixed(2);
            calculateStaticCostsBreakEven();
        });

        row.querySelector(".sc-weekly").addEventListener("input", () => {
            calculateStaticCostsBreakEven();
        });
    });

    calculateStaticCostsBreakEven();
}

async function calculateStaticCostsBreakEven() {
    let totalWeekly = 0;
    let totalMonthly = 0;

    document.querySelectorAll(".sc-weekly").forEach(input => {
        totalWeekly += parseFloat(input.value) || 0;
    });

    document.querySelectorAll(".sc-monthly").forEach(input => {
        totalMonthly += parseFloat(input.value) || 0;
    });

    const weeklyFromMonthly = totalMonthly / 4.345;
    const totalWeeklyCombined = totalWeekly + weeklyFromMonthly;

    const daily = totalWeeklyCombined / 7;
    const monthly = totalWeeklyCombined * 4.345;
    const annual = totalWeeklyCombined * 52;

    document.getElementById("staticcosts-daily").textContent = "€" + daily.toFixed(2);
    document.getElementById("staticcosts-monthly").textContent = "€" + monthly.toFixed(2);
    document.getElementById("staticcosts-annual").textContent = "€" + annual.toFixed(2);

    // Save daily break-even into your existing "settings" document
    try {
        await setDoc(
            doc(db, "settings", "settings"),
            { dailyBreakEven: daily },
            { merge: true }
        );
    } catch (err) {
        console.error("Failed to save break-even:", err);
    }
}


function cancelStaticCosts() {
    document.getElementById("staticcosts-card").style.display = "none";
}

function addStaticCostRow() {
    const grid = document.getElementById("staticcosts-grid");

    const row = document.createElement("div");
    row.style.display = "contents";

    row.innerHTML = `
        <input type="text" class="sc-name" placeholder="Name"
               style="padding:6px; border:1px solid #1b5e20; border-radius:4px;">

        <input type="number" class="sc-monthly" placeholder="Monthly"
               style="padding:6px; border:1px solid #1b5e20; border-radius:4px;">

        <input type="number" class="sc-weekly" placeholder="Weekly"
               style="padding:6px; border:1px solid #1b5e20; border-radius:4px;">
    `;

    grid.appendChild(row);

    // Recalculate break-even when either field changes
    row.querySelector(".sc-monthly").addEventListener("input", calculateStaticCostsBreakEven);
    row.querySelector(".sc-weekly").addEventListener("input", calculateStaticCostsBreakEven);
}


async function saveStaticCosts() {
    const rows = [];
    const names = document.querySelectorAll(".sc-name");
    const monthly = document.querySelectorAll(".sc-monthly");
    const weekly = document.querySelectorAll(".sc-weekly");

    for (let i = 0; i < names.length; i++) {
        const name = names[i].value.trim();
        const m = parseFloat(monthly[i].value) || 0;
        const w = parseFloat(weekly[i].value) || 0;

        if (name !== "") {
            rows.push({
                name: name,
                monthly: m,
                weekly: w
            });
        }
    }

    // Clear existing collection
    const snapshot = await db.collection("staticcosts").get();
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Save new rows
    const batch2 = db.batch();
    rows.forEach(row => {
        const ref = db.collection("staticcosts").doc();
        batch2.set(ref, row);
    });

    await batch2.commit();

    console.log("Static Costs saved:", rows);

    document.getElementById("staticcosts-card").style.display = "none";
}

function addExpenseRow(name = "", amount = "") {
    const container = document.getElementById("expenses-grid");

    const row = document.createElement("div");
    row.className = "expense-row";
    row.style.display = "grid";
    row.style.gridTemplateColumns = "1fr 100px";
    row.style.gap = "8px";

    row.innerHTML = `
        <input class="expense-name" placeholder="Name" value="${name}">
        <input class="expense-amount" type="number" placeholder="Amount" value="${amount}">
    `;

    container.appendChild(row);
}


async function saveExpenses() {
    console.log("💾 saveExpenses() fired");

    // ALWAYS declare rows first
    const rows = [];

    // Collect all expense rows
    document.querySelectorAll(".expense-row").forEach(row => {
        const name = row.querySelector(".expense-name")?.value.trim() || "";
        const amount = parseFloat(row.querySelector(".expense-amount")?.value) || 0;

        if (name !== "") {
            rows.push({ name, amount });
        }
    });

    console.log("Saving rows:", rows);

    // Clear existing collection
    const snapshot = await db.collection("expenses").get();
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Save new rows
    const batch2 = db.batch();
    rows.forEach(row => {
        const ref = db.collection("expenses").doc();
        batch2.set(ref, row);
    });

    await batch2.commit();

    console.log("Expenses saved successfully!");

    // Close card
    document.getElementById("expenses-card").style.display = "none";
}

async function loadExpensesFromFirestore() {
    const snapshot = await db.collection("expenses").get();

    const container = document.getElementById("expenses-grid");
    container.innerHTML = ""; // clear old rows

    snapshot.forEach(doc => {
        const data = doc.data();
        addExpenseRow(data.name, data.amount);
    });
}

function addExpenseRow(name = "", amount = "") {
    const container = document.getElementById("expenses-grid");

    const row = document.createElement("div");
    row.className = "expense-row";
    row.style.display = "grid";
    row.style.gridTemplateColumns = "1fr 100px";
    row.style.gap = "10px";
    row.style.alignItems = "center";

    row.innerHTML = `
        <input class="expense-name" placeholder="Name" value="${name}">
        <input class="expense-amount" type="number" placeholder="Amount" value="${amount}">
    `;

    container.appendChild(row);
}


function cancelExpenses() {
    document.getElementById("expenses-card").style.display = "none";
}

async function loadTSMSBSFromFirestore() {
    const docRef = db.collection("settings").doc("tsmsbs");
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        tsmsbsSettings = docSnap.data();
    } else {
        await docRef.set(tsmsbsSettings);
    }
}

async function saveTSMSBS() {
    tsmsbsSettings.ts = Number(document.getElementById("ts-value").value);
    tsmsbsSettings.ms = Number(document.getElementById("ms-value").value);
    tsmsbsSettings.bs = Number(document.getElementById("bs-value").value);

    await db.collection("settings").doc("tsmsbs").set(tsmsbsSettings);

    // Close the card after saving
    document.getElementById("tsmsbs-card").style.display = "none";
}

function cancelTSMSBS() {
    document.getElementById("tsmsbs-card").style.display = "none";
}

// If products is empty but allProducts exists, use allProducts

// Ensure bulkUpdate exists
inventory = inventory.map(i => ({
  ...i,
  bulkUpdate: i.bulkUpdate ?? false
}));

loadProductsFromFirestore();
loadTSMSBSFromFirestore();

let editingProductId = null;
let currentEditingImage = "";

let restockHistory = JSON.parse(localStorage.getItem("restockHistory")) || {};

function addRestockHistory(productId, entry) {
  if (!restockHistory[productId]) {
    restockHistory[productId] = [];
  }

  restockHistory[productId].push(entry);

  localStorage.setItem("restockHistory", JSON.stringify(restockHistory));
}

async function bulkStockUpdateAction() {

  const modal = document.getElementById("bulk-update-modal");

  for (const item of inventory) {
    if (!item.bulkUpdate) continue;

    const qtyInput = document.querySelector(`.bulk-qty[data-id="${item.id}"]`);
    const costInput = document.querySelector(`.bulk-cost[data-id="${item.id}"]`);

    let qtyToAdd = Number(qtyInput?.value || 0);
    let unitCost = Number(costInput?.value || 0);

    // Multipack fields
    const mpBox = document.getElementById(`mp-${item.id}`);
    let mpCount = 0, mpSize = 0, mpCost = 0;

    if (mpBox && !mpBox.classList.contains("hidden")) {
      mpCount = Number(document.querySelector(`.mp-count[data-id="${item.id}"]`)?.value || 0);
      mpSize  = Number(document.querySelector(`.mp-size[data-id="${item.id}"]`)?.value || 0);
      mpCost  = Number(document.querySelector(`.mp-cost[data-id="${item.id}"]`)?.value || 0);

      if (mpCount > 0 && mpSize > 0 && mpCost > 0) {
        const mpUnits = mpCount * mpSize;
        const mpUnitCost = mpCost / mpSize;

        qtyToAdd += mpUnits;

        if (unitCost > 0) {
          unitCost = (
            (Number(qtyInput.value || 0) * unitCost) +
            (mpUnits * mpUnitCost)
          ) / qtyToAdd;
        } else {
          unitCost = mpUnitCost;
        }
      }
    }

    if (qtyToAdd > 0 && unitCost > 0) {
      const oldUnits = item.stock || 0;
      const oldCost = item.weightedCost || 0;

      const newWeighted = (
        (oldUnits * oldCost) +
        (qtyToAdd * unitCost)
      ) / (oldUnits + qtyToAdd);

      item.stock = oldUnits + qtyToAdd;
      item.weightedCost = newWeighted;

      // 🔥 FIRESTORE UPDATE (products)
      await db.collection("products").doc(item.id).update({
        stock: item.stock,
        weightedCost: item.weightedCost
      });

      // 🔥 FIRESTORE UPDATE (inventory)
      await updateInventoryStock(item.id, item.stock);

      // 🔥 Restock history
      addRestockHistory(item.id, {
        date: Date.now(),
        qty: qtyToAdd,
        unitCost,
        totalCost: qtyToAdd * unitCost,
        multipack: {
          count: mpCount,
          size: mpSize,
          cost: mpCost
        }
      });
    }
  }

  saveInventory();
  renderInventory(inventory);
  modal.classList.add("hidden");
}

async function saveEventToFirestore(year, month, day, title, time) {
  const key = `${year}-${month + 1}-${day}`;


  if (!window.events[key]) window.events[key] = [];

  // NEW: window.recurringEvents = window.recurringEvents || [];

  window.events[key].push({ title, time });

  try {
    await db.collection("events").doc(key).set({
      events: window.events[key]
    });

    console.log("🔥 Event saved:", key, window.events[key]);
  } catch (error) {
    console.error("❌ Error saving event:", error);
  }
}

async function saveRecurringEventToFirestore(year, month, day, title, time, recurrenceType) {
  // month is zero-based coming in, so +1 for storage
  const startKey = `${year}-${month + 1}-${day}`;

  const docRef = db.collection("recurringEvents").doc(); // auto ID

  const payload = {
    title,
    time,
    startDate: startKey,
    recurrence: {
      type: recurrenceType, // "weekly" | "monthly" | "yearly"
      interval: 1
    }
  };

  try {
    await docRef.set(payload);
    console.log("📆 Recurring event saved:", docRef.id, payload);

    // Update in-memory store so UI updates immediately
    window.recurringEvents.push({
      id: docRef.id,
      ...payload
    });
  } catch (error) {
    console.error("❌ Error saving recurring event:", error);
  }
}


function renderCategorySidebar() {
    const sidebar = document.getElementById("product-category-sidebar");
    sidebar.innerHTML = "";

    // ⭐ TOP ITEM: All Products ⭐
    const allItem = document.createElement("div");
    allItem.classList.add("sidebar-category-item");

    const allIcon = document.createElement("img");
    allIcon.src = window.location.origin + "/icon-192.png";   // your logo file
    allIcon.classList.add("sidebar-category-icon");

    const allLabel = document.createElement("span");
    allLabel.textContent = "All Products";

    allItem.appendChild(allIcon);
    allItem.appendChild(allLabel);

    allItem.onclick = () => renderProducts(products);

    sidebar.appendChild(allItem);

    // ⭐ CATEGORY ITEMS ⭐
    categories.forEach(cat => {
        const count = products.filter(p => p.category === cat.id).length;

        const item = document.createElement("div");
        item.classList.add("sidebar-category-item");

        const icon = document.createElement("img");
        icon.src = cat.icon;
        icon.classList.add("sidebar-category-icon");

        const label = document.createElement("span");
        label.textContent = `${cat.name} (${count})`;

        item.appendChild(icon);
        item.appendChild(label);

        item.onclick = () => loadProductsByCategory(cat.id);

        sidebar.appendChild(item);
    });
}

function uploadProductImage(file, productName) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(""); // No new image selected
      return;
    }

    // Create a safe filename
    const ext = file.name.split(".").pop().toLowerCase();
    const safeName = (productName || "product")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

    const filename = `products/${safeName}-${Date.now()}.${ext}`;

    // Reference to Firebase Storage
    const storageRef = storage.ref().child(filename);

    // Upload the file
    const uploadTask = storageRef.put(file);

    uploadTask.on(
      "state_changed",
      null, // We don't need progress updates yet
      (error) => reject(error),
      () => {
        uploadTask.snapshot.ref.getDownloadURL()
          .then(resolve)
          .catch(reject);
      }
    );
  });
}


// Unified / merged model
function normalizeProduct(raw) {
  return {
    id: raw.id ?? Date.now() + Math.random(),
    name: raw.name ?? "",
    category: raw.category ?? "",
    stock: Number(raw.stock ?? 0),
    unit: raw.unit ?? "#",                 // "#", "g", "pcs"
    unitPrice: Number(raw.unitPrice ?? 0),
    sellPrice: Number(raw.sellPrice ?? raw.price ?? 0),
    lowStock: Number(raw.lowStock ?? 0),
    price: Number(raw.sellPrice ?? raw.price ?? 0), // alias for compatibility
    image: raw.image ?? "",
    available: raw.available ?? true,      // inventory availability
    bulkUpdate: raw.bulkUpdate ?? false    // selected for bulk stock update
  };
}

async function getSalesToday() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const snapshot = await db.collection("salesLog")
        .where("timestamp", ">=", start)
        .get();

    let total = 0;
    snapshot.forEach(doc => {
        total += doc.data().total || 0;
    });

    return total;
}

async function updateSalesTodayCard() {
    const total = await getSalesToday();
    document.getElementById("sales-today-value").textContent = "£" + total.toFixed(2);
}

async function updateDailyProfitCard() {
    const today = new Date().toISOString().split("T")[0];

    // 1. Get today's sales
    const salesRef = db.collection("sales");
    const snapshot = await salesRef
        .where("date", "==", today)
        .get();

    let profit = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        const sale = data.total || 0;
        const cost = data.costAtSale || 0;
        profit += (sale - cost);
    });

    // 2. Get break-even from Firestore (v8 syntax)
    const settingsDoc = await db.collection("settings").doc("settings").get();
    const breakEven = settingsDoc.exists ? settingsDoc.data().dailyBreakEven : 0;

    // 3. Calculate percentage
    const percent = breakEven > 0 ? (profit / breakEven) * 100 : 0;

    // 4. Update UI
    const euroEl = document.getElementById("profit-euro");
    const percentEl = document.getElementById("profit-percent");
    const card = document.getElementById("profit-card");

    euroEl.textContent = "€" + profit.toFixed(2);
    percentEl.textContent = percent.toFixed(0) + "%";

    // 5. Colour logic
    if (profit >= breakEven) {
        euroEl.style.color = "#1b5e20";
        percentEl.style.color = "#1b5e20";
        card.style.borderColor = "#1b5e20";
    } else {
        euroEl.style.color = "#b71c1c";
        percentEl.style.color = "#b71c1c";
        card.style.borderColor = "#b71c1c";
    }
}

async function updateStockAlertCard() {
  const inventoryRef = db.collection("inventory");
  const snapshot = await inventoryRef.get();


  const outOfStockList = document.getElementById("out-of-stock-list");
  const lowStockList = document.getElementById("low-stock-list");

  outOfStockList.innerHTML = "";
  lowStockList.innerHTML = "";

  snapshot.forEach(doc => {
    const item = doc.data();
    const name = item.name;
    const stock = item.stock;
    const threshold = item.lowStockThreshold;

    // 1. OUT OF STOCK
    if (stock === 0) {
      outOfStockList.innerHTML += `<li>${name}</li>`;
      return; // prevent duplicates
    }

    // 2. LOW STOCK (but not zero)
    if (stock <= threshold) {
      lowStockList.innerHTML += `<li>${name}</li>`;
    }
  });
}

// Keep inventory in sync with products (shape + IDs)
function syncInventoryFromProducts() {
  // Load saved inventory from localStorage
  const savedInventory = JSON.parse(localStorage.getItem("inventory")) || [];

  // Create a map for fast lookup
  const savedMap = new Map(savedInventory.map(i => [i.id, i]));

  // Build the new inventory array
  inventory = products.map(p => {
    const saved = savedMap.get(p.id) || {};

    return {
      ...normalizeProduct(p),

      // Restore saved fields
      stock: saved.stock ?? p.stock ?? 0,
      weightedCost: saved.weightedCost ?? p.weightedCost ?? 0,
      available: saved.available ?? p.available ?? true,

      // ⭐ The important one
      bulkUpdate: saved.bulkUpdate ?? false
    };
  });
}


/* =====================================================
   2. SAVE HELPERS
   ===================================================== */

// Unified / merged model
function normalizeProduct(raw) {
  return {
    id: raw.id ?? Date.now() + Math.random(),
    name: raw.name ?? "",
    category: raw.category ?? "",
    stock: Number(raw.stock ?? 0),
    unit: raw.unit ?? "#",                 // "#", "g", "pcs"
    unitPrice: Number(raw.unitPrice ?? 0),
    sellPrice: Number(raw.sellPrice ?? raw.price ?? 0),
    lowStock: Number(raw.lowStock ?? 0),
    price: Number(raw.sellPrice ?? raw.price ?? 0), // alias for compatibility
    image: raw.image ?? "",
    available: raw.available ?? true,      // inventory availability
    bulkUpdate: raw.bulkUpdate ?? false    // selected for bulk stock update
  };
}

// Keep inventory in sync with products (shape + IDs)

/* =====================================================
   2. SAVE HELPERS
   ===================================================== */

function saveProductsToLocalStorage() {
  localStorage.setItem("products", JSON.stringify(products));
}


function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
}

function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
}

function handleImageUpload(file, callback) {
  const reader = new FileReader();
  reader.onload = () => callback(reader.result); // base64 string
  reader.readAsDataURL(file);
}

/* =====================================================
   3. CATEGORY SYSTEM
   ===================================================== */

/* 3.1 renderCategories() */
function renderCategories() {
  console.log("🔥 renderCategories() fired");

  const grid = document.getElementById("category-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const categories = window.categories || [];

  categories.forEach(cat => {
    const card = document.createElement("div");
    card.className = "category-card";

    card.innerHTML = `
      <img src="${cat.image || ""}" class="category-card-image">

      <h3 class="category-card-title">${cat.name}</h3>

      <div class="category-card-actions">
        <button class="edit-category-btn" data-id="${cat.id}">Edit</button>
        <button class="delete-category-btn" data-id="${cat.id}">Delete</button>
      </div>
    `;

    grid.appendChild(card);
  });

  // Wire up edit buttons
  document.querySelectorAll(".edit-category-btn").forEach(btn => {
    btn.onclick = () => openEditCategory(btn.dataset.id);
  });

  // Wire up delete buttons
  document.querySelectorAll(".delete-category-btn").forEach(btn => {
    btn.onclick = () => deleteCategory(btn.dataset.id);
  });
}


/* 3.2 loadCategories() */
function loadCategories() {
  console.log("Loading categories...");

  const addBtn = document.getElementById("add-category-btn");
  const modal = document.getElementById("category-modal");
  const categorySaveBtn = document.getElementById("category-save-btn");
  const categoryCancelBtn = document.getElementById("category-cancel-btn");
  const nameInput = document.getElementById("category-name");
  const imgInput = document.getElementById("category-image-input");
  const imgPreview = document.getElementById("category-image-preview");
  const grid = document.getElementById("category-grid");

  if (!addBtn || !modal || !categorySaveBtn || !categoryCancelBtn || !nameInput || !imgInput || !imgPreview || !grid) {
    console.log("❌ Missing category elements");
    return;
  }


  // Open modal
  addBtn.onclick = () => {
    nameInput.value = "";
    imgInput.value = "";
    imgPreview.src = "";
    modal.classList.remove("hidden");
  };

  // Close modal
  categoryCancelBtn.onclick = () => {
    modal.classList.add("hidden");
  };
  // Image preview (Base64)
  imgInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      imgPreview.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // Save category
// Save category (Firestore)
categorySaveBtn.onclick = async () => {
  const name = nameInput.value.trim();
  if (!name) return alert("Enter a category name");

  const imageData = imgPreview.src || "";

  const category = {
    name,
    image: imageData
  };

  await saveCategoryToFirestore(category);

  window.categories = await loadCategoriesFromFirestore();
  console.log("CATEGORIES:", window.categories);

  modal.classList.add("hidden");

};

}

function editProduct(id) {

  editingProductId = id;
  const product = window.products.find(p => p.id === id);

console.log("EDIT PRODUCT ID:", id);
console.log("PRODUCT FOUND:", product);

  if (!product) {
    console.error("Product not found:", id);
    return;
  }

  // Pass the full product object into the modal
  openProductModal({
    id: product.id,
    name: product.name,
    category: product.category,
    stock: product.stock,
    unit: product.unit,
    unitPrice: product.unitPrice,
    sellPrice: product.sellPrice,
    lowStock: product.lowStock,
    image: product.image
  });
}



/* 3.3 openEditCategory() */
function openEditCategory(index) {
  const categories = JSON.parse(localStorage.getItem("categories") || "[]");
  const cat = categories[index];
  if (!cat) return;

  const modal = document.getElementById("category-modal");
  const title = document.getElementById("category-modal-title");
  const nameInput = document.getElementById("category-name");
  const imgPreview = document.getElementById("category-image-preview");
  const imgInput = document.getElementById("category-image-input");
  
  title.textContent = "Edit Category";
  nameInput.value = cat.name;
  imgPreview.src = cat.image || "";
  imgInput.value = "";

  modal.classList.remove("hidden");

  categorySaveBtn.onclick = async () => {
    const newName = nameInput.value.trim();
    const newFile = imgInput.files[0];

    if (!newName) {
      alert("Please enter a category name.");
      return;
    }

    cat.name = newName;

    if (newFile) {
      const imageUrl = await uploadCategoryIcon(newFile);
      cat.image = imageUrl;
    }

    localStorage.setItem("categories", JSON.stringify(categories));

    modal.classList.add("hidden");

    renderCategories();

  };
}

function openAddCategory() {
  const modal = document.getElementById("category-modal");
  const title = document.getElementById("category-modal-title");
  const nameInput = document.getElementById("category-name");
  const imgPreview = document.getElementById("category-image-preview");
  const imgInput = document.getElementById("category-image-input");
  const categorySaveBtn = document.getElementById("category-save-btn");

  title.textContent = "Add Category";
  nameInput.value = "";
  imgPreview.src = "";
  imgInput.value = "";

  modal.classList.remove("hidden");

  categorySaveBtn.onclick = async () => {
    const name = nameInput.value.trim();
    const file = imgInput.files[0];

    if (!name) {
      alert("Please enter a category name.");
      return;
    }

    let categories = JSON.parse(localStorage.getItem("categories") || "[]");

    let imageUrl = "";
    if (file) {
      imageUrl = await uploadCategoryIcon(file);
    }

    categories.push({
      name: name,
      image: imageUrl || ""
    });

    localStorage.setItem("categories", JSON.stringify(categories));

    modal.classList.add("hidden");
    renderCategories();
  };
}



/* 3.4 deleteCategory() */
function deleteCategory(index) {
  let categories = JSON.parse(localStorage.getItem("categories") || "[]");
  categories.splice(index, 1);
  localStorage.setItem("categories", JSON.stringify(categories));
  renderCategories();
}

async function loadCategoriesFromFirestore() {
  console.log("Loading categories from Firestore…");

  try {
    const snapshot = await db.collection("categories").get();

    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log("Categories loaded:", categories);
    return categories;

  } catch (error) {
    console.error("Error loading categories:", error);
    window.categories = [];
    return [];
  }
}

async function deleteCategoryFromFirestore(id) {
  try {
    await db.collection("categories").doc(id).delete();
    console.log("Category deleted from Firestore:", id);
  } catch (error) {
    console.error("Error deleting category:", error);
  }
}

async function updateInventoryStock(productId, newStock) {
  console.log("🔥 Updating Firestore inventory:", productId, newStock);

  await db.collection("inventory").doc(productId).update({
    stock: newStock,
    available: newStock > 0
  });
}

async function deleteCategory(id) {
  if (!confirm("Delete this category?")) return;

  // Delete from Firestore
  await deleteCategoryFromFirestore(id);

  // Remove from local memory
  window.categories = window.categories.filter(c => c.id !== id);

  // Re-render UI
  renderCategories();
}

function openEditCategory(id) {
  const modal = document.getElementById("category-modal");
  const categorySaveBtn = document.getElementById("category-save-btn");
  const nameInput = document.getElementById("category-name");
  const imgInput = document.getElementById("category-image-input");
  const imgPreview = document.getElementById("category-image-preview");

  const category = window.categories.find(c => c.id === id);
  if (!category) return;

  // Populate modal fields
  nameInput.value = category.name;
  imgInput.value = "";
  imgPreview.src = category.image || "";

  modal.classList.remove("hidden");

  // Override save button for editing
  categorySaveBtn.onclick = async () => {
    const newName = nameInput.value.trim();
    if (!newName) return alert("Enter a category name");

    let newImage = imgPreview.src;

    // If a new image was selected, use it
    if (imgInput.files[0]) {
      const reader = new FileReader();
      reader.onload = async () => {
        newImage = reader.result;

        await saveCategoryToFirestore({
          id,
          name: newName,
          image: newImage
        });

        // Update local memory
        const index = window.categories.findIndex(c => c.id === id);
        window.categories[index].name = newName;
        window.categories[index].image = newImage;

        modal.classList.add("hidden");
        renderCategories();
      };
      reader.readAsDataURL(imgInput.files[0]);
      return;
    }

    // No new image selected → save directly
    await saveCategoryToFirestore({
      id,
      name: newName,
      image: newImage
    });

    const index = window.categories.findIndex(c => c.id === id);
    window.categories[index].name = newName;
    window.categories[index].image = newImage;

    modal.classList.add("hidden");
    renderCategories();
  };
}

async function saveCategoryToFirestore(category) {
  if (category.id) {
    await db.collection("categories").doc(category.id).update({
      name: category.name,
      image: category.image
    });
    return category;
  } else {
    const docRef = await db.collection("categories").add({
      name: category.name,
      image: category.image
    });
    category.id = docRef.id;
    return category;
  }
}



/* =====================================================
   4. PRODUCT SYSTEM
   ===================================================== */

/* 4.1 renderProducts() */


function renderProductCategoriesSidebar() {
  console.log("🔥 renderProductCategoriesSidebar() fired");

  const sidebar = document.getElementById("products-sidebar");
  if (!sidebar) return;

  const categories = window.categories || [];
  const products = window.products || [];

  // Count products per category
  const productCounts = {};
  products.forEach(p => {
    productCounts[p.category] = (productCounts[p.category] || 0) + 1;
  });

  sidebar.innerHTML = `
    <div class="category-sidebar-item" data-category="all">
      <img src="/icon-192.png" class="category-sidebar-icon">
      <span>All Products</span>
      <span class="category-sidebar-count">${products.length}</span>
    </div>
  `;

  categories.forEach(cat => {
    const count = productCounts[cat.name] || 0;

    const item = document.createElement("div");
    item.className = "category-sidebar-item";
    item.dataset.category = cat.name;

    item.innerHTML = `
      <img src="${cat.image}" class="category-sidebar-icon">
      <span>${cat.name}</span>
      <span class="category-sidebar-count">${count}</span>
    `;

    sidebar.appendChild(item);
  });

  // Click handler
  sidebar.querySelectorAll(".category-sidebar-item").forEach(item => {
    item.onclick = () => {
      sidebar.querySelectorAll(".category-sidebar-item")
        .forEach(i => i.classList.remove("active"));

      item.classList.add("active");

      const selected = item.dataset.category;

      if (selected === "all") {
        renderProducts(products);
      } else {
        const filtered = products.filter(p => p.category === selected);
        renderProducts(filtered);
      }
    };
  });
}

  function loadproductsFromLocalStorage() {
  const stored = localStorage.getItem("products");
  products = stored ? JSON.parse(stored) : [];
}

function migrateProducts() {
  let changed = false;

  products = products.map(p => {
    const updated = { ...p };

    // Convert old image → new imageUrl
    if (p.image && !p.imageUrl) {
      updated.imageUrl = p.image;
      delete updated.image;
      changed = true;
    }

    // Convert old lowStock → new lowStockThreshold
    if (p.lowStock && !p.lowStockThreshold) {
      updated.lowStockThreshold = p.lowStock;
      delete updated.lowStock;
      changed = true;
    }

    return updated;
  });

  if (changed) {
    localStorage.setItem("products", JSON.stringify(products));
  }
}


function loadCategoriesFromLocalStorage() {
  const stored = localStorage.getItem("categories");
  categories = stored ? JSON.parse(stored) : [];
}

function renderProducts(list = window.products || []) {
  console.log("🔥 renderProducts() fired");

  const container = document.getElementById("products-list");
  if (!container) return;

  container.innerHTML = "";

  list.forEach(product => {
    const row = document.createElement("div");
    row.className = "product-row";

    row.innerHTML = `
      <div class="product-row-header">
        <div class="product-row-main">
          <img src="${product.image || '/icon-192.png'}" class="product-thumb">
          <span class="product-name">${product.name}</span>
        </div>

        <div class="product-row-actions">
          <button class="product-edit-btn">Edit</button>
          <button class="product-delete-btn">Delete</button>
        </div>
      </div>

      <div class="product-row-details hidden">
        <p><strong>Category:</strong> ${product.category}</p>
        <p><strong>Stock:</strong> ${product.stock} ${product.unit}</p>
        <p><strong>Low Stock Threshold:</strong> ${product.lowStock}</p>
    <p><strong>Cost (avg):</strong> €${
  product.weightedCost != null
    ? product.weightedCost.toFixed(2)
    : product.unitPrice
}</p>


        <p><strong>Selling Price:</strong> €${product.sellPrice}</p>
        <img src="${product.image || '/icon-192.png'}" class="product-image-large">
      </div>
    `;

    // Expand/collapse
    row.querySelector(".product-row-header").onclick = (e) => {
      e.stopPropagation();
      row.querySelector(".product-row-details").classList.toggle("hidden");
    };

    // Edit
    row.querySelector(".product-edit-btn").onclick = (e) => {
      e.stopPropagation();
      openProductModal(product);
    };

    // Delete
    row.querySelector(".product-delete-btn").onclick = (e) => {
      e.stopPropagation();
      deleteProduct(product.id);
    };

    container.appendChild(row);
  });
}

/* 4.2 openProductModal() */
function openProductModal(product = null) {
  console.log("OPEN PRODUCT MODAL FIRED", product);

// Hide all other windows

 const modal = document.getElementById("product-modal");

  if (product) {
    // Editing
    editingProductId = product.id;
    currentEditingImage = product.image;  // FIXED

    document.getElementById("product-name").value = product.name || "";
    document.getElementById("category-selector-input").value = product.category || "";
    document.getElementById("product-opening-stock").value = product.stock || "";
    document.getElementById("product-stock-unit").value = product.unit || "#";
document.getElementById("product-unit-price").value =
  (product.weightedCost != null ? product.weightedCost : product.unitPrice) || "";



    document.getElementById("product-selling-price").value = product.sellPrice || "";
    document.getElementById("product-low-stock").value = product.lowStock || "";  // FIXED

    // Image preview
    document.getElementById("product-image-preview").src = product.image || "";  // FIXED
    document.getElementById("product-image-input").value = "";

    document.querySelector(".modal-title").textContent = "Edit Product";

  } else {
    // Adding new product
    editingProductId = null;
    currentEditingImage = "";

    document.getElementById("product-name").value = "";
    document.getElementById("category-selector-input").value = "";
    document.getElementById("product-opening-stock").value = "";
    document.getElementById("product-stock-unit").value = "#";
    document.getElementById("product-unit-price").value = "";
    document.getElementById("product-selling-price").value = "";
    document.getElementById("product-low-stock").value = "";
    document.getElementById("product-image-input").value = "";
    document.getElementById("product-image-preview").src = "";

    document.querySelector(".modal-title").textContent = "Add Product";
  }

  modal.classList.remove("hidden");
}

/* 4.3 deleteProduct() */
async function deleteProduct(id) {
  await db.collection("products").doc(id).delete();
  await loadProductsFromFirestore();
  renderProducts(products);
}

function addProduct() {
  const name = document.getElementById("product-name").value;
  const category = document.getElementById("product-category").value;
  const stock = Number(document.getElementById("product-opening-stock").value);
  const unit = document.getElementById("product-stock-unit").value;
  const unitPrice = Number(document.getElementById("product-unit-price").value);
  const sellPrice = Number(document.getElementById("product-selling-price").value);

  const fileInput = document.getElementById("product-image-input");
  const file = fileInput.files[0];

  const id = editingProductId || Date.now();

  const save = (image) => {
    const product = {
      id,
      name,
      category,
      stock,
      unit,
      unitPrice,
      sellPrice,
      image,
      weightedCost: unitPrice,
    };

    if (editingProductId) {
      const index = products.findIndex(p => p.id === editingProductId);
      products[index] = {
        ...products[index],
        name,
        category,
        stock,
        unit,
        unitPrice,
        sellPrice,
        image,
        weightedCost: products[index].weightedCost ?? unitPrice
      };
    }
    else {
      products.push(product);
    }

    localStorage.setItem("products", JSON.stringify(products));
    editingProductId = null;
    currentEditingImage = "";
  };

  // ⭐ THIS WAS OUTSIDE — now fixed
  if (file) {
    handleImageUpload(file, (base64Image) => save(base64Image));
  } else {
    save(currentEditingImage || "");
  }
}

/* =====================================================
   5. INVENTORY SYSTEM
   ===================================================== */
function calculateWeightedCost(item) {
  // If no restocks yet → use unitPrice
  if (!item.restocks || item.restocks.length === 0) {
    return item.unitPrice ?? 0;
  }

  let totalUnits = 0;
  let totalCost = 0;

  item.restocks.forEach(r => {
    totalUnits += r.qty;
    totalCost += r.qty * r.cost;
  });

  return totalUnits > 0 ? totalCost / totalUnits : 0;
}

/* 5.1 renderInventory() */
console.log("CHECKPOINT BEFORE RENDER");

function renderInventory(list = inventory) {
  const tbody = document.getElementById("inventory-body");
  tbody.innerHTML = "";

  list.forEach(item => {
    const row = document.createElement("tr");

    // Row colour coding
    if (item.stock === 0) {
      row.classList.add("out-of-stock");
    } else if (item.stock <= item.lowStock) {
      row.classList.add("low-stock");
    }

    // Weighted cost (calculated from restocks)
   const weightedCost = item.weightedCost.toFixed(2);
 
    row.innerHTML = `
      <td>
        <input type="checkbox"
       class="bulk-select"
       data-id="${item.id}"
       ${item.bulkUpdate ? "checked" : ""}>

      </td>

      <td>
        <input type="checkbox"
               class="available-toggle"
               data-id="${item.id}"
               ${item.available ? "checked" : ""}>
      </td>

      <td>
        ${item.image ? `<img src="${item.image}" class="inv-thumb">` : ""}
      </td>

    <td class="inv-name" data-id="${item.id}" 
    style="cursor:pointer; color:#1b5e20; text-decoration:underline;">
    ${item.name || "-"}
</td>

      <td>${item.category || "-"}</td>

      <td>${item.stock ?? 0}</td>
      <td>${item.unit || "-"}</td>

      <td>${weightedCost}</td>

      <td>${item.sellPrice != null ? item.sellPrice.toFixed(2) : "-"}</td>

      <td>${item.lowStock ?? "-"}</td>
      <td>${item.stock <= item.lowStock ? "Low" : "OK"}</td>

      <td>
        <button class="edit-btn" data-id="${item.id}">Edit</button>
      </td>
      <td>
        <button class="delete-btn" data-id="${item.id}">Delete</button>
      </td>
    `;

    tbody.appendChild(row);
  });

  wireInventoryRowControls();
  setupBulkStockHandlers(document, inventory);

  updateBulkCount();
}

function openBulkUpdateModal(selectedItems) {
  console.log("openBulkUpdateModal CALLED");

  const modal = document.getElementById("bulk-update-modal");
  const list = document.getElementById("bulk-update-list");
  const title = document.getElementById("bulk-update-title");

  console.log("LIST ELEMENT:", list);
console.log("LIST CHILDREN BEFORE:", list.children.length);


  title.textContent = `Bulk Update Stock for ${selectedItems.length} Products`;
  list.innerHTML = "";

  selectedItems.forEach(item => {
    console.log("ITEM:", item);

    console.log("Reached before multipack for:", item.name);
    const row = document.createElement("div");
    row.className = "bulk-row";

    // MAIN ROW
    const main = document.createElement("div");
    main.className = "bulk-main";

    const name = document.createElement("div");
    name.className = "bulk-name";
    name.textContent = item.name;

    const current = document.createElement("div");
    current.className = "bulk-current";
    current.textContent = `Current: ${item.stock} ${item.unit}`;

    const qty = document.createElement("input");
    qty.type = "number";
    qty.className = "bulk-qty";
    qty.dataset.id = item.id;
    qty.placeholder = "Qty";

    const cost = document.createElement("input");
    cost.type = "number";
    cost.className = "bulk-cost";
    cost.dataset.id = item.id;
    cost.placeholder = "Unit Cost (€)";
    console.log("Reached multipack creation for:", item.name);

    const mpBtn = document.createElement("button");
    mpBtn.className = "bulk-mp-btn";
    mpBtn.dataset.id = item.id;
    mpBtn.textContent = "Multipack ▼";

    main.appendChild(name);
    main.appendChild(current);
    main.appendChild(qty);
    main.appendChild(cost);
    main.appendChild(mpBtn);

    // MULTIPACK ROW
    const mp = document.createElement("div");
    mp.className = "bulk-multipack hidden";
    mp.id = `mp-${item.id}`;

    const mpCount = document.createElement("input");
    mpCount.type = "number";
    mpCount.className = "mp-count";
    mpCount.dataset.id = item.id;
    mpCount.placeholder = "Multipacks";

    const mpSize = document.createElement("input");
    mpSize.type = "number";
    mpSize.className = "mp-size";
    mpSize.dataset.id = item.id;
    mpSize.placeholder = "Units per pack";

    const mpCost = document.createElement("input");
    mpCost.type = "number";
    mpCost.className = "mp-cost";
    mpCost.dataset.id = item.id;
    mpCost.placeholder = "Cost per pack (€)";

  mp.append(mpCount, mpSize, mpCost);
console.log("MP CHILDREN:", mp.children);


    // BUILD ROW
    row.appendChild(main);
    row.appendChild(mp);

    list.appendChild(row);
  });

  console.log("FINAL LIST HTML:", list.innerHTML);

  modal.classList.remove("hidden");
}

function attachBulkCheckboxHandlers() {
  document.querySelectorAll('.inv-bulk-update').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.id;
      const item = inventory.find(i => i.id == id);

      if (item) {
        item.bulkUpdate = cb.checked;
        saveInventory();
      }

      updateBulkCount();
    });
  });
}

function getInventory() {
    return inventory;
}

function findProductByName(name) {
    const lower = name.toLowerCase().trim();
    return inventory.find(item => {
        const itemName = item.name.toLowerCase();
        const words = lower.split(" ");
        return words.every(w => itemName.includes(w));
    });
}

  /* 5.2 available checkbox handler */
  document.querySelectorAll(".inv-available").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const id = e.target.dataset.id;
      const item = inventory.find(i => i.id == id);
      if (!item) return;

      item.available = e.target.checked;
      saveInventory();
    });
  });

  async function handleChatSubmit() {
    const input = document.getElementById("chatbox-input");
    const message = input.value.trim();
    if (!message) return;

    addChatMessage("user", message);

    const reply = await processChatQuery(message);
    addChatMessage("assistant", reply);

    input.value = "";
}


function updateBulkCount() {
  const count = inventory.filter(i => i.bulkUpdate).length;
  document.getElementById("bulk-count").textContent = count;
}

function setupBulkStockHandlers(root, inventory) {
  // Bulk Update button (opens modal)
  const bulkBtn = root.querySelector("#bulk-update-btn");
  if (bulkBtn) {
    bulkBtn.onclick = () => {
      const selected = inventory.filter(i => i.bulkUpdate);
      if (selected.length === 0) {
        alert("No products selected.");
        return;
      }
    };
    }
  }

  // Cancel button (close modal)
  const cancelBtn = document.getElementById("bulk-update-cancel");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      document.getElementById("bulk-update-modal").classList.add("hidden");
    };
  }

  // Multipack dropdown toggle (instant show/hide)
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("bulk-mp-btn")) {
      const id = e.target.dataset.id;
      const box = document.getElementById(`mp-${id}`);

      const isHidden = box.classList.contains("hidden");
      box.classList.toggle("hidden");

      e.target.textContent = isHidden ? "Multipack ▲" : "Multipack ▼";
    }
  });

 document.addEventListener("click", (e) => {

    // Prevent stats window from opening when clicking PP card or PP button
    if (e.target.closest(".pp-card") || e.target.closest(".stats-btn")) {
        return;
    }

    // Open statistics window when clicking product name
    if (e.target.classList.contains("inv-name")) {

        const productId = e.target.dataset.id;
        const productName = e.target.textContent;

        currentStatsProductId = productId;

        document.getElementById("inventory-window").classList.add("hidden");
        document.getElementById("statistics-window").classList.remove("hidden");

        document.getElementById("stats-product-title").textContent =
            "Statistics: " + productName;

        console.log("Opening stats for product ID:", productId);
    }
});


/* =====================================================
   6. CATEGORY SELECTOR (searchable dropdown)
   ===================================================== */

function initCategorySelector() {
  const input = document.getElementById("category-selector-input");
  const dropdown = document.getElementById("category-selector-dropdown");

  if (!input || !dropdown) {
    console.warn("Category selector elements missing");
    return;
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== input) {
      dropdown.classList.add("hidden");
    }
  });

  input.addEventListener("input", () => {
    const categories = JSON.parse(localStorage.getItem("categories") || "[]");
    const term = input.value.toLowerCase().trim();

    dropdown.innerHTML = "";

    if (term.length === 0) {
      dropdown.classList.add("hidden");
      return;
    }

    // Only categories that START with the typed letters
    const matches = categories.filter(c =>
      c.name.toLowerCase().startsWith(term)
    );

    if (matches.length === 0) {
      const noItem = document.createElement("div");
      noItem.className = "dropdown-no-results";
      noItem.textContent = "No results found";
      dropdown.appendChild(noItem);
      dropdown.classList.remove("hidden");
      return;
    }

    matches.forEach(cat => {
      const item = document.createElement("div");
      item.className = "dropdown-item-modern";

      item.innerHTML = `
        <img src="${cat.image}" class="dropdown-icon">
        <span>${cat.name}</span>
      `;

      item.onclick = () => {
        input.value = cat.name;
        dropdown.classList.add("hidden");
      };

      dropdown.appendChild(item);
    });

    dropdown.classList.remove("hidden");
  });
}


/* =====================================================
   7. SECTION NAVIGATION (sidebar)
   ===================================================== */
async function openSection(section) {
  console.log("🔥 openSection() fired with:", section);
  console.log("Opening section called with:", section);

  // Hide all windows
  document.querySelectorAll(".window").forEach(w => w.classList.add("hidden"));

  const win = document.getElementById(section);
  if (!win) {
    console.warn("Window not found:", section);
    return;
  }

  win.classList.remove("hidden");

  // Initialize window ONCE
  if (!win.hasAttribute("data-initialized")) {

    if (section === "products-window") {
      initProductsUI();
      initProductImageUpload();
      initCategorySelector();
    }

    if (section === "inventory-window") {
      await initInventory();
    }

if (section === "categories-window") {
  renderCategories(); // redraw the grid
}

    win.setAttribute("data-initialized", "true");
  }
}

if (!window.sidebarInitialized) {
  window.sidebarInitialized = true;

  document.querySelectorAll(".sidebar-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.isTrusted === false) return; //ignore programmatic clicks
      const section = item.dataset.section;
      openSection(section);
    });
  });

}

function initProductsUI() {
  console.log("Initializing Products UI…");

  const searchInput = document.getElementById("products-search");
  console.log("Search input found:", searchInput);

  if (searchInput) {
    console.log("Search listener attached");

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();

      const filtered = window.products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );

      renderProducts(filtered);
    });
  }
 }

/* =====================================================
   8. IMAGE UPLOAD HANDLERS
   ===================================================== */

   // Upload category icon to Firebase Storage
async function uploadCategoryIcon(file) {
  if (!file) return null;

  const storageRef = storage.ref(`categories/${Date.now()}-${file.name}`);
  await storageRef.put(file);
  return await storageRef.getDownloadURL();
}

/* =====================================================
   9. DOMCONTENTLOADED INITIALIZATION
   ===================================================== */

  // Cancel product modal
  // Cancel button — one clean listener
const productCancelBtn = document.getElementById("product-cancel-btn");
if (productCancelBtn) {
  productCancelBtn.addEventListener("click", () => {
    document.getElementById("product-modal").classList.add("hidden");
    document.getElementById("modal-overlay")?.classList.add("hidden");
    editingProductId = null;
    currentEditingImage = "";
  });
}

const newSaveBtn = document.getElementById("product-save-btn");
newSaveBtn.addEventListener("click", saveProduct);


// Add Category button
const addCategoryBtn = document.getElementById("add-category-btn");
if (addCategoryBtn) {
  addCategoryBtn.addEventListener("click", openAddCategory);
}

// Category image preview (live preview when selecting a file)
const categoryImgInput = document.getElementById("category-image-input");
const categoryImgPreview = document.getElementById("category-image-preview");

if (categoryImgInput && categoryImgPreview) {
  categoryImgInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      categoryImgPreview.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function showDuplicatePopup(message) {
  document.getElementById("duplicate-message").textContent = message;
  document.getElementById("duplicate-modal").style.display = "flex";
}

function hideDuplicatePopup() {
  document.getElementById("duplicate-modal").style.display = "none";
}

document.getElementById("duplicate-ok").addEventListener("click", hideDuplicatePopup);
document.getElementById("duplicate-cancel").addEventListener("click", hideDuplicatePopup);


function closeProductModal() {
  const modal = document.getElementById("product-modal");
  if (modal) {
    modal.classList.add("hidden");
  }

  // Reset editing state
  editingProductId = null;
  currentEditingImage = null;

  // Clear form fields
  document.getElementById("product-name").value = "";
  document.getElementById("category-selector-input").value = "";
  document.getElementById("product-opening-stock").value = "";
  document.getElementById("product-stock-unit").value = "#";
  document.getElementById("product-unit-price").value = "";
  document.getElementById("product-selling-price").value = "";
  document.getElementById("product-low-stock").value = "";
  document.getElementById("product-image-input").value = "";
}

async function loadProductsFromFirestore() {
  console.log("🔥 loadProductsFromFirestore() fired");

  const snapshot = await db.collection("products").get();
  const loadedProducts = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Update the global products array
  products = loadedProducts;
  window.products = loadedProducts;

  // Sync inventory with the freshly loaded products
  syncInventoryFromProducts();
  saveInventory();

  // Render the inventory
  renderInventory(inventory);

  return loadedProducts;
}

async function saveProduct() {
  console.log("saveProduct() was called");

  // Correct IDs based on your HTML
  const nameInput = document.getElementById("product-name");
  const categoryInput = document.getElementById("category-selector-input");
  const stockInput = document.getElementById("product-opening-stock");
  const unitInput = document.getElementById("product-stock-unit");
  const unitPriceInput = document.getElementById("product-unit-price");
  const sellPriceInput = document.getElementById("product-selling-price");
  const lowStockInput = document.getElementById("product-low-stock");
  const imageInput = document.getElementById("product-image-input");

  const name = nameInput.value.trim();
  const category = categoryInput.value.trim();
  const stock = Number(stockInput.value || 0);
  const unit = unitInput.value || "#";
  const unitPrice = Number(unitPriceInput.value || 0);
  const sellPrice = Number(sellPriceInput.value || 0);
  const lowStock = Number(lowStockInput.value || 0);

  if (!name) {
    showDuplicatePopup("Please enter a product name.");
    return;
  }

  if (!category) {
    showDuplicatePopup("Please select a category.");
    return;
  }

  // Normalised fields for duplicate checking
  const nameLower = name.toLowerCase();
  const categoryLower = category.toLowerCase();

  // 🔍 DUPLICATE CHECK (corrected)
  const duplicateQuery = await db.collection("products")
    .where("nameLower", "==", nameLower)
    .where("categoryLower", "==", categoryLower)
    .get();

  if (!editingProductId) {
    // Adding a new product
    if (!duplicateQuery.empty) {
      showDuplicatePopup(
        `The product "${name}" already exists in the "${category}" category.`
      );
      return;
    }
  } else {
    // Editing → exclude the current product
    const isDuplicate = duplicateQuery.docs.some(doc => doc.id !== editingProductId);

    if (isDuplicate) {
      showDuplicatePopup(
        `Another product with the name "${name}" already exists in the "${category}" category.`
      );
      return;
    }
  }

  // IMAGE HANDLING
  let imageUrl = currentEditingImage;

  if (imageInput.files && imageInput.files[0]) {
    imageUrl = await uploadProductImage(imageInput.files[0], name);
  }

  const productData = {
    name,
    category,
    nameLower,
    categoryLower,
    stock,
    unit,
    unitPrice,
    sellPrice,
    lowStock,
    image: imageUrl,
    available: true
  };

  try {
    let productId;

   if (editingProductId) {
  // UPDATE existing product
  productId = editingProductId;
  await db.collection("products").doc(productId).update(productData);

  // ⭐ DO NOT RESET INVENTORY HERE
} else {
  // ADD new product
  const docRef = await db.collection("products").add(productData);
  productId = docRef.id;
  productData.id = productId;

  // ⭐ CREATE INVENTORY ONLY ONCE (when product is created)
  console.log("🔥 Creating initial inventory for:", productId);

  await db.collection("inventory").doc(productId).set(
    {
      productId,
      available: true,
      stock: 0,               // initial stock
      lowStockThreshold: 5,
      totalUnitsPurchased: 0,
      totalCostPurchased: 0,
      totalUnitsSold: 0,
      totalDaysAccumulated: 0
    },
    { merge: true }
  );
}


    // REFRESH UI
    await loadProductsFromFirestore();
    renderProducts(products);
    renderProductCategoriesSidebar();

    // CLOSE modal
    document.getElementById("product-modal").classList.add("hidden");

    // RESET editing state
    editingProductId = null;
    currentEditingImage = "";

  } catch (error) {
    console.error("Error saving product:", error);
    showDuplicatePopup("Failed to save product.");
  }
}

// Wire up per-row controls (available toggle, edit, delete, bulk)
function wireInventoryRowControls() {

  // Availability toggle
  document.querySelectorAll(".available-toggle").forEach(cb => {
    cb.addEventListener("change", async () => {
      const id = cb.dataset.id;
      const docRef = db.collection("products").doc(id);
      await docRef.update({ available: cb.checked });

      // Update in global products array
      const prod = products.find(p => p.id === id);
      if (prod) prod.available = cb.checked;

      // Update inventory
      const inv = inventory.find(i => i.id === id);
      if (inv) inv.available = cb.checked;

      saveInventory();
    });
  });


  // Bulk select checkbox
  document.querySelectorAll(".bulk-select").forEach(cb => {
    cb.addEventListener("change", () => {
      const id = cb.dataset.id;
      const item = inventory.find(i => i.id === id);

      if (item) {
        item.bulkUpdate = cb.checked;
        saveInventory();
        if (typeof updateBulkCount === "function") updateBulkCount();
      }
    });
  });


  // Edit button
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      editProduct(id);
    });
  });


  // Delete button
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;

      const confirmDelete = window.confirm("Delete this product?");
      if (!confirmDelete) return;

      // Delete from Firestore
      await db.collection("products").doc(id).delete();

      // Remove from global products array
      products = products.filter(p => p.id !== id);

      // Remove from inventory
      inventory = inventory.filter(i => i.id !== id);

      saveInventory();
      renderInventory(inventory);
    });
  });

}



// Search/filter inventory
function filterInventory() {
  const searchInput = document.getElementById("products-search");
  if (!searchInput) {
    renderInventory(inventory);
    return;
  }

  const term = searchInput.value.toLowerCase().trim();

  const filtered = inventory.filter(p =>
    (p.nameLower && p.nameLower.includes(term)) ||
    (p.categoryLower && p.categoryLower.includes(term))
  );

  renderInventory(filtered);
}

// Initialize inventory system
async function initInventory() {
  // Load products from Firestore and sync inventory
  await loadProductsFromFirestore();

  // Render the synced inventory
  renderInventory(inventory);

  const searchInput = document.getElementById("inventory-search");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const term = searchInput.value.toLowerCase();

      const filtered = inventory.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );

      renderInventory(filtered);
    });
  }
}


function initProductImageUpload() {
  const imgInput = document.getElementById("product-image-input");
  const imgPreview = document.getElementById("product-image-preview");

  if (!imgInput || !imgPreview) return;

  imgInput.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      currentEditingImage = reader.result;
      imgPreview.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}



// Placeholder: product analytics modal
function openProductAnalytics(product) {
  console.log("Open analytics for:", product);
  // Later: show modal + graphs here
}

// Placeholder: edit product
function openEditProduct(productId) {
  console.log("Open edit for:", productId);
  // Later: open your existing product modal in edit mode
}

window.addEventListener("load", async () => {
  console.log("Load Wrapper Fired");

  // ---------------------------------------------------
// ⭐ FIRESTORE EVENT FUNCTIONS ⭐
// ---------------------------------------------------

async function loadEventsFromFirestore() {
  console.log("Loading events from Firestore...");
  window.events = {};

  try {
    const snapshot = await db.collection("events").get();

    snapshot.forEach(doc => {
      const key = doc.id; // "2026-1-24"
      const data = doc.data();

      if (data.events) {
        window.events[key] = data.events;
      }
    });

    console.log("Events loaded:", window.events);
  } catch (error) {
    console.error("Error loading events:", error);
  }
}

  // 1. Load categories from Firestore FIRST
  console.log("checkpoint A: calling loadCategoriesFromFirestore");
  try {
    window.categories = await loadCategoriesFromFirestore();
    console.log("checkpoint B: loadCategoriesFromFirestore finished");
  } catch (err) {
    console.log("ERROR inside loadCategoriesFromFirestore:", err);
  }
  console.log("checkpoint C: after loadCategoriesFromFirestore");

  // 2. Migrate old localStorage categories into Firestore
  const oldLocalCategories = JSON.parse(localStorage.getItem("categories") || "[]");
  if (oldLocalCategories.length > 0) {
    console.log("Migrating old localStorage categories to Firestore…");

    for (const cat of oldLocalCategories) {
      const saved = await saveCategoryToFirestore({
        name: cat.name,
        image: cat.image || ""
      });

      window.categories.push(saved);
    }

    localStorage.removeItem("categories");
    console.log("Migration complete.");
  }

  // 4. Load products from Firestore
console.log("Loading products...");
try {
  window.products = await loadProductsFromFirestore();
  console.log("Products loaded:", window.products.length);
} catch (err) {
  console.error("Error loading products:", err);
}

// 5. Render product UI (sidebar + list)
renderProducts(window.products);
renderProductCategoriesSidebar();

await loadEventsFromFirestore();

console.log("Loading recurring events from Firestore...");
await loadRecurringEventsFromFirestore();
console.log("Recurring events loaded:", window.recurringEvents);


 // 10. Add product button
  const addProductBtn = document.getElementById("add-product-btn");
  if (addProductBtn) {
    addProductBtn.addEventListener("click", () => openProductModal(null));
  }

  async function loadRecurringEventsFromFirestore() {
  console.log("📆 Loading recurring events from Firestore...");

  try {
    const snapshot = await db.collection("recurringEvents").get();
    window.recurringEvents = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      window.recurringEvents.push({
        id: doc.id,
        title: data.title,
        time: data.time || "",
        startDate: data.startDate, // "YYYY-M-D"
        recurrence: data.recurrence || { type: "none" }
      });
    });

    console.log("📆 Recurring events loaded:", window.recurringEvents);
  } catch (error) {
    console.error("❌ Error loading recurring events:", error);
  }
}

  // ---------------------------------------------------
// ⭐ CALENDAR SYSTEM ⭐
// ---------------------------------------------------

// Event modal

document.getElementById("event-cancel").addEventListener("click", () => {
  document.getElementById("event-modal").style.display = "none";
});

document.getElementById("event-save").addEventListener("click", (event) => {
  event.stopPropagation();
  console.log("🔥 Save button clicked!");

  const modal = document.getElementById("event-modal");

  const day = parseInt(modal.dataset.day, 10);
  const month = parseInt(modal.dataset.month, 10); // zero-based
  const year = parseInt(modal.dataset.year, 10);

  const title = document.getElementById("event-title").value.trim();
  const time = document.getElementById("event-time").value.trim();
  const repeat = document.getElementById("event-repeat").value; // ⭐ NEW

  if (!title) {
    alert("Please enter a title");
    return;
  }

  console.log("🔥 Saving event with:", { day, month, year, title, time, repeat });

  if (repeat === "none") {
    // ⭐ ONE-OFF EVENT
    saveEventToFirestore(year, month, day, title, time).then(() => {
      modal.style.display = "none";
      renderCalendar(currentMonth, currentYear);
    });
  } else {
    // ⭐ RECURRING EVENT
    saveRecurringEventToFirestore(year, month, day, title, time, repeat).then(() => {
      modal.style.display = "none";
      renderCalendar(currentMonth, currentYear);
    });
  }
});


// ===============================
// CALENDAR RENDERER (FULL SYSTEM)
// ===============================

// Global state (you already have these)

// Helper: days in month
function daysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

// Helper: month names
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function isDateInRecurrence(recEvent, cellYear, cellMonthZeroBased, cellDay) {
  const [startYear, startMonth, startDay] = recEvent.startDate
    .split("-")
    .map(n => parseInt(n, 10)); // startMonth is 1-based

  const startDate = new Date(startYear, startMonth - 1, startDay);
  const cellDate = new Date(cellYear, cellMonthZeroBased, cellDay);

  // Recurring events never occur before their start date
  if (cellDate < startDate) return false;

  const type = recEvent.recurrence?.type || "none";

  // WEEKLY recurrence
  if (type === "weekly") {
    const diffMs = cellDate - startDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays % 7 === 0;
  }

  // MONTHLY recurrence (same day each month)
  if (type === "monthly") {
    const sameDay = cellDay === startDay;
    const monthDiff =
      (cellYear - startYear) * 12 + (cellMonthZeroBased + 1 - startMonth);
    return monthDiff >= 0 && sameDay;
  }

  // YEARLY recurrence (same month + same day)
  if (type === "yearly") {
    const sameMonth = cellMonthZeroBased + 1 === startMonth;
    const sameDay = cellDay === startDay;
    return sameMonth && sameDay && cellYear >= startYear;
  }

  return false;
}

// 🔊 Reminder sound
const reminderSound = new Audio("sounds/reminder.mp3");

function playReminderSound() {
  reminderSound.currentTime = 0;
  reminderSound.play().catch(err => console.warn("Sound blocked:", err));
}

// 😴 Snooze logic
function snoozeReminder(eventId, minutes = 5) {
  const newTrigger = Date.now() + minutes * 60 * 1000;
  window.events[eventId].nextTrigger = newTrigger;
  scheduleReminder(eventId);
}

// ❌ Cancel / dismiss logic
function cancelReminder(eventId) {
  window.events[eventId].nextTrigger = null;
}

// MAIN RENDER FUNCTION
// 
function renderCalendar(month = currentMonth, year = currentYear) {
  currentMonth = month;
  currentYear = year;

  console.log("🔥 renderCalendar() fired, event keys:", Object.keys(window.events || {}));
  console.log("🔥 renderCalendar() fired");

  const grid = document.getElementById("calendar-grid");
  const header = document.getElementById("cal-month-year");


  if (!grid) {
    console.error("❌ calendar-grid NOT FOUND");
    return;
  }

  if (!header) {
    console.error("❌ cal-month-year NOT FOUND");
    return;
  }

  // Clear previous grid
  grid.innerHTML = "";

  // Set header text
  header.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const totalDays = daysInMonth(currentMonth, currentYear);

  // Determine the weekday of the 1st (0 = Monday, 6 = Sunday)
let firstDay = new Date(currentYear, currentMonth, 1).getDay();
// Convert JS Sunday=0 → Monday=0
firstDay = (firstDay === 0) ? 6 : firstDay - 1;

// Insert blank cells before day 1
for (let i = 0; i < firstDay; i++) {
  const blank = document.createElement("div");
  blank.classList.add("blank-day");
  grid.appendChild(blank);
}


  for (let day = 1; day <= totalDays; day++) {
    const cell = document.createElement("div");
    cell.classList.add("calendar-day");
    cell.textContent = day;

    // ⭐ Highlight today
const today = new Date();
if (
  day === today.getDate() &&
  currentMonth === today.getMonth() &&
  currentYear === today.getFullYear()
) {
  cell.classList.add("today");
}

// ⭐ Highlight weekends (Saturday + Sunday)
// ⭐ Correct weekend detection using visual grid position
const visualColumn = (firstDay + (day - 1)) % 7;

// 5 = Saturday, 6 = Sunday
if (visualColumn === 5 || visualColumn === 6) {
  cell.classList.add("weekend");
}

    // Build event key
// Build event key for one-off events
const key = `${currentYear}-${currentMonth + 1}-${day}`;
console.log("🔍 RENDER looking for key:", key);
console.log("🔍 AVAILABLE keys:", Object.keys(window.events));

// Check one-off events
let hasEvent = window.events[key] && window.events[key].length > 0;

// Check recurring events
if (!hasEvent && Array.isArray(window.recurringEvents)) {
  for (const rec of window.recurringEvents) {
    if (isDateInRecurrence(rec, currentYear, currentMonth, day)) {
      hasEvent = true;
      break;
    }
  }
}

// Add event dot if needed
if (hasEvent) {
  const dot = document.createElement("div");
  dot.classList.add("event-dot");
  cell.appendChild(dot);
}


    // CLICK HANDLER
    cell.addEventListener("click", () => {
      console.log("🔥 Day clicked:", day, currentMonth, currentYear);
      openEventModal(day, currentMonth, currentYear);
    });

    grid.appendChild(cell);
  }
}

// ===============================
// MONTH NAVIGATION
// ===============================

document.getElementById("cal-prev")?.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentMonth, currentYear);
});

document.getElementById("cal-next")?.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentMonth, currentYear);
});

// ===============================
// OPEN CALENDAR BUTTON
// ===============================

document.getElementById("open-calendar")?.addEventListener("click", () => {
  console.log("🔥 Calendar modal opened");
  document.getElementById("calendar-modal").style.display = "flex";
  renderCalendar();
});

// CLOSE BUTTON
document.getElementById("calendar-close")?.addEventListener("click", () => {
  document.getElementById("calendar-modal").style.display = "none";
});

function openEventModal(day, month, year) {
  console.log("🔥 openEventModal fired with:", day, month, year);

  const modal = document.getElementById("event-modal");
  if (!modal) {
    console.error("❌ event-modal NOT FOUND");
    return;
  }

  const label = document.getElementById("event-date-label");
  if (!label) {
    console.error("❌ event-date-label NOT FOUND");
    return;
  }

  const titleInput = document.getElementById("event-title");
  const timeInput = document.getElementById("event-time");
  const list = document.getElementById("event-list"); // ⭐ your event list container

  modal.dataset.day = day;
  modal.dataset.month = month;
  modal.dataset.year = year;

  // ⭐ Display UK format in the label
  label.textContent = `${day}/${month + 1}/${year}`;

  // ⭐ Clear inputs
  if (titleInput) titleInput.value = "";
  if (timeInput) timeInput.value = "";

  // ⭐ Build the SAME key format used by Firestore
const key = `${year}-${parseInt(month) + 1}-${day}`;
console.log("Looking for events under key:", key);

// One-off events
let eventsForDay = window.events[key] ? [...window.events[key]] : [];

// Recurring events
if (Array.isArray(window.recurringEvents)) {
  window.recurringEvents.forEach(rec => {
    if (isDateInRecurrence(rec, year, parseInt(month, 10), day)) {
      eventsForDay.push({
        title: rec.title,
        time: rec.time,
        _recurring: true
      });
    }
  });
}

console.log("Events for this day:", eventsForDay);


  // ⭐ Render the list
  if (list) {
    list.innerHTML = "";

    eventsForDay.forEach(ev => {
      const item = document.createElement("div");
      item.className = "event-item";
      item.textContent = `${ev.time || ""} ${ev.title}`;
      list.appendChild(item);
    });
  }

  modal.style.display = "flex";
}

function checkReminders() {
  const now = new Date();

  // ⭐ ONE-OFF EVENTS
  for (const key in window.events) {
    const [y, m, d] = key.split("-").map(n => parseInt(n, 10));
    const events = window.events[key];

    events.forEach(ev => {
      if (!ev.reminder || ev.reminder === "none") return;

      const [h, min] = ev.time.split(":").map(n => parseInt(n, 10));

      const eventDate = new Date(y, m - 1, d, h, min);
      const reminderDate = new Date(eventDate.getTime() - parseInt(ev.reminder, 10) * 60000);
console.log("🔍 Checking one-off event:", ev.title, "at", eventDate);
console.log("   Reminder should fire at:", reminderDate);


      if (
        now.getFullYear() === reminderDate.getFullYear() &&
        now.getMonth() === reminderDate.getMonth() &&
        now.getDate() === reminderDate.getDate() &&
        now.getHours() === reminderDate.getHours() &&
        now.getMinutes() === reminderDate.getMinutes()
      ) {
        showReminderPopup(ev.title, ev.time);
    console.log("🚨 REMINDER TRIGGERED:", ev.title, "scheduled for", eventDate);
    
      }
    });
  }

  // ⭐ RECURRING EVENTS
  window.recurringEvents.forEach(rec => {
    if (!rec.reminder || rec.reminder === "none") return;

    const [h, min] = rec.time.split(":").map(n => parseInt(n, 10));
    const now = new Date();
    console.log("⏰ checkReminders() running at", now.toString());


    if (!isDateInRecurrence(rec, now.getFullYear(), now.getMonth(), now.getDate())) {
      return;
    }

    const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min);
    const reminderDate = new Date(eventDate.getTime() - parseInt(rec.reminder, 10) * 60000);

    if (
      now.getFullYear() === reminderDate.getFullYear() &&
      now.getMonth() === reminderDate.getMonth() &&
      now.getDate() === reminderDate.getDate() &&
      now.getHours() === reminderDate.getHours() &&
      now.getMinutes() === reminderDate.getMinutes()
    ) {
      showReminderPopup(rec.title, rec.time);
    }
  });
}

// ---------------------------------------------------
// ⭐ END CALENDAR SYSTEM ⭐
// ---------------------------------------------------

  console.log("App fully initialized.");

  //11. Open default window AFTER everything is loaded
  openSection("home-window");
});
function showReminderPopup(title, time) {
  alert(`Reminder: ${title} at ${time}`);
}

function checkReminders() {
  const now = new Date();
  console.log("⏰ checkReminders() running at", now.toString());

  // ⭐ ONE-OFF EVENTS
  for (const key in window.events) {
    const [y, m, d] = key.split("-").map(n => parseInt(n, 10));
    const events = window.events[key];

    events.forEach(ev => {
      if (!ev.reminder || ev.reminder === "none") return;

      const [h, min] = ev.time.split(":").map(n => parseInt(n, 10));

      const eventDate = new Date(y, m - 1, d, h, min);
      const reminderDate = new Date(eventDate.getTime() - parseInt(ev.reminder, 10) * 60000);

      console.log("🔍 Checking one-off event:", ev.title, "at", eventDate);
      console.log("   Reminder should fire at:", reminderDate);

      if (
        now.getFullYear() === reminderDate.getFullYear() &&
        now.getMonth() === reminderDate.getMonth() &&
        now.getDate() === reminderDate.getDate() &&
        now.getHours() === reminderDate.getHours() &&
        now.getMinutes() === reminderDate.getMinutes()
      ) {
        console.log("🚨 REMINDER TRIGGERED:", ev.title, "scheduled for", eventDate);
        playReminderSound();
        showReminderPopup(ev.title, ev.time);
      }
    });
  }

  // ⭐ RECURRING EVENTS
  if (Array.isArray(window.recurringEvents)) {
    window.recurringEvents.forEach(rec => {
      if (!rec.reminder || rec.reminder === "none") return;

      const [h, min] = rec.time.split(":").map(n => parseInt(n, 10));

      if (!isDateInRecurrence(rec, now.getFullYear(), now.getMonth(), now.getDate())) {
        return;
      }

      const eventDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min);
      const reminderDate = new Date(eventDate.getTime() - parseInt(rec.reminder, 10) * 60000);

      console.log("🔁 Checking recurring event:", rec.title, "at", eventDate);
      console.log("   Reminder should fire at:", reminderDate);

      if (
        now.getFullYear() === reminderDate.getFullYear() &&
        now.getMonth() === reminderDate.getMonth() &&
        now.getDate() === reminderDate.getDate() &&
        now.getHours() === reminderDate.getHours() &&
        now.getMinutes() === reminderDate.getMinutes()
      ) {
        console.log("🚨 RECURRING REMINDER TRIGGERED:", rec.title, "scheduled for", eventDate);
        showReminderPopup(rec.title, rec.time);
      }
    });
  }
}

setInterval(() => {
  checkReminders();
}, 60000);

document.getElementById("snooze-btn").addEventListener("click", () => {
  snoozeReminder(activeEventId, 5);
  closeReminderPopup();
});

document.getElementById("expenses-btn").addEventListener("click", async () => {

    document.getElementById("settings-window").classList.remove("hidden");

    document.querySelectorAll("#settings-window .window-body > div[id$='-card']")
        .forEach(card => card.style.display = "none");

    const card = document.getElementById("expenses-card");
    card.style.display = "block";

    // Wait for DOM to render
    await new Promise(requestAnimationFrame);

    loadExpensesFromFirestore();
});



document.getElementById("dismiss-btn").addEventListener("click", () => {
  cancelReminder(activeEventId);
  closeReminderPopup();
});

document.addEventListener("DOMContentLoaded", () => {

    //
    // 1. SIDEBAR WINDOW SWITCHING
    //
    document.querySelectorAll(".sidebar-item").forEach(item => {
        item.addEventListener("click", () => {
            const target = item.dataset.section;

            document.querySelectorAll("[id$='-window']").forEach(w => w.classList.add("hidden"));

            const win = document.getElementById(target);
            if (win) win.classList.remove("hidden");

            if (target === "home-window") {
              updateSalesTodayCard();
              updateDailyProfitCard();
              updateStockAlertCard();
        }
     });
  });

console.log("REGISTERING BULK UPDATE LISTENER");


document.addEventListener("click", async (e) => {
  const btn = e.target.closest("#bulk-update-apply");
  if (!btn) return;

  console.log("🔥 APPLY BUTTON CLICKED (delegated)");
  await bulkStockUpdateAction();
});

    // 2. OPEN STATISTICS PAGE WHEN CLICKING PRODUCT NAME
    //
    document.getElementById("inventory-window").addEventListener("click", (e) => {
        if (e.target.classList.contains("inv-name")) {

            const productId = e.target.dataset.id;
            const productName = e.target.textContent;

            currentStatsProductId = productId;

            document.getElementById("inventory-window").classList.add("hidden");
            document.getElementById("statistics-window").classList.remove("hidden");

            document.getElementById("stats-product-title").textContent =
                "Statistics: " + productName;
        }
    });

    const bulkBtn = document.getElementById("bulk-update-btn");
if (bulkBtn) {
  bulkBtn.addEventListener("click", () => {
    const selected = inventory.filter(i => i.bulkUpdate);

    if (selected.length === 0) {
      alert("Select at least one item for bulk update.");
      return;
    }

    openBulkUpdateModal(selected);
  });
}

    // 3. STATISTICS BACK BUTTON
    //
    const backBtn = document.getElementById("stats-back-btn");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            document.getElementById("statistics-window").classList.add("hidden");
            document.getElementById("inventory-window").classList.remove("hidden");
        });
    }

    document.querySelectorAll(".sc-weekly, .sc-monthly").forEach(input => {
    input.addEventListener("input", calculateStaticCostsBreakEven);
});

    // 4. TS/MS/BS BUTTON
    //
    const tsmsbsBtn = document.getElementById("tsmsbs-btn");
    if (tsmsbsBtn) {
        tsmsbsBtn.addEventListener("click", () => {
            const card = document.getElementById("tsmsbs-card");
            card.style.display = "block";

            document.getElementById("ts-value").value = tsmsbsSettings.ts;
            document.getElementById("ms-value").value = tsmsbsSettings.ms;
            document.getElementById("bs-value").value = tsmsbsSettings.bs;
        });
    }


    //
    // 5. MEMBER TYPES BUTTON (correct position)
    //
    const memberTypesBtn = document.getElementById("membertypes-btn");
    if (memberTypesBtn) {
        memberTypesBtn.addEventListener("click", () => {
            loadMemberTypesFromFirestore();
            document.getElementById("membertypes-card").style.display = "block";
        });
    }

    const staffBtn = document.getElementById("staff-btn");
if (staffBtn) {
    staffBtn.addEventListener("click", () => {
        loadStaffFromFirestore();
        document.getElementById("staff-card").style.display = "block";
    });
}

document.getElementById("staticcosts-btn").addEventListener("click", () => {
    openSection("staticcosts-card");
});

    const staticCostsBtn = document.getElementById("staticcosts-btn");
    if (staticCostsBtn) {
        staticCostsBtn.addEventListener("click", (e) => {

          e.stopPropagation(); 
            loadStaticCostsFromFirestore();
            document.getElementById("staticcosts-card").style.display = "block";
        });
    }

});

// OPEN PRODUCT PERFORMANCE MODAL
function ppHandler(e) {
    console.log("RAW TARGET:", e.target);

    const trigger = e.target.closest(".pp-card, .stats-btn");
    console.log("CLOSEST TRIGGER:", trigger);

    if (!trigger) return;

    console.log("PP CLICKED");
    document.getElementById("product-performance-modal").classList.remove("hidden");
    loadProductPerformanceStats(currentStatsProductId);
}

document.addEventListener("click", ppHandler);

document.getElementById("pp-close").addEventListener("click", () => {
    document.getElementById("product-performance-modal").classList.add("hidden");
});

    // BACK BUTTON
    const backBtn = document.getElementById("stats-back-btn");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            document.getElementById("statistics-window").classList.add("hidden");
            document.getElementById("inventory-window").classList.remove("hidden");
        });
    }

  function cancelMemberTypes() {
    document.getElementById("membertypes-card").style.display = "none";
}

function loadProductPerformanceStats(productId) {
    const product = inventory.find(p => p.id == productId);

    console.log("PP PRODUCT:", product);

// Current margin calculations (from inventory)
// Current margin calculations (from inventory)
const price = Number(product.sellPrice) || 0;
const cost  = Number(product.weightedCost) || 0;

const currentProfitPerUnit = price - cost;
const currentMarginPercent = price > 0
    ? ((currentProfitPerUnit / price) * 100).toFixed(1)
    : 0;

    const sales = transactions.filter(t => t.productId == productId);

    const totalUnits = sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = sales.reduce((sum, s) => sum + (s.quantity * s.priceAtSale), 0);
    const totalCost = sales.reduce((sum, s) => sum + (s.quantity * s.costAtSale), 0);
    const totalProfit = totalRevenue - totalCost;

    const avgMargin = totalRevenue > 0
        ? ((totalProfit / totalRevenue) * 100).toFixed(1)
        : 0;

    const firstSale = sales.length ? sales[0].date : "No sales yet";
    const lastSale = sales.length ? sales[sales.length - 1].date : "No sales yet";

    // ⬇️ THIS IS THE PART YOU REPLACE — the html block
    const html = `
        <h3 style="margin-top:0; color:#1b5e20;">Current Profit Margin</h3>
        <div style="
            background:#e8f5e9;
            border:2px solid #1b5e20;
            padding:12px 16px;
            border-radius:8px;
            margin-bottom:20px;
        ">
            <p><strong>Profit per Unit:</strong> €${currentProfitPerUnit.toFixed(2)}</p>
            <p><strong>Margin Percentage:</strong> ${currentMarginPercent}%</p>
        </div>

        <h3 style="margin-top:0; color:#1b5e20;">Historical Performance</h3>
        <p><strong>Product:</strong> ${product.name}</p>
        <p><strong>Total Units Sold:</strong> ${totalUnits}</p>
        <p><strong>Total Revenue:</strong> €${totalRevenue.toFixed(2)}</p>
        <p><strong>Total Cost:</strong> €${totalCost.toFixed(2)}</p>
        <p><strong>Total Profit:</strong> €${totalProfit.toFixed(2)}</p>
        <p><strong>Average Margin:</strong> ${avgMargin}%</p>
        <p><strong>First Sale:</strong> ${firstSale}</p>
        <p><strong>Last Sale:</strong> ${lastSale}</p>
    `;

    document.getElementById("pp-body").innerHTML = html;
}

function isToday(dateString) {
    const d = new Date(dateString);
    const now = new Date();
    return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
    );
}

function getHourLabel(hour) {
    return hour.toString().padStart(2, "0") + ":00";
}

function getDayName(index) {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index];
}

async function loadTodayData() {
    const snapshot = await db.collection("transactions").get();

    const bucketsRevenue = {};
    const bucketsProfit = {};

    // Fill buckets for hours 10 → 23 and 00 → 02
    for (let h = 10; h <= 23; h++) {
        bucketsRevenue[h] = 0;
        bucketsProfit[h] = 0;
    }
    for (let h = 0; h <= 2; h++) {
        bucketsRevenue[h] = 0;
        bucketsProfit[h] = 0;
    }

    snapshot.forEach(doc => {
        const t = doc.data();
        if (!isToday(t.date)) return;

        const d = new Date(t.date);
        const hour = d.getHours();

        if (hour >= 10 || hour <= 2) {
            const revenue = t.priceAtSale * t.quantity;
            const profit = (t.priceAtSale - t.costAtSale) * t.quantity;

            bucketsRevenue[hour] += revenue;
            bucketsProfit[hour] += profit;
        }
    });

    return { bucketsRevenue, bucketsProfit };
}

async function loadWeekData() {
    const snapshot = await db.collection("transactions").get();

    const bucketsRevenue = { Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0, Sun:0 };
    const bucketsProfit  = { Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0, Sun:0 };

    snapshot.forEach(doc => {
        const t = doc.data();
        const d = new Date(t.date);

        const dayIndex = d.getDay(); // 0=Sun
        const dayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dayIndex];

        const revenue = t.priceAtSale * t.quantity;
        const profit = (t.priceAtSale - t.costAtSale) * t.quantity;

        bucketsRevenue[dayName] += revenue;
        bucketsProfit[dayName]  += profit;
    });

    return { bucketsRevenue, bucketsProfit };
}

async function loadMonthData() {
    const snapshot = await db.collection("transactions").get();

    const bucketsRevenue = {};
    const bucketsProfit  = {};

    for (let d = 1; d <= 31; d++) {
        bucketsRevenue[d] = 0;
        bucketsProfit[d] = 0;
    }

    snapshot.forEach(doc => {
        const t = doc.data();
        const d = new Date(t.date);
        const day = d.getDate();

        const revenue = t.priceAtSale * t.quantity;
        const profit = (t.priceAtSale - t.costAtSale) * t.quantity;

        bucketsRevenue[day] += revenue;
        bucketsProfit[day]  += profit;
    });

    return { bucketsRevenue, bucketsProfit };
}

async function updateCharts(range = "today") {
  console.log("Charts:", revenueChart, profitChart);

    let data;

    if (range === "today") {
        data = await loadTodayData();
        console.log("TODAY DATA:", data);


        const hours = [];
        for (let h = 10; h <= 23; h++) hours.push(h);
        for (let h = 0; h <= 2; h++) hours.push(h);

        const labels = hours.map(getHourLabel);

        revenueChart.data.labels = labels;
        revenueChart.data.datasets[0].data = hours.map(h => data.bucketsRevenue[h]);

        profitChart.data.labels = labels;
        profitChart.data.datasets[0].data = hours.map(h => data.bucketsProfit[h]);
    }

    if (range === "week") {
        data = await loadWeekData();

        const labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

        revenueChart.data.labels = labels;
        revenueChart.data.datasets[0].data = labels.map(d => data.bucketsRevenue[d]);

        profitChart.data.labels = labels;
        profitChart.data.datasets[0].data = labels.map(d => data.bucketsProfit[d]);
    }

    if (range === "month") {
        data = await loadMonthData();

        const labels = Array.from({length:31}, (_,i)=>i+1);

        revenueChart.data.labels = labels;
        revenueChart.data.datasets[0].data = labels.map(d => data.bucketsRevenue[d]);

        profitChart.data.labels = labels;
        profitChart.data.datasets[0].data = labels.map(d => data.bucketsProfit[d]);
    }

    revenueChart.update();
    profitChart.update();
}

document.querySelectorAll("#revenue-chart-card .chart-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#revenue-chart-card .chart-tabs button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        updateCharts(btn.dataset.range);
    });
});

document.addEventListener("DOMContentLoaded", () => {

    // ... your existing code ...

    // RETURN TO FRONT OFFICE BUTTON
    document.getElementById("back-to-front").addEventListener("click", () => {
        window.location.href = "frontoffice.html";
    });

});


document.querySelectorAll("#profit-chart-card .chart-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#profit-chart-card .chart-tabs button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        updateCharts(btn.dataset.range);
    });
});


function initCharts() {
    const revenueCtx = document.getElementById("revenueChart").getContext("2d");
    const profitCtx = document.getElementById("profitChart").getContext("2d");

    revenueChart = new Chart(revenueCtx, {
        type: "line",
        data: { labels: [], datasets: [{ label: "Revenue", data: [], borderColor: "#1b5e20", borderWidth: 2, tension: 0 }] }
    });

    profitChart = new Chart(profitCtx, {
        type: "line",
        data: { labels: [], datasets: [{ label: "Profit", data: [], borderColor: "#1b5e20", borderWidth: 2, tension: 0 }] }
    });
}


window.addEventListener("load", () => {
    initCharts();
    updateCharts("today");
    updateSalesTodayCard();
    updateDailyProfitCard();
   
});


setInterval(updateSalesTodayCard, 10000); // updates every 10 seconds

setInterval(() => updateCharts("today"), 10000);

