import uiController from './uiController.js';

class TabController {
    constructor(dashboardController, uiController) {
        this.currentTab = 'dashboard';
        this.dashboardController = dashboardController;
        this.uiController = uiController;
        this.initializeElements();
        this.attachEventListeners();
        this.initializeTabs();
    }

    initializeTabContent(tabId) {
        switch (tabId) {
            case 'dashboard':
                // Dashboard is already initialized
                break;
            case 'data-entry':
                this.uiController.setInitialDate();
                break;
            case 'reports':
                // Reports functionality is already initialized
                break;
            case 'log':
                this.dashboardController.populateFilters();
                break;
        }
    }
}

export default TabController;
