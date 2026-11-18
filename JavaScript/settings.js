// Switches settings sections without leaving settings.html

document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".settings-menu-link");
    const panels = document.querySelectorAll(".settings-panel");

    // Switch between settings sections
    function showSection(id) {
        const target = document.getElementById(id) ? id : "account";

        panels.forEach(panel => {
            panel.classList.toggle("active", panel.id === target);
        });

        links.forEach(link => {
            link.classList.toggle("active", link.dataset.section === target);
        });
    }

    links.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();

            const id = link.dataset.section;
            history.replaceState(null, "", "#" + id);

            showSection(id);
        });
    });

    // Get the currently logged-in user
    const savedUser =
        localStorage.getItem("bb-user") ||
        sessionStorage.getItem("bb-user");

    let currentUser = null;

    try {
        currentUser = savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
        console.error("Could not load user:", error);
    }

    // Account management
    const accountBar = document.getElementById("account-bar");
    const signupLink = document.getElementById("settings-signup");
    const profileSection = document.getElementById("settings-profile");
    const logoutCard = document.getElementById("logout-card");
    const logoutButton = document.getElementById("logout-button");

    if (currentUser && currentUser.username) {
        // Hide signup prompts
        if (accountBar) accountBar.hidden = true;
        if (signupLink) signupLink.hidden = true;

        // Show account information
        if (profileSection) profileSection.hidden = false;
        if (logoutCard) logoutCard.hidden = false;

        document.getElementById("profile-name").textContent =
            currentUser.full_name || currentUser.username;

        document.getElementById("profile-email").textContent =
            currentUser.email || "";

        document.getElementById("profile-username").textContent =
            currentUser.username;
    }

    // Log out
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("bb-user");
            sessionStorage.removeItem("bb-user");
            localStorage.removeItem("bbLoggedIn");

            window.location.href = "signup.html";
        });
    }

    // Notification toggles
    const notificationToggles = [
        {
            element: document.getElementById("Text-toggle"),
            key: "bbTextNotifications"
        },
        {
            element: document.getElementById("email-toggle"),
            key: "bbEmailNotifications"
        }
    ];

    notificationToggles.forEach(({ element, key }) => {
        if (!element) return;

        element.checked = localStorage.getItem(key) === "true";

        element.addEventListener("change", () => {
            localStorage.setItem(key, String(element.checked));
        });
    });

    // Placeholder Edit/Change links
    document.querySelectorAll('a.settings-action[href="#account"]').forEach(action => {
        action.addEventListener("click", event => {
            event.preventDefault();
        });
    });

    // Allergen preferences
    const userAllergenOptions = document.getElementById("user-allergen-options");
    const allergenSaveStatus = document.getElementById("allergen-save-status");

    if (userAllergenOptions) {
        const savedAllergens = loadUserAllergens();

        userAllergenOptions.innerHTML = ALLERGENS.map(allergen => `
            <label class="allergen-chip">
                <input
                    type="checkbox"
                    value="${allergen.id}"
                    ${savedAllergens.includes(allergen.id) ? "checked" : ""}
                >
                <span>${allergen.label}</span>
            </label>
        `).join("");

        userAllergenOptions.addEventListener("change", () => {
            const selected = Array.from(
                userAllergenOptions.querySelectorAll("input:checked")
            ).map(input => input.value);

            saveUserAllergens(selected);

            if (allergenSaveStatus) {
                allergenSaveStatus.textContent = "Saved.";
            }
        });
    }

    // Show the correct section when the page loads
    showSection(window.location.hash.replace("#", ""));
});
