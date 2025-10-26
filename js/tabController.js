import dashboardController from './dashboardController.js';
import uiController from './uiController.js';
import reportController from './reportController.js';
import settingsController from './settingsController.js';

class TabController {
    constructor() {
        this.currentTab = 'dashboard';
        this.isDarkMode = false;
        this.initializeElements();
        this.attachEventListeners();
        this.initializeTabs();
        this.loadThemePreference();
    }

    initializeElements() {
        this.elements = {
            tabNavs: document.querySelectorAll('.tab-nav'),
            tabContents: document.querySelectorAll('.tab-content'),
            themeToggle: document.getElementById('theme-toggle'),
            body: document.body
        };
    }

    attachEventListeners() {
        this.elements.tabNavs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    initializeTabs() {
        // Set default tab
        this.switchTab('dashboard');
    }

    switchTab(tabId) {
        // Update navigation
        this.elements.tabNavs.forEach(tab => {
            const isActive = tab.getAttribute('data-tab') === tabId;
            tab.classList.toggle('active', isActive);
            tab.classList.toggle('border-blue-500', isActive);
            tab.classList.toggle('text-blue-600', isActive);
            tab.classList.toggle('border-transparent', !isActive);
            tab.classList.toggle('text-gray-500', !isActive);
        });

        // Update content
        this.elements.tabContents.forEach(content => {
            const isTargetTab = content.id === `${tabId}-tab`;
            content.classList.toggle('hidden', !isTargetTab);
        });

        this.currentTab = tabId;

        // Initialize tab-specific functionality
        this.initializeTabContent(tabId);
    }

    initializeTabContent(tabId) {
        switch (tabId) {
            case 'dashboard':
                // Dashboard is already initialized
                break;
            case 'data-entry':
                // Data entry form is already initialized
                break;
            case 'reports':
                // Reports functionality is already initialized
                break;
            case 'log':
                // Log functionality is already initialized
                break;
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        this.saveThemePreference();
    }

    applyTheme() {
        if (this.isDarkMode) {
            this.elements.body.classList.add('dark-theme');
            this.elements.body.classList.remove('light-theme');
        } else {
            this.elements.body.classList.add('light-theme');
            this.elements.body.classList.remove('dark-theme');
        }
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('theme-preference');
        if (savedTheme) {
            this.isDarkMode = savedTheme === 'dark';
        } else {
            // Default to system preference
            this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        this.applyTheme();
    }

    saveThemePreference() {
        localStorage.setItem('theme-preference', this.isDarkMode ? 'dark' : 'light');
    }

    getCurrentTab() {
        return this.currentTab;
    }
}

export default TabController;
