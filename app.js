/* ==========================================================================
   SUPERMAC INDUSTRIAL ERP ARCHITECTURE BUSINESS LOGIC
   ========================================================================== */

const API_URL = "https://script.google.com/macros/s/AKfycbwLxHkvmpe3Tvg1YkL4uB2JbBNBXDmVf8hpjzudsWtqQ3NYTvFh9Hhclt-EC7SRFIjfZg/exec";
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

function saveLocal(){ if(DEMO_MODE) localStorage.setItem("supermacOrdersV4", JSON.stringify(state.orders)); }
function loadLocal(){
  if(!DEMO_MODE) return;
  const saved = localStorage.getItem("supermacOrdersV4");
  if(saved){ state.orders = JSON.parse(saved); return; }
  state.orders = [
    {
      orderID:"SM-2026-001", orderDate:todayISO(), buyerName:"Raj Plastics", companyName:"Raj Plastics Pvt Ltd",
      contactPerson:"Rajubhai", mobile:"9876543210", alternateMobile:"", location:"Ahmedabad", address:"Ahmedabad, Gujarat",
      machineType:"Toggle Type", machineModel:"SM-125", tonnage:"125 Ton", plc:"Keba", plcModel:"KePlast i1000",
      servoType:"Inovance", servoSize:"15 kW", screwType:"Standard", screwSize:"45 mm", barrelType:"Dia 95 x 30 x 938mm",
      motorHP:"15 HP", pumpType:"Variable Displacement", tieBarDistance:"Std", corePull:"2",
      ejector:"Standard", deliveryDate:todayISO(), status:"Confirmed", priority:"High",
      specialRequirement:"Fast delivery required.", createdBy:"Admin",
      createdAt:nowString(), updatedAt:nowString()
    }
  ];
  saveLocal();
}

async function api(action, payload = {}) {
  if (DEMO_MODE) return demoApi(action, payload);
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action, payload })
  });
  if (!res.ok) throw new Error("API Execution Failure");
  const data = await res.json();
  if (data.ok === false || data.success === false) throw new Error(data.message || "Database engine failure");
  return data;
}

