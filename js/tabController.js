import dashboardController from './dashboardController.js';
import uiController from './uiController.js';
import reportController from './reportController.js';
import settingsController from './settingsController.js';

class TabController {
    constructor() {
        this.currentTab = 'dashboard';
        this.initializeElements();
        this.attachEventListeners();
        this.initializeTabs();
    }

    initializeElements() {
        this.elements = {
            tabNavs: document.querySelectorAll('.tab-nav'),
            tabContents: document.querySelectorAll('.tab-content')
        };
    }

    attachEventListeners() {
        this.elements.tabNavs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
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

    getCurrentTab() {
        return this.currentTab;
    }
}

export default new TabController();
