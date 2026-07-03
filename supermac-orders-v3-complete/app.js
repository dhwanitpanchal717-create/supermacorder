/* Supermac Orders V3 Complete
   Admin: Add, Edit, Delete Orders
   Engineer: Search and View Orders
*/

// Paste your Apps Script Web App URL here.
// Correct format: https://script.google.com/macros/s/AKfycbxxxxxxxxxxxx/exec
const API_URL = "https://script.google.com/macros/s/AKfycbyxH8d5z4jdrQliubYrk6L0EdAr9TQ7LfF3Y5PJ5RJ8ElFfC5b2R7bZqzS0cR0DLJ_e/exec";

const DEMO_MODE = !API_URL || API_URL.includes("PASTE_YOUR_WEB_APP_URL_HERE");

const DEMO_USERS = [
  { name: "Admin", role: "Admin", pin: "4321" },
  { name: "Engineer", role: "Engineer", pin: "2222" }
];

let state = { user: null, orders: [], editingOrderID: null };
const $ = (id) => document.getElementById(id);

function toast(message) {
  const el = $("toast");
  if (!el) return alert(message);
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2800);
}
function todayISO(){ return new Date().toISOString().slice(0,10); }
function nowString(){ return new Date().toLocaleString("en-IN",{hour12:true}); }

function saveLocal(){ if(DEMO_MODE) localStorage.setItem("supermacOrdersV3", JSON.stringify(state.orders)); }
function loadLocal(){
  if(!DEMO_MODE) return;
  const saved = localStorage.getItem("supermacOrdersV3");
  if(saved){ state.orders = JSON.parse(saved); return; }
  state.orders = [
    {orderID:"SM-2026-001",orderDate:todayISO(),buyerName:"Raj Plastics",companyName:"Raj Plastics Pvt Ltd",contactPerson:"Rajubhai",mobile:"9876543210",alternateMobile:"",location:"Ahmedabad",address:"Ahmedabad, Gujarat",machineType:"Injection Moulding Machine",machineModel:"SM-120",tonnage:"120 Ton",servoType:"Servo",plc:"Keba",motorHP:"15 HP",screwSize:"45 mm",shotWeight:"250 gm",platenSize:"620 x 620",tieBarDistance:"420 x 420",deliveryDate:todayISO(),status:"Confirmed",priority:"High",specialRequirement:"Fast delivery required.",internalNotes:"Sample demo order.",createdBy:"Admin",createdAt:nowString(),updatedAt:nowString()}
  ];
  saveLocal();
}

async function api(action, payload = {}) {
  if (DEMO_MODE) return demoApi(action, payload);
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action, payload })
  });
  if (!res.ok) throw new Error("API request failed");
  const data = await res.json();
  if (data.ok === false || data.success === false) throw new Error(data.message || "Something went wrong");
  return data;
}

function demoApi(action, payload = {}) {
  if(action === "loginUser"){
    const user = DEMO_USERS.find(u => u.name.toLowerCase() === String(payload.name||"").trim().toLowerCase() && u.pin === String(payload.pin||"").trim());
    if(!user) return {ok:false, message:"Invalid name or PIN"};
    return {ok:true, user:{name:user.name, role:user.role}};
  }
  if(action === "getOrders") return {ok:true, orders:state.orders};
  if(action === "addOrder"){
    const id = `SM-${new Date().getFullYear()}-${String(state.orders.length+1).padStart(3,"0")}`;
    state.orders.unshift({...payload, orderID:id, createdAt:nowString(), updatedAt:nowString()});
    saveLocal(); return {ok:true, orderID:id};
  }
  if(action === "updateOrder"){
    state.orders = state.orders.map(o => o.orderID === payload.orderID ? {...o, ...payload, updatedAt:nowString()} : o);
    saveLocal(); return {ok:true, orderID:payload.orderID};
  }
  if(action === "deleteOrder"){
    state.orders = state.orders.filter(o => o.orderID !== payload.orderID);
    saveLocal(); return {ok:true, orderID:payload.orderID};
  }
  return {ok:false, message:"Invalid demo action: " + action};
}

