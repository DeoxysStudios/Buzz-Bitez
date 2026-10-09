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

            const accountBar = document.getElementById("account-bar");
            if (accountBar && localStorage.getItem("bbLoggedIn") === "true") {
                accountBar.hidden = true;
            }
            showSection(id);
        });
    });

    // Placeholder "Edit" / "Change" links stay on the current section
    document.querySelectorAll(".settings-action").forEach(action => {
        action.addEventListener("click", event => event.preventDefault());
    });

    showSection(window.location.hash.replace("#", ""));
});