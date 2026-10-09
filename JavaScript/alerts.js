const alertsList = document.getElementById("alerts-list");

// Test data for events
const testEvents = [
    {
        tags: ["HOT FOOD"],
        name: "Pizza after the CS Club Meetup",
        reporter: "Computer Science Society",
        description: "We ordered a little too much!",
        location: "Innovation Hall · Room 204",
        likes: [1, 2, 3, 4, 5, 6, 7, 8]
    },

    {
        tags: ["SNACKS"],
        name: "Bagels & coffee study break",
        reporter: "Student Success Center",
        description: "Assorted bagels, spreads, fruit, and coffee.",
        location: "Main Library · Atrium",
        likes: [1, 2, 3]
    },

    {
        tags: ["DESSERT"],
        name: "Leftover cupcakes",
        reporter: "Student Activities",
        description: "Chocolate and vanilla cupcakes left over from today's event.",
        location: "Student Union · Lobby",
        likes: [1, 2]
    }
];


async function loadEvents() {
    try {
        const response = await fetch("http://127.0.0.1:8000/event"); // Replace with actual API endpoint

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

function loadTestEvents() {
    displayEvents(testEvents);
}

loadTestEvents(); //change this to loadEvents() when the backend is ready