function normalizeOrder(order) {
  return {
    orderID: order.orderID || order.OrderID || "",
    orderDate: order.orderDate || order.OrderDate || "",
    buyerName: order.buyerName || order.BuyerName || "",
    companyName: order.companyName || order.CompanyName || "",
    contactPerson: order.contactPerson || order.ContactPerson || "",
    mobile: order.mobile || order.Mobile || "",
    alternateMobile: order.alternateMobile || order.AlternateMobile || "",
    location: order.location || order.Location || "",
    address: order.address || order.Address || "",
    machineType: order.machineType || order.MachineType || "",
    machineModel: order.machineModel || order.MachineModel || "",
    tonnage: order.tonnage || order.Tonnage || "",
    servoType: order.servoType || order.ServoType || "",
    plc: order.plc || order.PLC || "",
    motorHP: order.motorHP || order.MotorHP || "",
    screwSize: order.screwSize || order.ScrewSize || "",
    shotWeight: order.shotWeight || order.ShotWeight || "",
    platenSize: order.platenSize || order.PlatenSize || "",
    tieBarDistance: order.tieBarDistance || order.TieBarDistance || "",
    deliveryDate: order.deliveryDate || order.DeliveryDate || "",
    status: order.status || order.Status || "",
    priority: order.priority || order.Priority || "",
    specialRequirement: order.specialRequirement || order.SpecialRequirement || "",
    internalNotes: order.internalNotes || order.InternalNotes || "",
    createdBy: order.createdBy || order.CreatedBy || "",
    createdAt: order.createdAt || order.CreatedAt || "",
    updatedAt: order.updatedAt || order.UpdatedAt || ""
  };
}

async function login() {
  const name = $("loginUser").value;
  const pin = $("loginPin").value.trim();
  if(!name || !pin){ toast("Enter user and PIN"); return; }
  try{
    const data = await api("loginUser", {name, pin});
    state.user = data.user;
    $("loginScreen").classList.remove("active");
    $("mainScreen").classList.add("active");
    $("userMeta").textContent = `${state.user.name} • ${state.user.role}`;
    if(state.user.role === "Admin") {
      document.body.classList.add("is-admin");
      $("adminPanel").style.display = "block";
    } else {
      document.body.classList.remove("is-admin");
      $("adminPanel").style.display = "none";
    }
    await loadOrders();
    toast("Login successful");
  } catch(error){ toast(error.message || "Login failed"); }
}

function logout(){
  state.user = null; state.editingOrderID = null;
  $("loginPin").value = "";
  $("mainScreen").classList.remove("active");
  $("loginScreen").classList.add("active");
  resetForm();
}

async function loadOrders(){
  try{
    if(DEMO_MODE) loadLocal();
    const data = await api("getOrders");
    state.orders = (data.orders || []).map(normalizeOrder);
    renderStats(); renderOrders();
  } catch(error){ toast(error.message || "Could not load orders"); }
}

function getFilteredOrders(){
  const search = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  return state.orders.filter(order => {
    const haystack = [order.orderID,order.buyerName,order.companyName,order.contactPerson,order.mobile,order.alternateMobile,order.location,order.machineType,order.machineModel,order.tonnage,order.status,order.priority].join(" ").toLowerCase();
    return (!search || haystack.includes(search)) && (status === "All" || order.status === status);
  });
}

function renderStats(){
  $("totalOrders").textContent = state.orders.length;
  const currentMonth = new Date().toISOString().slice(0,7);
  $("monthOrders").textContent = state.orders.filter(o => String(o.orderDate||"").startsWith(currentMonth)).length;
  $("machineTypes").textContent = new Set(state.orders.map(o=>o.machineType).filter(Boolean)).size;
}

function renderOrders(){
  const list = $("ordersList");
  const orders = getFilteredOrders();
  if(!orders.length){
    list.innerHTML = `<div class="empty-box"><h3>No orders found</h3><p>Try another search or add a new order.</p></div>`;
    return;
  }
  list.innerHTML = orders.map(order => {
    const adminButtons = state.user && state.user.role === "Admin"
      ? `<button class="ghost-btn" onclick="startEdit('${escapeAttr(order.orderID)}')">Edit</button>
         <button class="danger-btn" onclick="deleteOrder('${escapeAttr(order.orderID)}')">Delete</button>`
      : "";
    return `<article class="order-card">
      <div class="order-head">
        <div><h3>${escapeHTML(order.orderID || "No Order ID")}</h3><h2>${escapeHTML(order.buyerName || "No Buyer Name")}</h2></div>
        <span class="priority ${escapeHTML((order.priority || "Normal").toLowerCase())}">${escapeHTML(order.priority || "Normal")}</span>
      </div>
      <div class="order-info-grid">
        <div><span>Machine</span><strong>${escapeHTML(order.machineType || "-")}</strong></div>
        <div><span>Tonnage</span><strong>${escapeHTML(order.tonnage || "-")}</strong></div>
        <div><span>Mobile</span><strong>${escapeHTML(order.mobile || "-")}</strong></div>
        <div><span>Status</span><strong>${escapeHTML(order.status || "-")}</strong></div>
      </div>
      <div class="card-actions">
        <button class="ghost-btn" onclick="viewOrder('${escapeAttr(order.orderID)}')">View Full Details</button>
        ${adminButtons}
      </div>
    </article>`;
  }).join("");
}

function getFormData(){
  const fd = new FormData($("orderForm"));
  const data = {};
  for(const [key,value] of fd.entries()) data[key] = String(value || "").trim();
  data.createdBy = state.user ? state.user.name : "Admin";
  return data;
}

