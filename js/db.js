// js/db.js

const DB_NAME = 'BrainPowerDB';
const STORE_NAME = 'flashcardSets';
const DB_VERSION = 4; // <-- FIX: Updated from 1 to 4 to match the existing database version.
let db;

/**
 * Initializes the IndexedDB database.
 * This function must be called and awaited before any other DB operations.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
export function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // This event is crucial for handling cases where another tab is blocking the DB upgrade.
        request.onblocked = () => {
            console.warn("Database open request is blocked. Please close other tabs with this application open.");
            alert("The application can't start because another tab is open. Please close all other tabs with this page and refresh.");
            reject("Database blocked");
        };

        request.onerror = (event) => {
            console.error("Database error:", event.target.error.message);
            reject("Database error: " + event.target.error.message);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                dbInstance.createObjectStore(STORE_NAME); // Key is the set name
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            // Handle cases where the connection is unexpectedly closed.
            db.onclose = () => {
                console.warn("Database connection closed.");
                db = null; // Reset the db variable
            };
            resolve(db);
        };
    });
}

/**
 * Saves or updates a flashcard set in the database.
 * @param {string} setName - The name of the set to save.
 * @param {Array} cards - The array of card objects.
 * @returns {Promise<void>}
 */
export function saveSet(setName, cards) {
    return new Promise(async (resolve, reject) => {
        try {
            await initDB();
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.put(cards, setName);

            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => {
                console.error("Error saving set (transaction error):", event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Retrieves all custom flashcard sets from the database.
 * @returns {Promise<Object>} A promise that resolves with an object containing all sets.
 */
export function getAllSets() {
    return new Promise(async (resolve, reject) => {
        await initDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const keyRequest = store.getAllKeys();
        const valueRequest = store.getAll();

        let keys, values;

        keyRequest.onsuccess = () => {
            keys = keyRequest.result;
            if (values !== undefined) complete();
        };

        valueRequest.onsuccess = () => {
            values = valueRequest.result;
            if (keys !== undefined) complete();
        };

        const errorHandler = (event) => {
            console.error("Error getting all sets:", event.target.error);
            reject(event.target.error);
        };
        keyRequest.onerror = errorHandler;
        valueRequest.onerror = errorHandler;
        
        function complete() {
            const allDecks = {};
            keys.forEach((key, index) => {
                allDecks[key] = values[index];
            });
            resolve(allDecks);
        }
    });
}

/**
 * Deletes a flashcard set from the database.
 * @param {string} setName - The name of the set to delete.
 * @returns {Promise<void>}
 */
export function deleteSet(setName) {
    return new Promise(async (resolve, reject) => {
        await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(setName);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error("Error deleting set:", event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Imports multiple decks, overwriting existing ones with the same name.
 * @param {Object} decks - An object where keys are set names and values are card arrays.
 * @returns {Promise<void>}
 */
export function importDecks(decks) {
    return new Promise(async (resolve, reject) => {
        await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = (event) => {
             console.error("Error during bulk import transaction:", event.target.error);
             reject(event.target.error);
        };
        transaction.onabort = () => {
            console.error("Bulk import transaction aborted.");
            reject(new Error("Import transaction was aborted."));
        };

        Object.entries(decks).forEach(([setName, cards]) => {
            store.put(cards, setName);
        });
    });
}