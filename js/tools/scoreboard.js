// js/tools/scoreboard.js

import { playSound } from '../utils.js';

export const Scoreboard = {
    // --- Elements ---
    elements: {
        gridView: null,
        fullscreenContainer: null,
        fullscreenView: null,
        teams: {},
        resetBtn: null,
        fsResetBtn: null,
    },

    // --- State ---
    state: {
        scores: { 1: 0, 2: 0, 3: 0, 4: 0 },
        names: { 1: 'Team 1', 2: 'Team 2', 3: 'Team 3', 4: 'Team 4' },
        icons: { 1: '', 2: '', 3: '', 4: '' }
    },

    // --- Constants ---
    CONFIG: {
        STORAGE_KEY: 'altHelperScoreboard',
        // FIX: Replaced file paths with actual emojis. This is the core of the fix.
        ICONS: ['🍎', '🍌', '🐻', '🐱', '🐶', '🐸', '🦁', '🐵', '🐼', '🐷', '🐰', '⭐', '⚽', '🚗', '🚀', '🍕']
    },

    init() {
        this.elements.gridView = document.querySelector('.scoreboard-grid-view');
        this.elements.fullscreenContainer = document.getElementById('scoreboard-fullscreen-container');
        this.elements.fullscreenView = document.getElementById('scoreboard-fullscreen-view');
        this.elements.resetBtn = document.getElementById('reset-scores');
        this.elements.fsResetBtn = document.getElementById('fs-reset-scores-btn');

        for (let i = 1; i <= 4; i++) {
            this.elements.teams[i] = {
                nameEl: document.getElementById(`team${i}-name`),
                scoreEl: document.getElementById(`score-team${i}`),
                iconEl: document.getElementById(`team${i}-icon`), // This is the <div> for the icon
                addBtn: document.querySelector(`.score-btn[data-team='${i}'][data-amount='1']`),
                subBtn: document.querySelector(`.score-btn[data-team='${i}'][data-amount='-1']`),
            };
        }

        this.addEventListeners();
        this.loadState();
        this.renderAll();
    },

    addEventListeners() {
        // Listeners for Grid View
        for (let i = 1; i <= 4; i++) {
            const team = this.elements.teams[i];
            if (team) {
                if (team.addBtn) team.addBtn.addEventListener('click', () => this.updateScore(i, 1));
                if (team.subBtn) team.subBtn.addEventListener('click', () => this.updateScore(i, -1));
                if (team.nameEl) team.nameEl.addEventListener('blur', (e) => this.updateTeamName(i, e.target.textContent));
            }
        }
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.resetGame());
        }

        // Listener for Fullscreen Reset Button
        if (this.elements.fsResetBtn) {
            this.elements.fsResetBtn.addEventListener('click', () => this.resetGame());
        }

        // Event Delegation for Fullscreen Score Buttons
        if (this.elements.fullscreenView) {
            this.elements.fullscreenView.addEventListener('click', (e) => {
                const button = e.target.closest('.fs-score-btn');
                if (button) {
                    const teamId = parseInt(button.dataset.team, 10);
                    const amount = parseInt(button.dataset.amount, 10);
                    this.updateScore(teamId, amount);
                }
            });
        }
    },

    loadState() {
        const savedStateJSON = localStorage.getItem(this.CONFIG.STORAGE_KEY);
        if (savedStateJSON) {
            try {
                const savedState = JSON.parse(savedStateJSON);
                this.state = { ...this.state, ...savedState };
            } catch (e) {
                console.error("Could not parse scoreboard state from localStorage.", e);
            }
        }
        // Ensure icons are valid emojis from the list, or re-assign them.
        const areIconsInvalid = Object.values(this.state.icons).some(icon => !icon || !this.CONFIG.ICONS.includes(icon));
        if (areIconsInvalid) {
            this.assignRandomIcons();
        }
    },

    saveState() {
        localStorage.setItem(this.CONFIG.STORAGE_KEY, JSON.stringify(this.state));
    },
    
    assignRandomIcons() {
        const shuffledIcons = [...this.CONFIG.ICONS].sort(() => 0.5 - Math.random());
        for (let i = 1; i <= 4; i++) {
            this.state.icons[i] = shuffledIcons[i - 1];
        }
    },

    updateScore(teamId, amount) {
        const oldScore = this.state.scores[teamId] || 0;
        const newScore = Math.max(0, oldScore + amount);
        this.state.scores[teamId] = newScore;
        
        playSound(amount > 0 ? 'sounds/point-up.mp3' : 'sounds/point-down.mp3');
        this.renderAll();
        this.saveState();
    },

    updateTeamName(teamId, newName) {
        this.state.names[teamId] = newName.trim();
        this.renderAll();
        this.saveState();
    },

    resetGame() {
        if (confirm('Are you sure you want to reset all scores and assign new icons?')) {
            for (let i = 1; i <= 4; i++) {
                this.state.scores[i] = 0;
            }
            this.assignRandomIcons();
            playSound('sounds/reveal.mp3');
            this.renderAll();
            this.saveState();
        }
    },

    renderGridView() {
        for (let i = 1; i <= 4; i++) {
            const team = this.elements.teams[i];
            if (team && team.nameEl && team.scoreEl && team.iconEl) {
                team.nameEl.textContent = this.state.names[i];
                team.scoreEl.textContent = this.state.scores[i];
                team.iconEl.textContent = this.state.icons[i]; // Use textContent for emojis
            }
        }
    },

    renderFullscreenView() {
        if (!this.elements.fullscreenView) return;
        this.elements.fullscreenView.innerHTML = '';
        for (let i = 1; i <= 4; i++) {
            const teamCard = document.createElement('div');
            teamCard.className = `fs-team-card team-${i}`;
            
            teamCard.innerHTML = `
                <div class="fs-team-info">
                    <div class="fs-team-icon">${this.state.icons[i]}</div>
                    <span class="fs-team-name">${this.state.names[i]}</span>
                </div>
                <div class="fs-team-score">${this.state.scores[i]}</div>
                <div class="fs-score-controls">
                    <button class="fs-score-btn minus" data-team="${i}" data-amount="-1">-</button>
                    <button class="fs-score-btn plus" data-team="${i}" data-amount="1">+</button>
                </div>
            `;
            this.elements.fullscreenView.appendChild(teamCard);
        }
    },

    renderAll() {
        this.renderGridView();
        this.renderFullscreenView();
    },

    enterFullscreen() {
        if (this.elements.gridView) this.elements.gridView.classList.add('hidden');
        if (this.elements.fullscreenContainer) this.elements.fullscreenContainer.classList.remove('hidden');
    },

    exitFullscreen() {
        if (this.elements.gridView) this.elements.gridView.classList.remove('hidden');
        if (this.elements.fullscreenContainer) this.elements.fullscreenContainer.classList.add('hidden');
    }
};