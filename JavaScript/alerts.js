const SERVER_BASE_URL = "http://127.0.0.1:8000"; // TODO: Replace this url when we have an actual server
const SERVER_EVENTS_URL = SERVER_BASE_URL + "/events";

const alertsList = document.getElementById("alerts-list");

const discoverAlertsList = document.getElementById("discover-alerts-list");

const allergenFilterContainer = document.getElementById("alert-allergen-filter");
const allergenHiddenNote = document.getElementById("allergen-hidden-note");

let allEvents = [];
const pageHiddenAllergens = new Set();

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

    const start = new Date(event.times[0][0]);
    const end = new Date(event.times[0][1]);
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

function eventHasAnyAllergen(event, allergenIds) {
    return getEventAllergens(event).some(id => allergenIds.includes(id));
}

function updateHiddenNote(hiddenCount) {
    if (!allergenHiddenNote) return;

    if (hiddenCount === 0) {
        allergenHiddenNote.hidden = true;
        return;
    }

    const noun = hiddenCount === 1 ? "alert is" : "alerts are";
    allergenHiddenNote.innerHTML =
        `${hiddenCount} ${noun} hidden because of the allergens in your settings. ` +
        `<a href="settings.html#alert-settings">Manage allergens</a>`;
    allergenHiddenNote.hidden = false;
}

function renderAlerts() {
    if (!alertsList) return;

    const userAllergens = loadUserAllergens();
    const pageAllergens = Array.from(pageHiddenAllergens);

    const safeForUser = allEvents.filter(
        event => !eventHasAnyAllergen(event, userAllergens)
    );
    const visibleEvents = safeForUser.filter(
        event => !eventHasAnyAllergen(event, pageAllergens)
    );

    allEvents = events;
    renderAlerts();

    updateHiddenNote(allEvents.length - safeForUser.length);

    if (visibleEvents.length === 0 && allEvents.length > 0) {
        alertsList.innerHTML =
            `<p class="alerts-empty">No alerts match your allergen filters right now.</p>`;
    }
}

function renderAllergenFilter() {
    if (!allergenFilterContainer) return;

    const userAllergens = loadUserAllergens();

    allergenFilterContainer.innerHTML = ALLERGENS.map(allergen => {
        const fromSettings = userAllergens.includes(allergen.id);
        const checked = fromSettings || pageHiddenAllergens.has(allergen.id);

        return `
            <label
                class="allergen-chip${fromSettings ? " is-locked" : ""}"
                ${fromSettings ? 'title="Hidden by your allergen settings"' : ""}
            >
                <input
                    type="checkbox"
                    value="${allergen.id}"
                    ${checked ? "checked" : ""}
                    ${fromSettings ? "disabled" : ""}
                >
                <span>${allergen.label}</span>
            </label>
        `;
    }).join("");
}

function refreshAllergenViews() {
    renderAllergenFilter();
    renderAlerts();
}

if (allergenFilterContainer) {
    allergenFilterContainer.addEventListener("change", event => {
        const input = event.target;

        if (input.checked) {
            pageHiddenAllergens.add(input.value);
        } else {
            pageHiddenAllergens.delete(input.value);
        }

        renderAlerts();
    });

    window.addEventListener("storage", event => {
        if (event.key === ALLERGEN_STORAGE_KEY) {
            refreshAllergenViews();
        }
    });

    window.addEventListener("pageshow", event => {
        if (event.persisted) {
            refreshAllergenViews();
        }
    });

    renderAllergenFilter();
}

async function loadEvents() {
    try {
        const response = await fetch(SERVER_EVENTS_URL);

        if (!response.ok) {
            throw new Error("Failed to load events");
        }

        const events = await response.json();

        displayEvents(events, alertsList);

    } catch (error) {
        console.error("Error loading events:", error);
    }
}

function displayEvents(events, container) {

    container.innerHTML = "";

    events.forEach(function(event) {

        const card = document.createElement("article");
        const eventTypeClass = getEventTypeClass(event);
        const eventIcon = getEventIcon(event);
        const formattedTime = formatEventTime(event.times[0][0], event.times[0][1]);
        const statusLabel = getStatusLabel(event);

        card.classList.add("alert-card");

        card.innerHTML = `
            <div class="alert-image ${eventTypeClass}">

                <div class="alert-status-pill">
                    <span class="status-dot"></span>
                    ${statusLabel}
                </div>

                ${
                    event.image
                        ? `<img
                            src="${event.image}"
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

        container.appendChild(card);
    });
}

loadEvents();