// js/utils.js

import { getAllSets } from './db.js';

// --- Shared State & Constants ---
let isMuted = false;
export const builtInFlashcardData = {};

// --- Shared Functions ---

/**
 * Toggles the global mute state.
 * @returns {boolean} The new mute state.
 */
export function toggleMute() {
    isMuted = !isMuted;
    return isMuted;
}

/**
 * Plays a sound file if the application is not muted.
 * @param {string} soundFile - The path to the audio file.
 */
export function playSound(soundFile) {
    if (!isMuted) {
        new Audio(soundFile).play().catch(e => console.error("Could not play sound:", e));
    }
}

/**
 * Retrieves all flashcard decks, combining built-in and custom ones from IndexedDB.
 * @returns {Promise<object>} A promise that resolves with an object containing all available flashcard decks.
 */
export async function getAvailableFlashcardDecks() {
    try {
        const customDecks = await getAllSets();
        return { ...builtInFlashcardData, ...customDecks };
    } catch (error) {
        console.error("Could not get flashcard decks from DB:", error);
        alert("There was a problem loading your custom flashcard sets. Please check the developer console for errors.");
        return { ...builtInFlashcardData }; // Return built-in decks as a fallback
    }
}

/**
 * Populates all relevant <select> elements with flashcard categories.
 */
export async function updateAllFlashcardCategorySelects() {
    const allDecks = await getAvailableFlashcardDecks();
    const selects = [
        document.getElementById('flashcard-category'),
        document.getElementById('whats-missing-category'),
        document.getElementById('fm-set-select'),
        document.getElementById('bingo-list-select')
    ];

    selects.forEach(selectElement => {
        if (!selectElement) return;

        const currentVal = selectElement.value;
        const isManager = selectElement.id === 'fm-set-select';
        const isBingo = selectElement.id === 'bingo-list-select';
        
        let firstOptionText = isManager ? '-- Create New Set --' : 'Select a category';
        if (isBingo) firstOptionText = '-- Custom List Below --';

        let firstOptionValue = '';
        if (isBingo) firstOptionValue = 'custom';
        
        selectElement.innerHTML = `<option value="${firstOptionValue}">${firstOptionText}</option>`;

        // Sort categories alphabetically for better UX
        const sortedCategories = Object.keys(allDecks).sort((a, b) => a.localeCompare(b));

        for (const category of sortedCategories) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            selectElement.appendChild(option);
        }

        // Try to restore previous selection
        if (selectElement.querySelector(`option[value="${currentVal}"]`)) {
            selectElement.value = currentVal;
        } else if (selectElement.options.length > 0) {
            selectElement.selectedIndex = 0;
        }
    });
}