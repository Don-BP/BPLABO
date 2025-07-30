// js/main.js

import { toggleMute, updateAllFlashcardCategorySelects } from './utils.js';
import { initDateWeather } from './tools/date-weather.js';
import { initNamePicker } from './tools/name-picker.js';
import { initTimer } from './tools/timer.js';
import { initFlashcards } from './tools/flashcards.js';
import { Scoreboard } from './tools/scoreboard.js';
import { initWhatsMissing } from './tools/whats-missing.js';
import { initImageReveal } from './tools/image-reveal.js';
import { initFlashcardManager } from './tools/flashcard-manager.js';
import { initBingoPicker } from './tools/bingo-picker.js';
import { initDB } from './db.js';

// --- Global App Logic ---

function initializeAudio() {
    const muteBtn = document.getElementById('mute-btn');
    muteBtn.addEventListener('click', () => {
        const isNowMuted = toggleMute();
        muteBtn.innerHTML = isNowMuted ? '🔇' : '🔊';
        muteBtn.title = isNowMuted ? 'Unmute' : 'Mute';
    });
}

function initializeFullscreen() {
    document.querySelectorAll('.tool-card').forEach(card => {
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'fullscreen-btn';
        fullscreenBtn.title = 'Toggle Fullscreen';
        fullscreenBtn.innerHTML = '↗️'; 
        
        card.querySelector('h2').after(fullscreenBtn);

        fullscreenBtn.addEventListener('click', () => {
            toggleFullscreen(card);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            const fullscreenElement = document.querySelector('.tool-card.fullscreen-mode');
            if (fullscreenElement) {
                toggleFullscreen(fullscreenElement);
            }
        }
    });
}

function toggleFullscreen(card) {
    const isFullscreen = card.classList.toggle('fullscreen-mode');
    document.body.classList.toggle('has-fullscreen-tool', isFullscreen);
    
    const btn = card.querySelector('.fullscreen-btn');
    btn.innerHTML = isFullscreen ? '×' : '↗️';
    btn.title = isFullscreen ? 'Exit Fullscreen (Esc key)' : 'Toggle Fullscreen';
    
    // --- Module-specific fullscreen logic ---

    if (card.id === 'image-reveal-tool') {
        const statusElement = document.getElementById('ir-sequence-status');
        if (isFullscreen) {
            btn.before(statusElement);
        } else {
            const originalContainer = document.getElementById('ir-status-bar');
            originalContainer.prepend(statusElement);
        }
    }
    
    if (card.id === 'scoreboard-tool') {
        if (isFullscreen) {
            Scoreboard.enterFullscreen();
        } else {
            Scoreboard.exitFullscreen();
        }
    }
}

// --- App Initialization ---
async function initializeApp() {
    try {
        // Initialize DB first to catch any critical blocking issues early.
        await initDB();

        // Initialize global features
        initializeAudio();
        initializeFullscreen();
        await updateAllFlashcardCategorySelects();

        // Initialize each tool module
        initDateWeather();
        initNamePicker();
        initTimer();
        initFlashcards();
        Scoreboard.init();
        initWhatsMissing();
        initImageReveal();
        initFlashcardManager();
        initBingoPicker();

        console.log("ALT Helper Initialized!");
    } catch (error) {
        console.error("Failed to initialize the application:", error);
        // Display a user-friendly message on the page itself if init fails
        document.body.innerHTML = `<div style="padding: 2em; text-align: center; font-family: sans-serif;">
            <h1>Application Error</h1>
            <p>Could not start the ALT Helper. This might be because another tab is open or your browser is in private/incognito mode.</p>
            <p>Please close all other tabs with this application, exit private mode, and then <a href=".">refresh the page</a>.</p>
            <p><em>Error details: ${error}</em></p>
        </div>`;
    }
}

// Wait for the DOM to be fully loaded before running the app
document.addEventListener('DOMContentLoaded', initializeApp);