function demoApi(action, payload = {}) {
  if(action === "loginUser"){
    const user = DEMO_USERS.find(u => u.name.toLowerCase() === String(payload.name||"").trim().toLowerCase() && u.pin === String(payload.pin||"").trim());
    if(!user) return {ok:false, message:"Invalid credentials"};
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
  return {ok:false, message:"Invalid action: " + action};
}

function normalizeOrder(o) {
  return {
    orderID: o.orderID || o.OrderID || "",
    orderDate: o.orderDate || o.OrderDate || "",
    buyerName: o.buyerName || o.BuyerName || "",
    companyName: o.companyName || o.CompanyName || "",
    contactPerson: o.contactPerson || o.ContactPerson || "",
    mobile: o.mobile || o.Mobile || "",
    alternateMobile: o.alternateMobile || o.AlternateMobile || "",
    location: o.location || o.Location || "",
    address: o.address || o.Address || "",
    machineType: o.machineType || o.MachineType || "",
    machineModel: o.machineModel || o.MachineModel || "",
    tonnage: o.tonnage || o.Tonnage || "",
    servoType: o.servoType || o.ServoType || "",
    plc: o.plc || o.PLC || "",
    motorHP: o.motorHP || o.MotorHP || "",
    screwSize: o.screwSize || o.ScrewSize || "",
    platenSize: o.platenSize || o.PlatenSize || "",
    tieBarDistance: o.tieBarDistance || o.TieBarDistance || "",
    deliveryDate: o.deliveryDate || o.DeliveryDate || "",
    status: o.status || o.Status || "",
    priority: o.priority || o.Priority || "",
    specialRequirement: o.specialRequirement || o.SpecialRequirement || "",
    internalNotes: o.internalNotes || o.InternalNotes || "",
    createdBy: o.createdBy || o.CreatedBy || "",
    createdAt: o.createdAt || o.CreatedAt || "",
    updatedAt: o.updatedAt || o.UpdatedAt || "",
    
    plcModel: o.plcModel || o.PLCModel || "",
    servoSize: o.servoSize || o.ServoSize || "",
    screwType: o.screwType || o.ScrewType || "",
    barrelType: o.barrelType || o.BarrelType || "",
    pumpType: o.pumpType || o.PumpType || "",
    corePull: o.corePull || o.CorePull || "",
    ejector: o.ejector || o.Ejector || ""
  };
}

async function login() {
  const name = $("loginUser").value;
  const pin = $("loginPin").value.trim();
  if(!name || !pin){ toast("Authentication constraints unfulfilled"); return; }
  try{
    const data = await api("loginUser", {name, pin});
    state.user = data.user;
    $("loginScreen").classList.remove("active");
    $("mainScreen").classList.add("active");
    $("userMeta").textContent = `${state.user.name} (${state.user.role})`;
    
    adjustStatusDropdownOptions();

    if(state.user.role === "Admin") {
      document.body.classList.add("is-admin");
      document.body.classList.remove("is-engineer");
    } else {
      document.body.classList.add("is-engineer");
      document.body.classList.remove("is-admin");
    }
    
    $("loginPin").value = "";
    await loadOrders();
    toast("Session authorized successfully");
  } catch(error){ toast(error.message || "Authentication rejected"); }
}

function adjustStatusDropdownOptions() {
  const statusSelect = $("formStatusField");
  if (!statusSelect) return;
  
  if (state.user && state.user.role === "Engineer") {
    statusSelect.innerHTML = `
      <option value="Ready">Ready</option>
      <option value="Dispatched">Dispatched</option>
    `;
  } else {
    statusSelect.innerHTML = `
      <option value="New Order">New Order</option>
      <option value="Confirmed">Confirmed</option>
      <option value="Pending">Pending</option>
      <option value="Delivered">Delivered</option>
      <option value="Cancelled">Cancelled</option>
      <option value="Ready">Ready</option>
      <option value="Dispatched">Dispatched</option>
    `;
  }
}

function enforceFormReadOnlyState(isReadOnly) {
  const form = $("orderForm");
  if (!form) return;
  
  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach(el => {
    if (el.id === "formStatusField") {
      el.disabled = false;
    } else {
      el.disabled = isReadOnly;
    }
  });
}

function logout(){
  state.user = null; state.editingOrderID = null;
  document.body.classList.remove("is-admin", "is-engineer");
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
  } catch(error){ toast(error.message || "Failed to sync system database logs"); }
}

function getFilteredOrders(){
  const search = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  return state.orders.filter(o => {
    const haystack = [
      o.orderID, o.buyerName, o.companyName, o.mobile, o.location,
      o.machineType, o.machineModel, o.plc, o.servoType, o.priority
    ].join(" ").toLowerCase();
    
    return (!search || haystack.includes(search)) && (status === "All" || o.status === status);
  });
}

function renderStats(){
  $("totalOrders").textContent = state.orders.length;
  $("pendingOrdersCount").textContent = state.orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled" && o.status !== "Dispatched").length;
  const currentMonth = new Date().toISOString().slice(0,7);
  $("monthOrders").textContent = state.orders.filter(o => String(o.orderDate||"").startsWith(currentMonth)).length;
  $("machineTypes").textContent = new Set(state.orders.map(o=>o.machineModel).filter(Boolean)).size;
}

