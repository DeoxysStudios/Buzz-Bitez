document.addEventListener("DOMContentLoaded", () => {
    const profileButton = document.getElementById("profile-button");

    if (!profileButton) return;

    const savedUser =
        localStorage.getItem("bb-user") ||
        sessionStorage.getItem("bb-user");

    if (!savedUser) return;

    try {
        const user = JSON.parse(savedUser);
        const name = user.full_name || user.username || "";

        if (!name.trim()) return;

        const parts = name.trim().split(/\s+/);

        const initials = parts.length > 1
            ? parts[0][0] + parts[parts.length - 1][0]
            : parts[0].slice(0, 2);

        profileButton.textContent = initials.toUpperCase();
        profileButton.href = "settings.html";

    } catch (error) {
        console.error("Could not load profile initials:", error);
    }
});