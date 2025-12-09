// employee.js

(function() {
  // Ensure the supabaseClient is available from the supabase-init.js file
  const supabaseClient = window.supabaseClient;

  let allEmployees = [];
  let view = "cards"; 

  // --- CRUD FUNCTIONS ---

  /* 1. DELETE EMPLOYEE (Soft Delete) */
  async function deleteEmployee(employeeId, employeeName) {
    if (!confirm(`Are you sure you want to deactivate employee: ${employeeName}?`)) {
      return;
    }

    // Perform the soft delete by setting 'active' to false
    const { error } = await supabaseClient
      .from("employees")
      .update({ active: false })
      .eq("id", employeeId);

    if (error) {
      console.error("Deletion Error:", error);
      return alert("Error deactivating employee: " + error.message);
    }

    // Reload the list to reflect the change
    loadEmployees();
  }


  /* 2. LOAD EMPLOYEES (Read) */
  async function loadEmployees() {
    // Select all columns from the 'employees' table
    const { data, error } = await supabaseClient
      .from("employees")
      // Only fetch employees where 'active' is true
      .select("*") 
      .eq("active", true)
      .order("name");

    if (error) return console.error("Supabase Load Error:", error);

    allEmployees = data;
    renderEmployees(data);
  }

  /* 3. ADD EMPLOYEE (Create) */
  const form = document.getElementById("addEmployeeForm");
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const role = document.getElementById("role").value.trim();
    const pin = document.getElementById("pin").value.trim();
    const shift = document.getElementById("employeeShift").value; 
    const color = document.getElementById("employeeColor").value;

    const newEmployee = { 
      name, 
      role, 
      pin, 
      shift, 
      color, 
      active: true // Ensure new employees are active
    };

    const { error } = await supabaseClient
      .from("employees")
      .insert([newEmployee]); // Insert the new employee object

    if (error) return alert("Error adding employee: " + error.message);

    document.getElementById("addEmployeeModal").style.display = "none";
    form.reset();
    loadEmployees(); // Reload and re-render the list
  });


  // --- RENDERING & UI FUNCTIONS ---

  /* RENDER EMPLOYEES */
  function renderEmployees(data) {
    const list = document.getElementById("employee-list");
    list.innerHTML = "";

    if (view === "cards") {
      // 1. CARD VIEW (Grid)
      list.className = "employee-grid";

      data.forEach(emp => {
        const card = document.createElement("div");
        card.className = "employee-card";
        // Use the employee's color for a distinct visual border
        card.style.borderLeft = `4px solid ${emp.color || "#059669"}`; 

        card.innerHTML = `
          <h3>${emp.name}</h3>
          <p>Role: ${emp.role || "N/A"}</p>
          <p>Shift: ${emp.shift || "Any"}</p>
          <div class="employee-actions">
              <button class="btn-delete" data-id="${emp.id}" data-name="${emp.name}">Deactivate</button>
          </div>
        `;

        list.appendChild(card);
      });

    } else {
      // 2. TABLE VIEW
      list.className = ""; // Clear grid class
      
      const table = document.createElement("table");
      table.className = "employee-table";
      
      table.innerHTML = `
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Shift</th>
            <th>PIN</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      `;

      const tbody = table.querySelector("tbody");
      data.forEach(emp => {
        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${emp.name}</td>
          <td>${emp.role || "N/A"}</td>
          <td>${emp.shift || "Any"}</td>
          <td>${emp.pin ? '******' : 'N/A'}</td>
          <td><button class="btn-delete btn-orange" data-id="${emp.id}" data-name="${emp.name}">Deactivate</button></td>
        `;
      });
      list.appendChild(table);
    }
    
    // Attach event listeners to all newly created delete buttons
    document.querySelectorAll(".btn-delete").forEach(button => {
      button.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        const name = e.target.getAttribute("data-name");
        deleteEmployee(id, name);
      });
    });
  }


  // --- UI EVENT HANDLERS ---

  /* MODAL HANDLING */
  const modal = document.getElementById("addEmployeeModal");
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalSpan = modal.querySelector(".close");

  openModalBtn.onclick = () => {
    modal.style.display = "block";
  };

  closeModalSpan.onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }


  /* VIEW TOGGLE */
  document.getElementById("toggleViewBtn").addEventListener("click", () => {
      view = view === "cards" ? "table" : "cards";
      document.getElementById("toggleViewBtn").textContent = 
          view === "cards" ? "Switch View to Table" : "Switch View to Cards";
      // Re-render the current data in the new view
      renderEmployees(allEmployees); 
  });


  /* SEARCH FILTERING */
  document.getElementById("searchInput").addEventListener("input", e => {
    const val = e.target.value.toLowerCase();
    const filtered = allEmployees.filter(emp =>
      emp.name.toLowerCase().includes(val) || 
      (emp.role && emp.role.toLowerCase().includes(val)) ||
      (emp.shift && emp.shift.toLowerCase().includes(val))
    );
    renderEmployees(filtered);
  });


  // --- INITIALIZATION ---
  // Start the entire process by loading employees when the script runs
  loadEmployees();
})();