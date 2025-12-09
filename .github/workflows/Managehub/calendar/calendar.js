// Function to fetch the current user's company ID
async function getUserCompanyId(client) {
    const user = await client.auth.getUser();
    if (!user.data.user) return null;

    const { data, error } = await client
        .from('employees')
        .select('company_id')
        .eq('user_id', user.data.user.id)
        .single();
        
    if (error || !data) {
        console.error("Could not determine user's company ID:", error);
        return null;
    }
    return data.company_id;
}

document.addEventListener("DOMContentLoaded", () => {

  // Ensure supabaseClient is available globally (from supabase-init.js)
  const supabaseClient = window.supabaseClient;
  if (!supabaseClient) {
    console.error("Supabase client is not initialized.");
    return;
  }

  // --- GLOBAL STATE & DOM ELEMENTS ---
  let employees = [];
  let calendarEntries = [];
  let currentDate = new Date(); 
  let currentEntryId = null; // State variable: holds ID of the entry being edited (null when creating)

  const shiftEmployee  = document.getElementById("shiftEmployee");
  const entryType      = document.getElementById("entryType");
  const calendarGrid   = document.getElementById("calendarGrid");
  const monthLabel     = document.getElementById("monthLabel");
  const prevMonthBtn   = document.getElementById("prevMonth");
  const nextMonthBtn   = document.getElementById("nextMonth");
  const modal          = document.getElementById("modal");
  const eventsModal    = document.getElementById("dayEventsModal");
  const closeModalBtn  = document.getElementById("closeModal");
  const closeEventsBtn = document.getElementById("closeEventsBtn");
  const addFromEventsBtn = document.getElementById("addFromEventsBtn");
  const entryTitleInput = document.getElementById("entryTitle");
  const saveBtn = document.getElementById("saveEntry");


  // --- HELPER FUNCTIONS ---

  function resetModalState() {
    currentEntryId = null;
    saveBtn.textContent = "Save";
    entryTitleInput.value = '';
    shiftEmployee.value = '';
    entryType.value = 'event';
    entryType.dispatchEvent(new Event('change')); 
  }

  function openModal(date) {
    resetModalState();
    document.getElementById("modalDate").textContent = date;
    modal.style.display = 'flex'; 
  }

  function closeModal() {
    modal.style.display = 'none';
  }

  function closeEventsModal() {
    eventsModal.style.display = 'none';
  }

  function getEmployeeColor(id) {
    const emp = employees.find(e => String(e.id) === String(id));
    return emp ? emp.color : '#6C757D'; // Default gray
  }

  // Helper to determine text contrast for color-coded options
  function isLight(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }

  /* OPEN MODAL FOR EDITING */
  function openEditModal(entryId, date, type, title, employeeId) {
    currentEntryId = entryId; 
    
    document.getElementById("modalDate").textContent = date;
    document.getElementById("entryType").value = type;
    document.getElementById("entryTitle").value = title || '';
    document.getElementById("shiftEmployee").value = employeeId || '';
    
    // Trigger change to set visibility of employee dropdown
    entryType.dispatchEvent(new Event('change')); 

    document.getElementById("saveEntry").textContent = "Update";

    modal.style.display = 'flex';
  }

  // --- CALENDAR RENDERING ---

  function renderDayLabels() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const labelsHtml = days.map(day => `<div class="day-label">${day}</div>`).join('');
    calendarGrid.innerHTML = labelsHtml;
  }

  function renderCalendar() {
    calendarGrid.innerHTML = ''; 
    renderDayLabels();
    
    monthLabel.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay(); 
    const daysInMonth = lastDayOfMonth.getDate();

    // 1. Render empty cells
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarGrid.insertAdjacentHTML('beforeend', `<div class="calendar-cell empty"></div>`);
    }

    // 2. Render actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toDateString(); 
      const isToday = date.toDateString() === new Date().toDateString() ? 'today' : '';
      
      const dayEntries = calendarEntries.filter(e => e.entry_date === dateString);
      
      let entriesHtml = dayEntries.map(entry => {
        // Use assigned_employee alias from the fetch function
        const entryColor = entry.assigned_employee?.color || entry.color || getEmployeeColor(entry.employee_id) || '#6C757D';
        return `<div class="entry" style="--entry-bg: ${entryColor};" data-type="${entry.type}" data-title="${entry.title}">${entry.title}</div>`;
      }).join('');
      
      const dayCellHtml = `
        <div class="calendar-cell ${isToday}" data-date="${dateString}">
          <div class="day-number">${day}</div>
          ${entriesHtml}
        </div>
      `;
      calendarGrid.insertAdjacentHTML('beforeend', dayCellHtml);
    }
    
    // 3. Attach click handlers
    document.querySelectorAll('.calendar-cell:not(.empty)').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const date = e.currentTarget.getAttribute('data-date');
        handleDayClick(date);
      });
    });
  }

  function handleDayClick(dateString) {
      const dayEntries = calendarEntries.filter(e => e.entry_date === dateString);
      const list = document.getElementById("eventsList");
      
      // Reset state on click
      resetModalState();

      if (dayEntries.length > 0) {
          document.getElementById("eventsModalDate").textContent = dateString;
          list.innerHTML = '';

          dayEntries.forEach(entry => {
              const entryColor = entry.assigned_employee?.color || entry.color || getEmployeeColor(entry.employee_id) || '#6C757D';
              
              // ENTRY ITEM WITH ACTION BUTTONS
              const entryDiv = document.createElement('div');
              entryDiv.style.marginBottom = '10px';
              entryDiv.innerHTML = `
                  <div class="entry" style="--entry-bg: ${entryColor}; padding: 6px;">
                      ${entry.title} (${entry.type})
                  </div>
                  <div class="entry-actions" style="display:flex; gap:5px; margin-top:3px;">
                      <button class="btn-edit-entry dash-btn" data-id="${entry.id}">Edit</button>
                      <button class="btn-delete-entry dash-btn cancel-btn" data-id="${entry.id}">Delete</button>
                  </div>
              `;
              list.appendChild(entryDiv);
          });

          eventsModal.setAttribute('data-date', dateString);
          eventsModal.style.display = 'flex';
          
          // Attach listeners for newly created Edit/Delete buttons
          list.querySelectorAll('.btn-delete-entry').forEach(btn => {
              btn.addEventListener('click', async () => {
                  const entryId = btn.getAttribute('data-id');
                  if (await deleteEntry(entryId)) {
                      closeEventsModal();
                  }
              });
          });
          
          list.querySelectorAll('.btn-edit-entry').forEach(btn => {
              btn.addEventListener('click', () => {
                  const entryId = btn.getAttribute('data-id');
                  const entry = calendarEntries.find(e => String(e.id) === entryId);

                  if (entry) {
                      closeEventsModal();
                      openEditModal(
                          entry.id, 
                          entry.entry_date, 
                          entry.type, 
                          entry.title, 
                          entry.employee_id 
                      );
                  }
              });
          });

      } else {
          // No events, open Add Entry Modal directly
          openModal(dateString);
      }
  }


  // --- CRUD AND DATA FETCHING ---

  /* DELETE ENTRY */
  async function deleteEntry(entryId) {
      if (!confirm("Are you sure you want to delete this calendar entry?")) {
          return false;
      }

      const { error } = await supabaseClient
          .from("calendar")
          .delete()
          .eq("id", entryId);

      if (error) {
          console.error("Deletion Error:", error);
          alert("Error deleting entry: " + error.message);
          return false;
      }

      await loadCalendarEntries();
      return true;
  }


  /* LOAD EMPLOYEES */
  async function loadEmployeesFromSupabase() {
    try {
      const { data, error } = await supabaseClient
        .from("employees")
        .select("id, name, shift, color")
        .eq("active", true)
        .order("name");

      if (error) throw error;

      employees = data;
      populateEmployees();

    } catch (err) {
      console.error("Employee load failed:", err.message);
    }
  }

  /* LOAD CALENDAR ENTRIES */
  async function loadCalendarEntries() {
    try {
      // Use assigned_employee alias to resolve foreign key ambiguity
      const { data, error } = await supabaseClient
        .from("calendar")
        .select(`
          *, 
          assigned_employee:employee_id (name, color)
        `);

      if (error) throw error;
      
      calendarEntries = data.map(entry => ({
          ...entry,
          // Ensure title is handled correctly
          title: entry.title || `${entry.assigned_employee?.name || 'Unknown'} Shift`,
          employee_id: entry.employee_id || null // Ensure ID is accessible
      }));
      
      renderCalendar(); 

    } catch (err) {
      console.error("Calendar load failed:", err.message);
    }
  }


  /* SAVE / UPDATE CALENDAR ENTRY */
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {

        const date = document.getElementById("modalDate").textContent;
        const type = entryType.value;
        const entryTitle = entryTitleInput.value.trim();

        if (type !== "shift" && !entryTitle) {
            return alert("Please enter a title for this Event or Task.");
        }
        
        // 🛑 FIX 1: Fetch company ID before saving (required by RLS)
        const companyId = await getUserCompanyId(supabaseClient);
        if (!companyId) {
            return alert("Error: User company ID not found. Cannot save entry.");
        }
        
        let entry = { 
            entry_date: date, 
            type, 
            title: entryTitle || null,
            company_id: companyId // 🛑 FIX 2: Inject the company ID into the base entry payload
        };
        
        // Handle shift-specific fields (employee_id, shift, color)
        if (type === "shift") {
            if (!shiftEmployee.value) return alert("Select an employee");

            const emp = employees.find(e => String(e.id) === String(shiftEmployee.value));
            if (!emp) return alert("Employee not found");
            
            entry = {
                ...entry,
                employee_id: emp.id,
                title: `${emp.name} - ${emp.shift || "Shift"}`, 
                shift: emp.shift,
                color: emp.color || "#059669"
            };
        } else {
            // Clear employee_id if not a shift entry (important for updates)
            entry.employee_id = null; 
            entry.shift = null;
            entry.color = null;
        }

        try {
            let error;
            
            if (currentEntryId) {
                // UPDATE OPERATION
                ({ error } = await supabaseClient
                    .from("calendar")
                    .update(entry)
                    .eq("id", currentEntryId));

            } else {
                // INSERT OPERATION
                ({ error } = await supabaseClient
                    .from("calendar")
                    .insert([entry]));
            }

            if (error) throw error;

            // Success: Reset state and reload entries
            closeModal();
            resetModalState(); 
            await loadCalendarEntries(); 
            
        } catch (err) {
            // Provide better context for the RLS error
            if (String(err.message).includes('violates row-level security policy')) {
                 alert("Error saving entry: The entry was blocked by security rules. Ensure your RLS allows INSERT/UPDATE when company_id is provided.");
            } else {
                 alert(`Error saving entry: ${err.message}`);
            }
           
        }
    });
  }
  
  // --- UI EVENT LISTENERS ---

  function populateEmployees() {
    if (!shiftEmployee) return;

    shiftEmployee.innerHTML = `<option value="">Select Employee</option>`;

    employees.forEach(emp => {
      const option = document.createElement("option");
      option.value = emp.id;
      option.textContent = `${emp.name} (${emp.shift || "Any"})`;
      
      const bgColor = emp.color || "#059669"; 
      const textColor = isLight(bgColor) ? "#000000" : "#ffffff"; 
      
      option.style.backgroundColor = bgColor;
      option.style.color = textColor;
      option.style.padding = "5px"; 

      shiftEmployee.appendChild(option);
    });
  }


  /* SHOW / HIDE EMPLOYEE FIELD AND TITLE INPUT */
  if (entryType) {
    entryType.addEventListener("change", () => {
      const isShift = entryType.value === "shift";
      const shiftLabel = document.getElementById("shiftLabel");
      
      // Visibility for Employee Select
      if (shiftEmployee) shiftEmployee.style.display = isShift ? "block" : "none";
      if (shiftLabel) shiftLabel.style.display = isShift ? "block" : "none";
      
      // Visibility for Title Input
      if (entryTitleInput) entryTitleInput.style.display = isShift ? "none" : "block";
    });
  }
  
  /* MONTH NAVIGATION */
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      loadCalendarEntries(); 
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      loadCalendarEntries(); 
    });
  }
  
  // Modal Close Listeners
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (closeEventsBtn) closeEventsBtn.addEventListener('click', closeEventsModal);
  if (addFromEventsBtn) {
      addFromEventsBtn.addEventListener('click', () => {
          const date = eventsModal.getAttribute('data-date');
          closeEventsModal();
          openModal(date);
      });
  }


  // --- INITIALIZATION ---
  loadEmployeesFromSupabase();
  loadCalendarEntries(); 
});