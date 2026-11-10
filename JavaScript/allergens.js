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

function allergenToTag(id) {
    return ALLERGEN_TAG_PREFIX + id;
}

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

function loadUserAllergens() {
    try {
        const saved = JSON.parse(localStorage.getItem(ALLERGEN_STORAGE_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function saveUserAllergens(ids) {
    try {
        localStorage.setItem(ALLERGEN_STORAGE_KEY, JSON.stringify(ids));
    } catch {}
}