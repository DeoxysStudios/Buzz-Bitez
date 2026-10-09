// Switches settings sections without leaving settings.html
document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".settings-menu-link");
    const panels = document.querySelectorAll(".settings-panel");

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

            /* Bar at the top of the page that asks for signing up */
            const accountBar = document.getElementById("account-bar");
            if (accountBar && localStorage.getItem("bbLoggedIn") === "true") {
                accountBar.hidden = true;
            }

            const notificationToggles = [
                { element: document.getElementById("Text-toggle"), key: "bbTextNotifications" },
                { element: document.getElementById("email-toggle"), key: "bbEmailNotifications" }
            ];

            /* Little toggle buttons for the notifs page. Reuse for other settings */
            notificationToggles.forEach(({ element, key }) => {
                if (!element) return;

                element.checked = localStorage.getItem(key) === "true";

                element.addEventListener("change", () => {
                    localStorage.setItem(key, element.checked);
                });
            });

            showSection(id);
        });
    });

    // Placeholder "Edit" / "Change" links stay on the current section
    document.querySelectorAll(".settings-action").forEach(action => {
        action.addEventListener("click", event => event.preventDefault());
    });

    showSection(window.location.hash.replace("#", ""));
});