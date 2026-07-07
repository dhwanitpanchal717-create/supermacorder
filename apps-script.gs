/***************
 * SUPERMAC ORDERS API V4 INDUSTRIAL EXECUTION LEDGER
 * Google Sheets Backend Serverless Micro-Engine for PWAs
 * Full parameter safety and structural preservation.
 ***************/

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
        message: "Supermac Orders API Engine V4 integrated successfully."
      });
    }

    if (action === "getOrders") {
      return json({ ok: true, orders: getOrders() });
    }

    return json({ ok: false, message: "Invalid system validation GET action: " + action });
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

    return json({ ok: false, message: "Malformed pipeline transaction execution request: " + action });
  } catch (err) {
    return json({ ok: false, message: err.message });
  }
}

function loginUser(payload) {
  const name = String(payload.name || "").trim().toLowerCase();
  const pin = String(payload.pin || "").trim();

  SpreadsheetApp.flush();
  const users = rowsAsObjects(SHEET_USERS);

  const user = users.find(u => {
    const sheetName = String(u.Name || u.name || "").trim().toLowerCase();
    const sheetPin = String(u.PIN || u.Pin || u.pin || "").trim();
    return sheetName === name && sheetPin === pin;
  });

  if (!user) return { ok: false, message: "Authentication validation mismatch. Check your Name or PIN formatting." };

  return {
    ok: true,
    user: {
      name: user.Name || user.name,
      role: user.Role || user.role
    }
  };
}

function getOrders() {
  return rowsAsObjects(SHEET_ORDERS).map(r => ({
    orderID: r.OrderID || r.orderID || "",
    orderDate: r.OrderDate || r.orderDate || "",
    buyerName: r.BuyerName || r.buyerName || "",
    companyName: r.CompanyName || r.companyName || "",
    contactPerson: r.ContactPerson || r.contactPerson || "",
    mobile: r.Mobile || r.mobile || "",
    alternateMobile: r.AlternateMobile || r.alternateMobile || "",
    location: r.Location || r.location || "",
    address: r.Address || r.address || "",
    machineType: r.MachineType || r.machineType || "",
    machineModel: r.MachineModel || r.machineModel || "",
    tonnage: r.Tonnage || r.tonnage || "",
    servoType: r.ServoType || r.servoType || "",
    plc: r.PLC || r.plc || "",
    motorHP: r.MotorHP || r.motorHP || "",
    screwSize: r.ScrewSize || r.screwSize || "",
    shotWeight: r.ShotWeight || r.shotWeight || "",
    platenSize: r.PlatenSize || r.platenSize || "",
    tieBarDistance: r.TieBarDistance || r.tieBarDistance || "",
    deliveryDate: r.DeliveryDate || r.deliveryDate || "",
    status: r.Status || r.status || "",
    priority: r.Priority || r.priority || "",
    specialRequirement: r.SpecialRequirement || r.specialRequirement || "",
    internalNotes: r.InternalNotes || r.internalNotes || "",
    createdBy: r.CreatedBy || r.createdBy || "",
    createdAt: r.CreatedAt || r.createdAt || "",
    updatedAt: r.UpdatedAt || r.updatedAt || "",

    plcModel: r.PLCModel || r.plcModel || "",
    servoSize: r.ServoSize || r.servoSize || "",
    screwType: r.ScrewType || r.screwType || "",
    barrelType: r.BarrelType || r.barrelType || "",
    pumpType: r.PumpType || r.pumpType || "",
    corePull: r.CorePull || r.corePull || ""
  })).reverse();
}

function addOrder(payload) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) throw new Error("Orders worksheet instance inaccessible");

  ensureV4Headers(sheet);

  const next = sheet.getLastRow();
  const id = "SM-" + new Date().getFullYear() + "-" + String(next).padStart(3, "0");
  const now = formatDateTime(new Date());
  const today = formatDate(new Date());

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());

  const newRowData = {
    "OrderID": id,
    "OrderDate": payload.orderDate || today,
    "BuyerName": payload.buyerName || "",
    "CompanyName": payload.companyName || "",
    "ContactPerson": payload.contactPerson || "",
    "Mobile": payload.mobile || "",
    "AlternateMobile": payload.alternateMobile || "",
    "Location": payload.location || "",
    "Address": payload.address || "",
    "MachineType": payload.machineType || "",
    "MachineModel": payload.machineModel || "",
    "Tonnage": payload.tonnage || "",
    "ServoType": payload.servoType || "",
    "PLC": payload.plc || "",
    "MotorHP": payload.motorHP || "",
    "ScrewSize": payload.screwSize || "",
    "ShotWeight": payload.shotWeight || "",
    "PlatenSize": payload.platenSize || "",
    "TieBarDistance": payload.tieBarDistance || "",
    "DeliveryDate": payload.deliveryDate || "",
    "Status": payload.status || "New Order",
    "Priority": payload.priority || "Normal",
    "SpecialRequirement": payload.specialRequirement || "",
    "InternalNotes": payload.internalNotes || "",
    "CreatedBy": payload.createdBy || "Admin",
    "CreatedAt": now,
    "UpdatedAt": now,
    
    "PLCModel": payload.plcModel || "",
    "ServoSize": payload.servoSize || "",
    "ScrewType": payload.screwType || "",
    "BarrelType": payload.barrelType || "",
    "PumpType": payload.pumpType || "",
    "CorePull": payload.corePull || ""
  };

  const rowToAppend = headers.map(header => newRowData[header] !== undefined ? newRowData[header] : "");
  sheet.appendRow(rowToAppend);
  SpreadsheetApp.flush();

  return { ok: true, message: "Order processed into ledger matrix", orderID: id };
}

