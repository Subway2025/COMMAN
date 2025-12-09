// tasktie.js - COMPLETE VERSION WITH IMMEDIATE DRAG-AND-DROP MOVEMENT

(function() {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        console.error("Supabase client is not loaded.");
        return;
    }

    const STATUSES = ["To Do", "In Progress", "Done", "Blocked"];
    let employees = [];
    let workOrders = [];
    let allTasks = [];
    let draggedTask = null; // State to hold the task being dragged

    // --- DOM Elements ---
    const kanbanBoard = document.getElementById("kanbanBoard");
    const modal = document.getElementById("addTaskModal");
    const form = document.getElementById("addTaskForm");
    const assignedToSelect = document.getElementById("assignedTo");
    const workOrderIdSelect = document.getElementById("workOrderId");
    const searchInput = document.getElementById("searchInput");


    // --- INITIAL DATA LOADING ---

    async function loadInitialData() {
        // Fetch Employees for assignment dropdown
        const { data: empData } = await supabaseClient.from("employees").select("id, name").eq("active", true);
        employees = empData || [];
        
        // Fetch Work Orders for linking dropdown
        const { data: woData } = await supabaseClient.from("work_orders").select("id, title").eq("status", "Open");
        workOrders = woData || [];
        
        populateDropdowns();
        loadTasks(); // Fetch and render tasks
    }
    
    // --- DROPDOWN POPULATION ---
    
    function populateDropdowns() {
        assignedToSelect.innerHTML = `<option value="">-- Unassigned --</option>`;
        employees.forEach(emp => {
            assignedToSelect.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
        });
        
        workOrderIdSelect.innerHTML = `<option value="">-- None --</option>`;
        workOrders.forEach(wo => {
            workOrderIdSelect.innerHTML += `<option value="${wo.id}">WO-${wo.id}: ${wo.title}</option>`;
        });
    }

    // --- RENDER FUNCTIONS ---
    
    function renderBoard(tasksToRender = allTasks) {
        kanbanBoard.innerHTML = '';
        
        // 1. Render Columns
        STATUSES.forEach(status => {
            const tasksInColumn = tasksToRender.filter(t => t.status === status);
            const statusKey = status.replace(/\s/g, ''); 
            
            const columnHTML = `
                <div class="kanban-column" data-status="${status}">
                    <div class="column-header" data-status="${status}">${status} (${tasksInColumn.length})</div>
                    <div id="column-${statusKey}" class="column-content" data-status="${status}">
                        </div>
                </div>
            `;
            kanbanBoard.insertAdjacentHTML('beforeend', columnHTML);
        });
        
        // 2. Inject Task Cards
        tasksToRender.forEach(task => renderTaskCard(task));
        
        // 3. Setup DnD Listeners (must be called after DOM is updated)
        setupDragAndDrop();
    }

    function renderTaskCard(task) {
        const statusKey = task.status.replace(/\s/g, '');
        const column = document.getElementById(`column-${statusKey}`);
        if (!column) return;

        const assignedName = task.assigned_employee?.name || 'Unassigned';
        const workOrderTitle = task.work_order_data?.title || 'None';
        const priorityClass = `priority-${task.priority}`;

        const cardHTML = `
            <div class="task-card ${priorityClass}" draggable="true" data-id="${task.id}" data-status="${task.status}">
                <h4>${task.title}</h4>
                <div class="task-info">
                    Assigned: <span class="assigned-user">${assignedName}</span><br>
                    Due: ${task.due_date || 'N/A'}
                    <span class="work-order-link">WO: ${workOrderTitle}</span>
                </div>
            </div>
        `;
        column.insertAdjacentHTML('beforeend', cardHTML);
    }

    // --- CRUD FUNCTIONS ---

    /* LOAD TASKS (Read) */
    async function loadTasks() {
        const { data, error } = await supabaseClient
            .from("tasks")
            .select(`
                *,
                assigned_employee:assigned_to (name),
                work_order_data:work_order_id (title)
            `)
            .order("priority", { ascending: false }); 

        if (error) return console.error("Supabase Load Error:", error);
        
        allTasks = data;
        renderBoard(allTasks);
    }

    /* ADD TASK (Create) */
    form.addEventListener("submit", async e => {
        e.preventDefault();

        const newTask = {
            title: document.getElementById("taskTitle").value.trim(),
            description: document.getElementById("taskDescription").value.trim(),
            priority: document.getElementById("taskPriority").value,
            due_date: document.getElementById("taskDueDate").value || null,
            assigned_to: document.getElementById("assignedTo").value || null,
            work_order_id: document.getElementById("workOrderId").value || null,
            status: "To Do"
        };

        const { error } = await supabaseClient
            .from("tasks")
            .insert([newTask]);

        if (error) return alert("Error creating task: " + error.message);

        modal.style.display = "none";
        form.reset();
        loadTasks();
    });
    
    /* UPDATE TASK STATUS (The function called by DnD) */
    async function updateTaskStatus(taskId, newStatus) {
        const { error } = await supabaseClient
            .from("tasks")
            .update({ status: newStatus })
            .eq("id", taskId);

        if (error) {
            console.error("Status Update Failed:", error);
            alert("Failed to update status.");
            return false;
        }
        return true;
    }


    // --- DRAG AND DROP LOGIC (FIXED FOR IMMEDIATE MOVEMENT) ---

    function setupDragAndDrop() {
        // 1. Task Card Listeners
        document.querySelectorAll('.task-card').forEach(task => {
            task.addEventListener('dragstart', e => {
                draggedTask = task;
                e.dataTransfer.setData('text/plain', task.getAttribute('data-id')); // Pass ID
                setTimeout(() => task.style.opacity = '0.5', 0);
            });
            task.addEventListener('dragend', () => {
                draggedTask.style.opacity = '1';
                draggedTask = null;
            });
        });

        // 2. Column Content Listeners (Drop Targets)
        document.querySelectorAll('.column-content').forEach(column => {
            column.addEventListener('dragover', e => {
                e.preventDefault(); // Required to allow dropping
                column.style.border = '2px dashed var(--primary-color)';
            });
            
            column.addEventListener('dragleave', () => {
                column.style.border = 'none';
            });

            column.addEventListener('drop', async e => {
                e.preventDefault();
                column.style.border = 'none';
                
                const taskId = e.dataTransfer.getData('text/plain'); 
                if (!taskId) return;

                const newStatus = column.getAttribute('data-status');

                // A. Update Supabase
                const success = await updateTaskStatus(taskId, newStatus);
                
                if (success) {
                    
                    // 🛑 FIX: Update the local state array immediately
                    const taskIndex = allTasks.findIndex(t => String(t.id) === taskId);
                    if (taskIndex !== -1) {
                        allTasks[taskIndex].status = newStatus;
                    }
                    
                    // B. Re-render the board using the updated local data
                    renderBoard(allTasks); 
                }
            });
        });
    }

    // --- UI EVENT HANDLERS ---
    
    // MODAL HANDLING
    document.getElementById("openModalBtn").onclick = () => { modal.style.display = "flex"; };
    modal.querySelector(".close").onclick = () => { modal.style.display = "none"; };
    window.onclick = (event) => { if (event.target == modal) { modal.style.display = "none"; } }

    /* SEARCH FILTERING */
    searchInput.addEventListener("input", e => {
        const val = e.target.value.toLowerCase();
        const filtered = allTasks.filter(task =>
            task.title.toLowerCase().includes(val) || 
            (task.description && task.description.toLowerCase().includes(val)) ||
            (task.assigned_employee && task.assigned_employee.name.toLowerCase().includes(val))
        );
        renderBoard(filtered);
    });


    // --- INITIALIZATION ---
    loadInitialData();
})();