function renderOrders(){
  const list = $("ordersList");
  const orders = getFilteredOrders();
  if(!orders.length){
    list.innerHTML = `<div class="empty-box"><i class="material-icons">find_in_page</i><h3>No records match active filters</h3><p>Adjust system search query arguments.</p></div>`;
    return;
  }
  
  list.innerHTML = orders.map(order => {
    let actionButtons = "";
    
    if (state.user && state.user.role === "Admin") {
      actionButtons = `
        <button class="btn-card-action edit" onclick="startEdit('${escapeAttr(order.orderID)}')"><i class="material-icons">edit</i>Edit</button>
        <button class="btn-card-action delete" onclick="deleteOrder('${escapeAttr(order.orderID)}')"><i class="material-icons">delete</i>Delete</button>
      `;
    } else if (state.user && state.user.role === "Engineer") {
      actionButtons = `
        <button class="btn-card-action edit" onclick="startEdit('${escapeAttr(order.orderID)}')"><i class="material-icons">assignment_turned_in</i>Update Status</button>
      `;
    }
      
    return `<article class="order-card">
      <div>
        <div class="order-card-header">
          <span class="order-uid">${escapeHTML(order.orderID || "UNASSIGNED")}</span>
          <span class="order-priority-tag ${escapeHTML((order.priority || "Normal").toLowerCase())}">${escapeHTML(order.priority || "Normal")}</span>
        </div>
        <h3 class="order-corporate">${escapeHTML(order.companyName || order.buyerName || "No Client Specified")}</h3>
        <div class="order-buyer-line"><i class="material-icons">person</i><span>${escapeHTML(order.buyerName)}</span></div>
        
        <div class="order-spec-preview-box">
          <div class="spec-datapoint"><span>Model Designation</span><strong>${escapeHTML(order.machineModel || "-")}</strong></div>
          <div class="spec-datapoint"><span>Kinematics Type</span><strong>${escapeHTML(order.machineType || "-")}</strong></div>
          <div class="spec-datapoint"><span>Fulfillment Target</span><strong>${escapeHTML(order.deliveryDate || "-")}</strong></div>
          <div class="spec-datapoint"><span>Operations Status</span><strong>${escapeHTML(order.status || "-")}</strong></div>
        </div>
      </div>
      <div class="order-card-actions">
        <button class="btn-card-action view" onclick="viewOrder('${escapeAttr(order.orderID)}')"><i class="material-icons">visibility</i>View</button>
        ${actionButtons}
      </div>
    </article>`;
  }).join("");
}

function getFormData(){
  const form = $("orderForm");
  const data = {};
  
  const disabledElements = form.querySelectorAll("input:disabled, select:disabled, textarea:disabled");
  disabledElements.forEach(el => el.disabled = false);
  
  const fd = new FormData(form);
  for(const [key,value] of fd.entries()) data[key] = String(value || "").trim();
  
  if(state.user && state.user.role === "Engineer") {
    disabledElements.forEach(el => el.disabled = true);
  }
  
  data.createdBy = state.user ? state.user.name : "Admin";
  return data;
}

function fillForm(order){
  const form = $("orderForm");
  Object.keys(order).forEach(key => { if(form.elements[key]) form.elements[key].value = order[key] || ""; });
}

function resetForm(){
  const form = $("orderForm"); 
  if(form) form.reset();
  state.editingOrderID = null;
  enforceFormReadOnlyState(false);
  $("formTitle").textContent = "Order Intake Blueprint Form";
  $("saveOrderBtn").querySelector("span").textContent = "Commit Specs to Ledger";
  $("cancelEditBtn").classList.add("hidden");
  $("adminPanel").classList.remove("force-visible");
}

async function handleOrderSubmit(event){
  event.preventDefault();
  if(!state.user){ toast("Session expired"); return; }
  const payload = getFormData();
  try{
    if(state.editingOrderID){
      payload.orderID = state.editingOrderID;
      await api("updateOrder", payload);
      toast("Order record updated successfully");
    } else {
      if(state.user.role !== "Admin") { toast("Restricted tracking access permissions"); return; }
      await api("addOrder", payload);
      toast("New order logged into corporate ledger");
    }
    resetForm(); 
    await loadOrders();
  } catch(error){ toast(error.message || "Failed to commit record changes"); }
}

