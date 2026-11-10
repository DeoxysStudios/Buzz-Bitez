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