function updateOrder(payload) {
  const orderID = String(payload.orderID || "").trim();
  if (!orderID) return { ok: false, message: "Missing Order Identification Payload Key" };

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) throw new Error("Orders worksheet instance inaccessible");

  ensureV4Headers(sheet);

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || "").trim() === orderID) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return { ok: false, message: "Target system context missing order entry: " + orderID };

  const existingRow = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  const existing = {};
  headers.forEach((h, i) => existing[h] = existingRow[i]);

  const now = formatDateTime(new Date());

  const updatedData = {
    "OrderID": orderID,
    "OrderDate": payload.orderDate || existing.OrderDate || "",
    "BuyerName": payload.buyerName || "",
    "CompanyName": payload.companyName || "",
    "ContactPerson": payload.contactPerson || "",
    "Mobile": payload.mobile || "",
    "AlternateMobile": payload.alternateMobile || "",
    "Location": payload.location || "",
    "Address": payload.address || "",
    "MachineType": payload.machineType || "",
    "MachineModel": payload.machineModel || "",
    "Tonnage": payload.tonnage || "",
    "ServoType": payload.servoType || "",
    "PLC": payload.plc || "",
    "MotorHP": payload.motorHP || "",
    "ScrewSize": payload.screwSize || "",
    "ShotWeight": payload.shotWeight || "",
    "PlatenSize": payload.platenSize || "",
    "TieBarDistance": payload.tieBarDistance || "",
    "DeliveryDate": payload.deliveryDate || "",
    "Status": payload.status || "",
    "Priority": payload.priority || "",
    "SpecialRequirement": payload.specialRequirement || "",
    "InternalNotes": payload.internalNotes || "",
    "CreatedBy": existing.CreatedBy || payload.createdBy || "Admin",
    "CreatedAt": existing.CreatedAt || now,
    "UpdatedAt": now,
    
    "PLCModel": payload.plcModel !== undefined ? payload.plcModel : (existing.PLCModel || ""),
    "ServoSize": payload.servoSize !== undefined ? payload.servoSize : (existing.ServoSize || ""),
    "ScrewType": payload.screwType !== undefined ? payload.screwType : (existing.ScrewType || ""),
    "BarrelType": payload.barrelType !== undefined ? payload.barrelType : (existing.BarrelType || ""),
    "PumpType": payload.pumpType !== undefined ? payload.pumpType : (existing.PumpType || ""),
    "CorePull": payload.corePull !== undefined ? payload.corePull : (existing.CorePull || "")
  };

  const finalRowArray = headers.map(header => updatedData[header] !== undefined ? updatedData[header] : "");
  sheet.getRange(rowIndex, 1, 1, finalRowArray.length).setValues([finalRowArray]);
  SpreadsheetApp.flush();

  return { ok: true, message: "Order records mutated safely inside system database rows", orderID: orderID };
}

function deleteOrder(payload) {
  const orderID = String(payload.orderID || payload.OrderID || "").trim();
  if (!orderID) return { ok: false, message: "Missing Order Identification Payload Key" };

  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) throw new Error("Orders sheet missing instance allocation");

  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || "").trim() === orderID) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return { ok: true, message: "Record index successfully disconnected from core spreadsheet structural grid", orderID: orderID };
    }
  }

  return { ok: false, message: "Target system context missing order index: " + orderID };
}

function ensureV4Headers(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  
  const targetV4Additions = ["PLCModel", "ServoSize", "ScrewType", "BarrelType", "PumpType", "CorePull"];
  let appended = false;
  
  targetV4Additions.forEach(headerTitle => {
    if (headers.indexOf(headerTitle) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(headerTitle);
      appended = true;
    }
  });
  
  if (appended) {
    SpreadsheetApp.flush();
  }
}

function rowsAsObjects(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(sheetName + " sub-ledger grid block sheet instance missing");

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
          obj[header] = String(value === null || value === undefined ? "" : value).trim();
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