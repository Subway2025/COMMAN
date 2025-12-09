// timeclock.js - COMPLETE VERSION with On-Screen Numpad

document.addEventListener("DOMContentLoaded", () => {
    const supabaseClient = window.supabaseClient;
    const pinInput = document.getElementById("pinInput");
    const punchForm = document.getElementById("punchForm");
    const messageEl = document.getElementById("message");
    const timeEl = document.getElementById("current-time");

    if (!supabaseClient) {
        messageEl.textContent = "Error: Supabase client not loaded.";
        return;
    }

    // --- Time Display ---
    function updateTime() {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });
    }
    
    function loadTime() {
        updateTime();
        setInterval(updateTime, 1000); 
    }

    // --- Keypad Logic ---
    function setupNumpad() {
        document.querySelectorAll(".num-btn").forEach(button => {
            button.addEventListener("click", () => {
                const action = button.getAttribute("data-value");
                let pin = pinInput.value;
                
                // Clear any previous success/error message
                messageEl.textContent = ""; 

                switch (action) {
                    case "clear":
                        pinInput.value = "";
                        break;
                        
                    case "delete":
                        pinInput.value = pin.slice(0, -1); // Remove last character
                        break;
                        
                    default:
                        // Only allow input if PIN length is less than 6
                        if (pin.length < 6) {
                            pinInput.value = pin + action;
                        }
                        break;
                }
            });
        });
    }

    // --- Punch Handling ---
    punchForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const clickedButton = e.submitter;
        // Ensure the button is one of the punch actions
        if (!clickedButton.classList.contains('action-btn')) return;

        const punchType = clickedButton.getAttribute("data-type");
        const pin = pinInput.value.trim();

        if (pin.length < 4) {
            messageEl.textContent = "Please enter a 4-6 digit PIN.";
            return;
        }

        // 1. VALIDATE PIN and get employee_id
        const { data: employee, error: empError } = await supabaseClient
            .from("employees")
            .select("id, name")
            .eq("pin", pin)
            .eq("active", true)
            .single();

        if (empError || !employee) {
            messageEl.textContent = "Error: Invalid PIN or inactive employee.";
            pinInput.value = "";
            return;
        }

        const employeeId = employee.id;
        const employeeName = employee.name;

        // 2. LOG THE PUNCH
        const newPunch = {
            employee_id: employeeId,
            pin: pin,
            punch_type: punchType,
            punch_time: new Date().toISOString() 
        };

        const { error: punchError } = await supabaseClient
            .from("punches")
            .insert([newPunch]);

        if (punchError) {
            console.error("Punch logging error:", punchError);
            messageEl.textContent = `Error logging punch: ${punchError.message}`;
            return;
        }

        // 3. SUCCESS MESSAGE
        messageEl.textContent = `${employeeName} PUNCHED ${punchType.replace('_', ' ')} successfully!`;
        pinInput.value = "";
        
        // Clear message after 3 seconds
        setTimeout(() => {
            messageEl.textContent = "";
        }, 3000);
    });

    // --- INITIALIZATION ---
    loadTime();
    setupNumpad();
});