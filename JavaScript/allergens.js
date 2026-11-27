const SERVER_BASE_URL = "http://127.0.0.1:8000"; // TODO: Replace this url when we have an actual server
const SERVER_USERS_URL = SERVER_BASE_URL + "/users";

const ALLERGENS = [
    { id: "gluten",    label: "Gluten" },
    { id: "dairy",     label: "Dairy" },
    { id: "shellfish", label: "Shellfish" },
    { id: "peanuts",   label: "Peanuts" },
    { id: "tree-nuts", label: "Tree nuts" },
    { id: "eggs",      label: "Eggs" },
    { id: "sesame",    label: "Sesame" },
    { id: "soy",       label: "Soy" },
];

const ALLERGEN_TAG_PREFIX = "allergen:";
const ALLERGEN_STORAGE_KEY = "bbAllergens";

const getUser = () => {
    try { return JSON.parse(localStorage.getItem("bb-user") || sessionStorage.getItem("bb-user")); }
    catch { return null; }
};

function allergenToTag(id) {
    return ALLERGEN_TAG_PREFIX + id;
}

function getEventAllergens(event) {
    const knownIds = ALLERGENS.map(a => a.id);
    return (event.tags || [])
        .filter(tag => tag.startsWith(ALLERGEN_TAG_PREFIX))
        .map(tag => tag.slice(ALLERGEN_TAG_PREFIX.length))
        .filter(id => knownIds.includes(id));
}

function getAllergenLabel(id) {
    const match = ALLERGENS.find(a => a.id === id);
    return match ? match.label : id;
}

async function loadUserAllergens() {
    try {
        const user = getUser();
        if (!user)
            throw Error('Current user is not logged in.');
        const response = await fetch(`${SERVER_USERS_URL}/${user['username']}`);
        if (!response.ok)
            throw Error(`Failed to load logged in user.`);
        const saved = user['allergens'];
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

async function saveUserAllergens(ids) {
    try {
        const user = getUser();
        if (!user)
            throw Error('Current user is not logged in.');
        const data = {
            allergens: ids
        };
        const response = await fetch(`${SERVER_USERS_URL}/${user['username']}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        if (!response.ok)
            throw Error(`Failed to update user allergens.`);
    } catch {}
}