function startEdit(orderID){
  if(!state.user){ toast("Please login"); return; }
  const order = state.orders.find(item => item.orderID === orderID);
  if(!order){ toast("Target order record not found"); return; }
  
  state.editingOrderID = orderID;
  
  adjustStatusDropdownOptions();
  fillForm(order);
  
  if (state.user.role === "Engineer") {
    enforceFormReadOnlyState(true);
    $("formTitle").textContent = `Update Logistics Status: ${orderID}`;
    $("saveOrderBtn").querySelector("span").textContent = "Modify Operational Status";
    const statusSelect = $("formStatusField");
    if (order.status !== "Ready" && order.status !== "Dispatched") {
      statusSelect.insertAdjacentHTML('afterbegin', `<option value="${escapeAttr(order.status)}" selected>${escapeHTML(order.status)}</option>`);
    }
  } else {
    enforceFormReadOnlyState(false);
    $("formTitle").textContent = `Refactoring Order Blueprint: ${orderID}`;
    $("saveOrderBtn").querySelector("span").textContent = "Apply Refactored Changes";
  }
  
  $("cancelEditBtn").classList.remove("hidden");
  $("adminPanel").classList.add("force-visible");
  $("adminPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteOrder(orderID){
  if(!state.user || state.user.role !== "Admin"){ toast("Destructive rights restricted"); return; }
  const order = state.orders.find(item => item.orderID === orderID);
  if(!order){ toast("Record absent"); return; }
  if(!confirm(`CRITICAL CRITERIA: Delete order data ledger entry for ${order.orderID} - ${order.buyerName}? This action is immutable.`)) return;
  try{
    await api("deleteOrder", {orderID});
    toast("Data cell entry purged from active server matrix");
    if(state.editingOrderID === orderID) resetForm();
    await loadOrders();
  } catch(error){ toast(error.message || "Purge execution failed"); }
}

function viewOrder(orderID){
  const order = state.orders.find(item => item.orderID === orderID);
  if(!order){ toast("Blueprint lookup failed"); return; }
  $("dialogOrderNum").textContent = order.orderID;
  $("dialogTitle").textContent = `Architecture Specification Sheet: ${order.buyerName}`;
  
  $("orderDetailContent").innerHTML = `
    <div class="dialog-blueprint-group">
      <div class="group-title"><i class="material-icons">business</i> Customer Information Matrix</div>
      <div class="dialog-data-grid">
        ${detailItem("Intake Date", order.orderDate)}
        ${detailItem("Buyer Identity", order.buyerName)}
        ${detailItem("Corporate Registry", order.companyName)}
        ${detailItem("Contact Liaison", order.contactPerson)}
        ${detailItem("Primary Mobile", order.mobile)}
        ${detailItem("Alternate Mobile", order.alternateMobile)}
        ${detailItem("Deployment City", order.location)}
        <div class="dialog-item" style="grid-column: 1/-1;"><span>Factory Execution Physical Address</span><strong>${escapeHTML(order.address || "-")}</strong></div>
      </div>
    </div>
    
    <div class="dialog-blueprint-group">
      <div class="group-title"><i class="material-icons">precision_manufacturing</i> Mechanical Frame Architecture</div>
      <div class="dialog-data-grid">
        ${detailItem("Kinematics Framework", order.machineType)}
        ${detailItem("Model Variant", order.machineModel)}
        ${detailItem("Tonnage Capacity Rating", order.tonnage)}
      </div>
    </div>
    
    <div class="dialog-blueprint-group">
      <div class="group-title"><i class="material-icons">developer_board</i> Automation Processing (PLC)</div>
      <div class="dialog-data-grid">
        ${detailItem("Ecosystem Controller Brand", order.plc)}
        ${detailItem("Hardware Controller Model", order.plcModel)}
      </div>
    </div>
    
    <div class="dialog-blueprint-group">
      <div class="group-title"><i class="material-icons">bolt</i> Servo Powertrain Parameters</div>
      <div class="dialog-data-grid">
        ${detailItem("Servo Inverter Make", order.servoType)}
        ${detailItem("System Dimension / Rating", order.servoSize)}
      </div>
    </div>
    
    <div class="dialog-blueprint-group">
      <div class="group-title"><i class="material-icons">reorder</i> Extrusion Screw & Barrel Assembly</div>
      <div class="dialog-data-grid">
        ${detailItem("Screw Geometry Configuration", order.screwType)}
        ${detailItem("Screw Diameter Specification", order.screwSize)}
        ${detailItem("Barrel Size Configuration", order.barrelType)}
      </div>
    </div>
    
    <div class="dialog-blueprint-group">
      <div class="group-title"><i class="material-icons">water</i> Fluid Power & Hydraulics Matrix</div>
      <div class="dialog-data-grid">
        ${detailItem("Hydro Motor Size", order.motorHP)}
        ${detailItem("Displacement Pump Topology", order.pumpType)}
      </div>
    </div>
    
    <div class="dialog-blueprint-group">
      <div class="group-title"><i class="material-icons">tune</i> Auxiliary Configuration Matrix</div>
      <div class="dialog-data-grid">
        ${detailItem("Tie Bar Distance Sizing", order.tieBarDistance)}
        ${detailItem("Core Pull Valve Circuits", order.corePull)}
        ${detailItem("Ejector System Mechanics", order.ejector)}
        ${detailItem("Platen Outer Footprint Dimension", order.platenSize)}
      </div>
    </div>
    
    <div class="dialog-blueprint-group">
      <div class="group-title"><i class="material-icons">local_shipping</i> Fulfillment Operations Metrics</div>
      <div class="dialog-data-grid">
        ${detailItem("Contractual Delivery Schedule", order.deliveryDate)}
        ${detailItem("Operations Status", order.status)}
        ${detailItem("Production Allocation Priority", order.priority)}
        ${detailItem("Data Created Operator", order.createdBy)}
        ${detailItem("Ledger Initialization timestamp", order.createdAt)}
        ${detailItem("Ledger Synchronized Mutation timestamp", order.updatedAt)}
      </div>
    </div>
    
    <div class="dialog-blueprint-group">
      <div class="group-title"><i class="material-icons">comment</i> Engineering Special Instructions (Remarks)</div>
      <p style="font-size: 14px; line-height: 1.6; color: var(--text-primary-navy); white-space: pre-wrap;">${escapeHTML(order.specialRequirement || "No tailored requirements specified for this production run.")}</p>
    </div>
  `;
  $("orderDialog").showModal();
}

function detailItem(label,value){ return `<div class="dialog-item"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value || "-")}</strong></div>`; }
function escapeHTML(v){ return String(v || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function escapeAttr(v){ return escapeHTML(v).replaceAll("`","&#096;"); }

function handleNavigationUpdates(hash) {
  const links = document.querySelectorAll(".nav-item");
  links.forEach(link => {
    if(link.getAttribute("href") === hash) link.classList.add("active");
    else link.classList.remove("active");
  });
  
  let breadcrumbName = "Dashboard";
  if(hash === "#search-anchor") breadcrumbName = "Order Ledger View";
  if(hash === "#adminPanel") breadcrumbName = "Order Intake System";
  $("currentBreadcrumb").textContent = breadcrumbName;
}

document.addEventListener("DOMContentLoaded", () => {
  $("loginBtn").addEventListener("click", login);
  $("loginPin").addEventListener("keydown", e => { if(e.key === "Enter") login(); });
  $("logoutBtn").addEventListener("click", logout);
  $("refreshBtn").addEventListener("click", async () => { await loadOrders(); toast("Ledger datasets synchronized"); });
  $("searchInput").addEventListener("input", renderOrders);
  $("statusFilter").addEventListener("change", renderOrders);
  $("orderForm").addEventListener("submit", handleOrderSubmit);
  $("cancelEditBtn").addEventListener("click", resetForm);
  $("closeDialog").addEventListener("click", () => $("orderDialog").close());
  
  $("floatingAddBtn").addEventListener("click", () => {
    resetForm();
    $("adminPanel").classList.add("force-visible");
    $("adminPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    handleNavigationUpdates("#adminPanel");
  });

  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      const targetHash = item.getAttribute("href");
      handleNavigationUpdates(targetHash);
    });
  });

  if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
  loadLocal();
});