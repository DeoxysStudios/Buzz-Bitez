const SERVER_BASE_URL = "http://127.0.0.1:8000"; // TODO: Replace this url when we have an actual server
const SERVER_EVENTS_URL = SERVER_BASE_URL + "/events";

// Get references to the form and its input fields
const startTimeInput = document.getElementById("start-time");
const endTimeInput = document.getElementById("end-time");
const broadcastForm = document.getElementById("broadcast-form");
const broadcastStatus = document.getElementById("broadcast-status");
const eventDateInput = document.getElementById("event-date");
const foodPhotoInput = document.getElementById("food-photo");
const allergenOptions = document.getElementById("allergen-options");


// Set the minimum date and time for the start and end time inputs to the current date and time
function setMinimumDateTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const currentDateTime =
        `${year}-${month}-${day}T${hours}:${minutes}`;

    startTimeInput.min = currentDateTime;
    endTimeInput.min = currentDateTime;
}

// Get the logged in user
const getUser = () => {
    try { return JSON.parse(localStorage.getItem("bb-user") || sessionStorage.getItem("bb-user")); }
    catch { return null; }
};

// Call the function to set the minimum date and time when the page loads
setMinimumDateTime();

function renderAllergenOptions() {
    allergenOptions.innerHTML = ALLERGENS.map(allergen => `
        <label class="allergen-chip">
            <input type="checkbox" name="allergens" value="${allergen.id}">
            <span>${allergen.label}</span>
        </label>
    `).join("");
}

renderAllergenOptions();

function getSelectedAllergenTags() {
    return Array.from(
        allergenOptions.querySelectorAll('input[name="allergens"]:checked')
    ).map(input => allergenToTag(input.value));
}

startTimeInput.addEventListener("change", function() {

    endTimeInput.min = startTimeInput.value;

    if (
        endTimeInput.value &&
        endTimeInput.value < startTimeInput.value
    ) {
        endTimeInput.value = "";
    }
});

// Function to read the image file and return a data URL
function readImageFile(file) {
    return new Promise(function(resolve, reject) {

        const reader = new FileReader();

        reader.onload = function() {
            resolve(reader.result);
        };

        reader.onerror = function() {
            reject(reader.error);
        };

        reader.readAsDataURL(file);
    });
}

// Handle form submission
broadcastForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    let foodPhoto = null;

    if (foodPhotoInput.files.length > 0) {
        foodPhoto = await readImageFile(foodPhotoInput.files[0]);
    }

    const startDateTime =
        `${eventDateInput.value}T${startTimeInput.value}` + getLocalOffsetString();

    const endDateTime =
        `${eventDateInput.value}T${endTimeInput.value}` + getLocalOffsetString();

    const user = getUser();

    const data = {
         tags: [
            document.getElementById("food-type").value,
            ...getSelectedAllergenTags()
        ],

        name:
            document.getElementById("event-title").value,

        reporter:
            user['username'],

        description:
            document.getElementById("description").value,

        location:
            document.getElementById("location").value,

        servings:
            Number(document.getElementById("servings").value),

        food_type:
            document.getElementById("food-type").value,

        times: [ [startDateTime, endDateTime] ],

        image: foodPhoto,

        enable_message_board:
            document.getElementById("message-board").checked,

        allow_direct_messages:
            document.getElementById("direct-messages").checked,
    };

    const response = await fetch(SERVER_EVENTS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok)
        throw Error(`Failed to upload new event. Status: ${response.status}`);

    broadcastStatus.textContent =
        "Food alert broadcast successfully!";

    broadcastForm.reset();
});



// Written by Gemini https://share.gemini.google/YLmtfugMpKK8
function getLocalOffsetString(date = new Date()) {
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);

    const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
    const minutes = String(absMinutes % 60).padStart(2, '0');

    return `${sign}${hours}:${minutes}`;
}