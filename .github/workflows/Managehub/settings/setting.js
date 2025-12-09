/* ============================================================
   LOAD SAVED SETTINGS
============================================================ */
let settings = JSON.parse(localStorage.getItem("settings") || "{}");

function loadSettings() {
  // Account
  document.getElementById("displayName").value = settings.displayName || "";
  document.getElementById("email").value = settings.email || "";

  // Appearance
  document.getElementById("themeSelect").value = settings.theme || "light";
  document.getElementById("accentColor").value = settings.accentColor || "#3b82f6";

  applyTheme(settings.theme || "light");
  applyAccent(settings.accentColor || "#3b82f6");

  // Notifications
  document.getElementById("emailAlerts").checked = settings.emailAlerts || false;
  document.getElementById("inventoryAlerts").checked = settings.inventoryAlerts || false;
  document.getElementById("shiftAlerts").checked = settings.shiftAlerts || false;
}

loadSettings();



/* ============================================================
   SAVE ACCOUNT SETTINGS
============================================================ */
document.querySelectorAll(".save-btn")[0].onclick = () => {
  settings.displayName = document.getElementById("displayName").value.trim();
  settings.email = document.getElementById("email").value.trim();

  saveSettings();
};



/* ============================================================
   SAVE APPEARANCE SETTINGS
============================================================ */
document.querySelectorAll(".save-btn")[1].onclick = () => {
  const theme = document.getElementById("themeSelect").value;
  const accent = document.getElementById("accentColor").value;

  settings.theme = theme;
  settings.accentColor = accent;

  applyTheme(theme);
  applyAccent(accent);

  saveSettings();
};

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.style.background = "#1f2937";
    document.body.style.color = "#f3f4f6";
  } else {
    document.body.style.background = "#f4f6f8";
    document.body.style.color = "#333";
  }
}

function applyAccent(color) {
  document.documentElement.style.setProperty("--accent", color);
}



/* ============================================================
   SAVE NOTIFICATION SETTINGS
============================================================ */
document.querySelectorAll(".save-btn")[2].onclick = () => {
  settings.emailAlerts = document.getElementById("emailAlerts").checked;
  settings.inventoryAlerts = document.getElementById("inventoryAlerts").checked;
  settings.shiftAlerts = document.getElementById("shiftAlerts").checked;

  saveSettings();
};



/* ============================================================
   EXPORT ALL DATA
============================================================ */
document.querySelector(".export-btn").onclick = () => {
  const allData = {
    settings,
    employees: JSON.parse(localStorage.getItem("employees") || "[]"),
    inventory: JSON.parse(localStorage.getItem("inventory") || "[]"),
    calendarEntries: JSON.parse(localStorage.getItem("calendarEntries") || "{}"),
    tasktie: JSON.parse(localStorage.getItem("tasktie") || "[]")
  };

  const blob = new Blob([JSON.stringify(allData, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "angled-analytics-backup.json";
  a.click();
};



/* ============================================================
   IMPORT DATA
============================================================ */
document.getElementById("importData").onchange = e => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = event => {
    try {
      const data = JSON.parse(event.target.result);

      if (data.settings) localStorage.setItem("settings", JSON.stringify(data.settings));
      if (data.employees) localStorage.setItem("employees", JSON.stringify(data.employees));
      if (data.inventory) localStorage.setItem("inventory", JSON.stringify(data.inventory));
      if (data.calendarEntries) localStorage.setItem("calendarEntries", JSON.stringify(data.calendarEntries));
      if (data.tasktie) localStorage.setItem("tasktie", JSON.stringify(data.tasktie));

      alert("Data imported successfully.");
      location.reload();
    } catch {
      alert("Invalid JSON file.");
    }
  };

  reader.readAsText(file);
};



/* ============================================================
   RESET APPLICATION
============================================================ */
document.getElementById("resetSystem").onclick = () => {
  if (!confirm("Are you sure you want to reset the entire application?")) return;

  localStorage.clear();
  alert("Application reset. Reloading...");
  location.reload();
};



/* ============================================================
   SAVE SETTINGS TO LOCALSTORAGE
============================================================ */
function saveSettings() {
  localStorage.setItem("settings", JSON.stringify(settings));
  alert("Settings saved.");
}
