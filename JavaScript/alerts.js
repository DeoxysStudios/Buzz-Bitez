const alertsList = document.getElementById("alerts-list");

async function loadEvents() {
    try {
        const response = await fetch("http://127.0.0.1:8000/event"); // Replace with your actual API endpoint

        if (!response.ok) {
            throw new Error("Failed to load events");
        }

        const events = await response.json();

        displayEvents(events);

    } catch (error) {
        console.error("Error loading events:", error);
    }
}


function displayEvents(events) {

    alertsList.innerHTML = "";

    events.forEach(function(event) {

        const card = document.createElement("article");

        card.classList.add("alert-card");

        card.innerHTML = `
            <div class="alert-image">
                🍕
            </div>

            <div class="alert-content">

                <p class="alert-category">
                    ${event.tags.join(" • ")}
                </p>

                <h2>
                    ${event.name}
                </h2>

                <p class="alert-host">
                    Posted by ${event.reporter}
                </p>

                <p class="alert-description">
                    ${event.description}
                </p>

                <div class="alert-meta">
                    <span>📍 ${event.location}</span>
                    <span>❤️ ${event.likes.length} likes</span>
                </div>

                <div class="alert-card-footer">
                    <a href="#">
                        View details →
                    </a>
                </div>

            </div>
        `;

        alertsList.appendChild(card);
    });
}


loadEvents();