// Switches settings sections without leaving settings.html

document.addEventListener("DOMContentLoaded", async () => {
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

    // Get the currently logged-in user from FastAPI
    async function getCurrentUser() {
        try {
            const response = await fetch("http://localhost:8000/me", { credentials: "include" });
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error("Could not load user:", error);
            return null;
        }
    }

    // Account management
    const accountBar = document.getElementById("account-bar");
    const signupLink = document.getElementById("settings-signup");
    const profileSection = document.getElementById("settings-profile");
    const logoutCard = document.getElementById("logout-card");
    const logoutButton = document.getElementById("logout-button");

    // Display account information from the backend session
    const currentUser = await getCurrentUser();

    if (currentUser && currentUser.username) {
        if (accountBar) accountBar.hidden = true;
        if (signupLink) signupLink.hidden = true;
        if (profileSection) profileSection.hidden = false;
        if (logoutCard) logoutCard.hidden = false;

        document.getElementById("profile-name").textContent = currentUser.full_name || currentUser.username;
        document.getElementById("profile-email").textContent = currentUser.email || "";
        document.getElementById("profile-username").textContent = currentUser.username;
    } else {
        if (accountBar) accountBar.hidden = false;
        if (signupLink) signupLink.hidden = false;
        if (profileSection) profileSection.hidden = true;
        if (logoutCard) logoutCard.hidden = true;
    }

    // Log out
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                const response = await fetch("http://localhost:8000/logout", { method: "POST", credentials: "include" });
                if (!response.ok) throw new Error("Logout failed");

                localStorage.removeItem("bb-user");
                sessionStorage.removeItem("bb-user");
                localStorage.removeItem("bbLoggedIn");
                sessionStorage.removeItem("bbLoggedIn");

                window.location.href = "signup.html#login";
            } catch (error) {
                console.error("Logout error:", error);
                alert("Could not log out. Please try again.");
            }
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
