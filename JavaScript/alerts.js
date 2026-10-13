const alertsList = document.getElementById("alerts-list");

// Function to determine the CSS class based on the event's first tag
function getEventTypeClass(event) {
    const firstTag = event.tags[0];

    if (firstTag === "HOT FOOD") {
        return "hot-food";
    }

    if (firstTag === "SNACKS") {
        return "snacks";
    }

    if (firstTag === "DESSERT") {
        return "dessert";
    }

    return "hot-food";
}

// Function to determine the icon based on the event's first tag
function getEventIcon(event) {
    const firstTag = event.tags[0];

    if (firstTag === "HOT FOOD") {
        return "🍕";
    }

    if (firstTag === "SNACKS") {
        return "🥯";
    }

    if (firstTag === "DESSERT") {
        return "🧁";
    }

    if (firstTag === "DRINKS") {
        return "🥤";
    }

    return "🍽️";
}

// Function to format the event's start and end times
function formatEventTime(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const today = new Date();

    const sameDay =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();

    const isToday =
        start.getFullYear() === today.getFullYear() &&
        start.getMonth() === today.getMonth() &&
        start.getDate() === today.getDate();

    const dateLabel = isToday
        ? "Today"
        : start.toLocaleDateString([], {
              month: "short",
              day: "numeric"
          });

    const startTimeLabel = start.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });

    const endTimeLabel = end.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });

    if (sameDay) {
        return `${dateLabel}, ${startTimeLabel}–${endTimeLabel}`;
    }

    return `${dateLabel}, ${startTimeLabel} – ${end.toLocaleDateString([], {
        month: "short",
        day: "numeric"
    })}, ${endTimeLabel}`;
}

// Function to determine the status label based on the event's start time
function getStatusLabel(event) {

    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const now = new Date();

    // Event is currently active
    if (now >= start && now <= end) {
        return "Now";
    }

    // Start of today
    const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    // Start of tomorrow
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // Start of the day after tomorrow
    const dayAfterTomorrow = new Date(todayStart);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);


    // Event is later today
    if (start >= now && start < tomorrowStart) {
        return "Happening soon";
    }

    // Event is tomorrow
    if (start >= tomorrowStart && start < dayAfterTomorrow) {
        return "Tomorrow";
    }

    // Anything after tomorrow
    return start.toLocaleDateString([], {
        month: "short",
        day: "numeric"
    });
}

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
        const eventTypeClass = getEventTypeClass(event);
        const eventIcon = getEventIcon(event);
        const formattedTime = formatEventTime(event.startTime, event.endTime);
        const statusLabel = getStatusLabel(event);

        card.classList.add("alert-card");

        card.innerHTML = `
            <div class="alert-image ${eventTypeClass}">

                <div class="alert-status-pill">
                    <span class="status-dot"></span>
                    ${statusLabel}
                </div>

                ${
                    event.foodPhoto
                        ? `<img
                            src="${event.foodPhoto}"
                            alt="${event.name}"
                            class="alert-food-photo"
                        >`
                        : `
                            <div class="alert-food-circle">
                                <span class="alert-food-icon">${eventIcon}</span>
                            </div>
                        `
                }

            </div>
            <div class="alert-content">

                <div class="alert-top-row">
                    <p class="alert-category">
                        ${event.tags.join(" • ")}
                    </p>
                </div>

                <h2>
                    ${event.name}
                </h2>

                <p class="alert-host">
                    by ${event.reporter}
                </p>

                <p class="alert-description">
                    ${event.description}
                </p>

                <div class="alert-meta">
                    <span>📍 ${event.location}</span>
                    <span>🕒 ${formattedTime}</span>
                    <span>👥 Feeds about ${event.servings}</span>
                </div>

                <div class="alert-card-footer">
                    <span>💬 ${event.messageBoard ? "Messages enabled" : "No messages"}</span>

                    <a href="#">
                        View details →
                    </a>
                </div>

            </div>
        `;

        alertsList.appendChild(card);
    });
}

function loadLocalEvents() {
    const savedEvents =
        JSON.parse(localStorage.getItem("buzzBitezEvents")) || [];

    savedEvents.sort(function(a, b) {
        return new Date(a.startTime) - new Date(b.startTime);
    });

    displayEvents(savedEvents);
}

loadLocalEvents(); //change this to loadEvents() when the backend is ready