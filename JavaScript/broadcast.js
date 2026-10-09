// using localStorage to save the event data for testing purposes

// Get references to the form and its input fields
const startTimeInput = document.getElementById("start-time");
const endTimeInput = document.getElementById("end-time");
const broadcastForm = document.getElementById("broadcast-form");
const broadcastStatus = document.getElementById("broadcast-status");
const eventDateInput = document.getElementById("event-date");
const foodPhotoInput = document.getElementById("food-photo");


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

// Call the function to set the minimum date and time when the page loads
setMinimumDateTime();

startTimeInput.addEventListener("change", function() {

    endTimeInput.min = startTimeInput.value;

    if (
        endTimeInput.value &&
        endTimeInput.value < startTimeInput.value
    ) {
        endTimeInput.value = "";
    }
});

// Function to save the new event to localStorage
function saveTestEvent(newEvent) {
    let savedEvents =JSON.parse(localStorage.getItem("buzzBitezEvents")) || [];
    savedEvents.push(newEvent);
    localStorage.setItem("buzzBitezEvents", JSON.stringify(savedEvents));
}

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
        `${eventDateInput.value}T${startTimeInput.value}`;

    const endDateTime =
        `${eventDateInput.value}T${endTimeInput.value}`;

    const newEvent = {
        tags: [
            document.getElementById("food-type").value
        ],

        name:
            document.getElementById("event-title").value,

        reporter:
            "Current User",

        description:
            document.getElementById("description").value,

        location:
            document.getElementById("location").value,

        servings:
            Number(document.getElementById("servings").value),

        startTime: startDateTime,

        endTime: endDateTime,

        foodPhoto: foodPhoto,

        messageBoard:
            document.getElementById("message-board").checked,

        directMessages:
            document.getElementById("direct-messages").checked,

        likes: []
    };

    saveTestEvent(newEvent);

    broadcastStatus.textContent =
        "Food alert broadcast successfully!";

    broadcastForm.reset();
});