function fillForm(order){
  const form = $("orderForm");
  Object.keys(order).forEach(key => { if(form.elements[key]) form.elements[key].value = order[key] || ""; });
}

function resetForm(){
  const form = $("orderForm"); if(form) form.reset();
  state.editingOrderID = null;
  $("formTitle").textContent = "Add New Order";
  $("saveOrderBtn").textContent = "Save Order";
  $("cancelEditBtn").classList.add("hidden");
}

async function handleOrderSubmit(event){
  event.preventDefault();
  if(!state.user || state.user.role !== "Admin"){ toast("Only Admin can save orders"); return; }
  const payload = getFormData();
  try{
    if(state.editingOrderID){
      payload.orderID = state.editingOrderID;
      await api("updateOrder", payload);
      toast("Order updated successfully");
    } else {
      await api("addOrder", payload);
      toast("Order added successfully");
    }
    resetForm(); await loadOrders();
  } catch(error){ toast(error.message || "Could not save order"); }
}

function startEdit(orderID){
  if(!state.user || state.user.role !== "Admin"){ toast("Only Admin can edit orders"); return; }
  const order = state.orders.find(item => item.orderID === orderID);
  if(!order){ toast("Order not found"); return; }
  state.editingOrderID = orderID;
  fillForm(order);
  $("formTitle").textContent = `Edit Order: ${orderID}`;
  $("saveOrderBtn").textContent = "Update Order";
  $("cancelEditBtn").classList.remove("hidden");
  window.scrollTo({top:$("adminPanel").offsetTop - 20, behavior:"smooth"});
}

async function deleteOrder(orderID){
  if(!state.user || state.user.role !== "Admin"){ toast("Only Admin can delete orders"); return; }
  const order = state.orders.find(item => item.orderID === orderID);
  if(!order){ toast("Order not found"); return; }
  if(!confirm(`Delete this order permanently?\n\n${order.orderID} - ${order.buyerName}`)) return;
  try{
    await api("deleteOrder", {orderID});
    toast("Order deleted successfully");
    if(state.editingOrderID === orderID) resetForm();
    await loadOrders();
  } catch(error){ toast(error.message || "Could not delete order"); }
}

function viewOrder(orderID){
  const order = state.orders.find(item => item.orderID === orderID);
  if(!order){ toast("Order not found"); return; }
  $("dialogTitle").textContent = `${order.orderID} - ${order.buyerName}`;
  $("orderDetailContent").innerHTML = `<div class="detail-grid">
    ${detailItem("Order ID", order.orderID)}${detailItem("Order Date", order.orderDate)}
    ${detailItem("Buyer Name", order.buyerName)}${detailItem("Company Name", order.companyName)}
    ${detailItem("Contact Person", order.contactPerson)}${detailItem("Mobile", order.mobile)}
    ${detailItem("Alternate Mobile", order.alternateMobile)}${detailItem("Location", order.location)}
    ${detailItem("Address", order.address)}${detailItem("Machine Type", order.machineType)}
    ${detailItem("Machine Model", order.machineModel)}${detailItem("Tonnage", order.tonnage)}
    ${detailItem("Servo Type", order.servoType)}${detailItem("PLC / Controller", order.plc)}
    ${detailItem("Motor HP", order.motorHP)}${detailItem("Screw Size", order.screwSize)}
    ${detailItem("Shot Weight", order.shotWeight)}${detailItem("Platen Size", order.platenSize)}
    ${detailItem("Tie Bar Distance", order.tieBarDistance)}${detailItem("Delivery Date", order.deliveryDate)}
    ${detailItem("Status", order.status)}${detailItem("Priority", order.priority)}
    ${detailItem("Special Requirement", order.specialRequirement)}${detailItem("Internal Notes", order.internalNotes)}
    ${detailItem("Created By", order.createdBy)}${detailItem("Created At", order.createdAt)}
    ${detailItem("Updated At", order.updatedAt)}
  </div>`;
  $("orderDialog").showModal();
}

function detailItem(label,value){ return `<div class="detail-item"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value || "-")}</strong></div>`; }
function escapeHTML(value){ return String(value || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function escapeAttr(value){ return escapeHTML(value).replaceAll("`","&#096;"); }

document.addEventListener("DOMContentLoaded", () => {
  $("loginBtn").addEventListener("click", login);
  $("loginPin").addEventListener("keydown", event => { if(event.key === "Enter") login(); });
  $("logoutBtn").addEventListener("click", logout);
  $("refreshBtn").addEventListener("click", async () => { await loadOrders(); toast("Orders refreshed"); });
  $("searchInput").addEventListener("input", renderOrders);
  $("statusFilter").addEventListener("change", renderOrders);
  $("orderForm").addEventListener("submit", handleOrderSubmit);
  $("cancelEditBtn").addEventListener("click", resetForm);
  $("closeDialog").addEventListener("click", () => $("orderDialog").close());
  if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
  loadLocal();
});
