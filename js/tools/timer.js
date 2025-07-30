// js/tools/timer.js

import { playSound } from '../utils.js';

export function initTimer() {
    let timerInterval = null;
    let totalSeconds = 300;
    let initialSeconds = 300;
    let isTimerRunning = false;

    const timerDisplay = document.getElementById('timer-display');
    const startStopBtn = document.getElementById('timer-start-stop');
    const resetBtn = document.getElementById('timer-reset');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const customInput = document.getElementById('timer-custom-input');
    const setCustomBtn = document.getElementById('timer-set-custom-btn');
    const progress = document.getElementById('timer-progress');
    const timerThemeSelect = document.getElementById('timer-theme');
    const timerThemes = document.querySelectorAll('.timer-theme');
    const timerLayoutContainer = document.querySelector('.timer-layout-container');
    const waterLevel = document.querySelector('#timer-theme-bucket .water');
    
    const TIMER_THEME_KEY = 'brainPowerTimerTheme';

    function resetAllThemeStates() {
        // No complex states to reset anymore
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const percentageLeft = (initialSeconds > 0) ? (totalSeconds / initialSeconds) * 100 : 0;
        const selectedTheme = timerThemeSelect.value;
        
        if (selectedTheme === 'bar') { 
            progress.style.width = `${percentageLeft}%`; 
        } else if (selectedTheme === 'bucket') { 
            if (waterLevel) waterLevel.style.height = `${percentageLeft}%`; 
        }
    }

    function triggerEndAnimation() {
        playSound('assets/sounds/time-end.mp3');
    }

    function setTimer(seconds) {
        if (isTimerRunning) stopTimer();
        totalSeconds = Math.max(0, seconds);
        initialSeconds = Math.max(0, seconds);
        resetAllThemeStates();
        updateTimerDisplay();
    }

    function startTimer() {
        if (totalSeconds <= 0 || isTimerRunning) return;
        isTimerRunning = true;
        startStopBtn.textContent = 'Pause';
        
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            if (!isTimerRunning) return;
            totalSeconds--;
            updateTimerDisplay();
            if (totalSeconds <= 0) {
                stopTimer();
                triggerEndAnimation();
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        isTimerRunning = false;
        startStopBtn.textContent = 'Start';
    }

    startStopBtn.addEventListener('click', () => { if (isTimerRunning) { stopTimer(); } else { startTimer(); } });
    
    resetBtn.addEventListener('click', () => {
        setTimer(initialSeconds);
    });

    presetBtns.forEach(button => { button.addEventListener('click', () => { const seconds = parseInt(button.dataset.time, 10); setTimer(seconds); customInput.value = ''; }); });
    
    setCustomBtn.addEventListener('click', () => {
        const timeParts = customInput.value.split(':').map(part => parseInt(part, 10) || 0);
        let seconds = 0;
        if (timeParts.length === 2) { seconds = timeParts[0] * 60 + timeParts[1]; } 
        else if (timeParts.length === 1) { seconds = timeParts[0]; }
        setTimer(seconds);
    });

    timerThemeSelect.addEventListener('change', () => {
        const wasRunning = isTimerRunning;
        if (wasRunning) stopTimer();
        
        const selectedTheme = timerThemeSelect.value;
        timerThemes.forEach(theme => { 
            theme.classList.toggle('active', theme.id === `timer-theme-${selectedTheme}`); 
        });
        timerLayoutContainer.classList.toggle('side-by-side-theme-active', selectedTheme === 'bucket');
        
        localStorage.setItem(TIMER_THEME_KEY, selectedTheme);
        setTimer(initialSeconds); 
        
        if (wasRunning) startTimer();
    });
    
    function loadTimerTheme() {
        const savedTheme = localStorage.getItem(TIMER_THEME_KEY) || 'bar';
        // If a removed theme was saved, default to 'bar'
        if (savedTheme !== 'bar' && savedTheme !== 'bucket') {
            timerThemeSelect.value = 'bar';
        } else {
            timerThemeSelect.value = savedTheme;
        }
        timerThemeSelect.dispatchEvent(new Event('change'));
    }

    loadTimerTheme();
    setTimer(initialSeconds);
}