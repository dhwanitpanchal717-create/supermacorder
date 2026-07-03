/***************
 * Supermac Orders API V3 Complete
 * Google Sheets Backend for PWA
 * Supports: loginUser, getOrders, addOrder, updateOrder, deleteOrder
 ***************/

// Replace this with your Google Sheet ID.
// Sheet URL example: https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
const SHEET_ID = "16DY7hqNKODztzQw9BiFPLRpwjUfI7oAVJay9KRKn_gY";

const SHEET_USERS = "Users";
const SHEET_ORDERS = "Orders";

function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === "test") {
      return json({
        ok: true,
        success: true,
        message: "Supermac Orders API V3 connected successfully"
      });
    }

    if (action === "getOrders") {
      return json({ ok: true, orders: getOrders() });
    }

    return json({ ok: false, message: "Invalid GET action: " + action });
  } catch (err) {
    return json({ ok: false, message: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const action = body.action;
    const payload = body.payload || {};

    if (action === "loginUser") return json(loginUser(payload));
    if (action === "getOrders") return json({ ok: true, orders: getOrders() });
    if (action === "addOrder") return json(addOrder(payload));
    if (action === "updateOrder") return json(updateOrder(payload));
    if (action === "deleteOrder") return json(deleteOrder(payload));

    return json({ ok: false, message: "Invalid POST action: " + action });
  } catch (err) {
    return json({ ok: false, message: err.message });
  }
}

function loginUser(payload) {
  const name = String(payload.name || "").trim();
  const pin = String(payload.pin || "").trim();

  const users = rowsAsObjects(SHEET_USERS);

  const user = users.find(u =>
    String(u.Name || "").trim().toLowerCase() === name.toLowerCase() &&
    String(u.PIN || "").trim() === pin
  );

  if (!user) return { ok: false, message: "Invalid name or PIN" };

  return {
    ok: true,
    user: {
      name: user.Name,
      role: user.Role
    }
  };
}

function getOrders() {
  return rowsAsObjects(SHEET_ORDERS)
    .map(r => ({
      orderID: r.OrderID,
      orderDate: r.OrderDate,
      buyerName: r.BuyerName,
      companyName: r.CompanyName,
      contactPerson: r.ContactPerson,
      mobile: r.Mobile,
      alternateMobile: r.AlternateMobile,
      location: r.Location,
      address: r.Address,
      machineType: r.MachineType,
      machineModel: r.MachineModel,
      tonnage: r.Tonnage,
      servoType: r.ServoType,
      plc: r.PLC,
      motorHP: r.MotorHP,
      screwSize: r.ScrewSize,
      shotWeight: r.ShotWeight,
      platenSize: r.PlatenSize,
      tieBarDistance: r.TieBarDistance,
      deliveryDate: r.DeliveryDate,
      status: r.Status,
      priority: r.Priority,
      specialRequirement: r.SpecialRequirement,
      internalNotes: r.InternalNotes,
      createdBy: r.CreatedBy,
      createdAt: r.CreatedAt,
      updatedAt: r.UpdatedAt
    }))
    .reverse();
}

function addOrder(payload) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) throw new Error("Orders sheet missing");

  const next = sheet.getLastRow();
  const id = "SM-" + new Date().getFullYear() + "-" + String(next).padStart(3, "0");
  const now = formatDateTime(new Date());
  const today = formatDate(new Date());

  sheet.appendRow([
    id,
    payload.orderDate || today,
    payload.buyerName || "",
    payload.companyName || "",
    payload.contactPerson || "",
    payload.mobile || "",
    payload.alternateMobile || "",
    payload.location || "",
    payload.address || "",
    payload.machineType || "Injection Moulding Machine",
    payload.machineModel || "",
    payload.tonnage || "",
    payload.servoType || "",
    payload.plc || "",
    payload.motorHP || "",
    payload.screwSize || "",
    payload.shotWeight || "",
    payload.platenSize || "",
    payload.tieBarDistance || "",
    payload.deliveryDate || "",
    payload.status || "New Order",
    payload.priority || "Normal",
    payload.specialRequirement || "",
    payload.internalNotes || "",
    payload.createdBy || "Admin",
    now,
    now
  ]);

  return { ok: true, message: "Order added successfully", orderID: id };
}

function updateOrder(payload) {
  const orderID = String(payload.orderID || "").trim();
  if (!orderID) return { ok: false, message: "Order ID missing" };

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) throw new Error("Orders sheet missing");

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || "").trim() === orderID) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return { ok: false, message: "Order not found: " + orderID };

  const existingRow = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  const existing = {};
  headers.forEach((h, i) => existing[h] = existingRow[i]);

  const now = formatDateTime(new Date());

  const updated = {
    OrderID: orderID,
    OrderDate: payload.orderDate || existing.OrderDate || "",
    BuyerName: payload.buyerName || "",
    CompanyName: payload.companyName || "",
    ContactPerson: payload.contactPerson || "",
    Mobile: payload.mobile || "",
    AlternateMobile: payload.alternateMobile || "",
    Location: payload.location || "",
    Address: payload.address || "",
    MachineType: payload.machineType || "",
    MachineModel: payload.machineModel || "",
    Tonnage: payload.tonnage || "",
    ServoType: payload.servoType || "",
    PLC: payload.plc || "",
    MotorHP: payload.motorHP || "",
    ScrewSize: payload.screwSize || "",
    ShotWeight: payload.shotWeight || "",
    PlatenSize: payload.platenSize || "",
    TieBarDistance: payload.tieBarDistance || "",
    DeliveryDate: payload.deliveryDate || "",
    Status: payload.status || "",
    Priority: payload.priority || "",
    SpecialRequirement: payload.specialRequirement || "",
    InternalNotes: payload.internalNotes || "",
    CreatedBy: existing.CreatedBy || payload.createdBy || "Admin",
    CreatedAt: existing.CreatedAt || now,
    UpdatedAt: now
  };

  const newRow = headers.map(header => updated[header] || "");
  sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);

  return { ok: true, message: "Order updated successfully", orderID: orderID };
}

function deleteOrder(payload) {
  const orderID = String(payload.orderID || payload.OrderID || "").trim();
  if (!orderID) return { ok: false, message: "Order ID missing" };

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) throw new Error("Orders sheet missing");

  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || "").trim() === orderID) {
      sheet.deleteRow(i + 1);
      return { ok: true, message: "Order deleted successfully", orderID: orderID };
    }
  }

  return { ok: false, message: "Order not found: " + orderID };
}

function rowsAsObjects(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(sheetName + " sheet missing");

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h).trim());

  return values
    .slice(1)
    .filter(row => row.some(v => v !== ""))
    .map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        const value = row[index];
        if (value instanceof Date) {
          obj[header] = formatDate(value);
        } else {
          obj[header] = String(value || "");
        }
      });
      return obj;
    });
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function formatDateTime(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}
